-- Phase 4: EHS Core Reporting Engine enhancements
-- Extends shared ehs_events (not five separate CRUD tables)

insert into public.event_types (organization_id, code, name, feature_code, description, is_system, sort_order)
values
  (null, 'safety_observation', 'Safety Observation', 'hazard_reporting',
   'Positive or negative safety observations', true, 60)
on conflict do nothing;

insert into public.features (code, name, description, category, value_type)
values ('safety_observation', 'Safety Observation', 'Safety observation reporting', 'module', 'boolean')
on conflict (code) do nothing;

insert into public.plan_features (plan_id, feature_id, enabled, limit_value, unlimited)
select p.id, f.id, true, null, false
from public.plans p
cross join public.features f
where f.code = 'safety_observation'
  and exists (
    select 1 from public.plan_features pf
    join public.features hf on hf.id = pf.feature_id
    where pf.plan_id = p.id and hf.code = 'hazard_reporting' and pf.enabled = true
  )
on conflict do nothing;

alter table public.ehs_events
  add column if not exists requires_capa boolean not null default false,
  add column if not exists potential_severity_id uuid references public.severity_levels (id),
  add column if not exists latitude numeric,
  add column if not exists longitude numeric,
  add column if not exists source text not null default 'web',
  add column if not exists observation_polarity text;

do $$ begin
  alter table public.ehs_events
    add constraint ehs_events_source_check
    check (source in ('web', 'field', 'api', 'import', 'email'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.ehs_events
    add constraint ehs_events_observation_polarity_check
    check (observation_polarity is null or observation_polarity in ('positive', 'negative', 'neutral'));
exception when duplicate_object then null;
end $$;

alter table public.severity_levels
  add column if not exists description text,
  add column if not exists score integer,
  add column if not exists sort_order integer not null default 0;

update public.severity_levels set sort_order = rank, score = coalesce(score, rank * 25);

create table if not exists public.report_status_definitions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  event_type_id uuid references public.event_types (id) on delete cascade,
  code text not null,
  label text not null,
  description text,
  color_token text,
  sort_order integer not null default 0,
  is_terminal boolean not null default false,
  is_active boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists report_status_defs_system_uidx
  on public.report_status_definitions (event_type_id, code)
  where organization_id is null;

create unique index if not exists report_status_defs_org_uidx
  on public.report_status_definitions (organization_id, event_type_id, code)
  where organization_id is not null;

create table if not exists public.report_custom_field_definitions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  event_type_id uuid not null references public.event_types (id) on delete cascade,
  code text not null,
  label text not null,
  field_type text not null
    check (field_type in (
      'text', 'long_text', 'number', 'date', 'datetime', 'boolean',
      'single_select', 'multi_select', 'user', 'site', 'project',
      'department', 'location', 'attachment'
    )),
  options jsonb not null default '[]'::jsonb,
  help_text text,
  is_required boolean not null default false,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, event_type_id, code)
);

create table if not exists public.report_custom_field_values (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  event_id uuid not null references public.ehs_events (id) on delete cascade,
  field_definition_id uuid not null references public.report_custom_field_definitions (id) on delete cascade,
  value_text text,
  value_number numeric,
  value_boolean boolean,
  value_date timestamptz,
  value_json jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (event_id, field_definition_id)
);

create index if not exists report_custom_field_values_org_idx
  on public.report_custom_field_values (organization_id);
create index if not exists report_custom_field_values_event_idx
  on public.report_custom_field_values (event_id);

alter table public.number_sequences
  add column if not exists include_year boolean not null default true,
  add column if not exists format_pattern text;

insert into public.report_status_definitions (organization_id, event_type_id, code, label, sort_order, is_terminal)
select null, et.id, s.code, s.label, s.sort_order, s.is_terminal
from public.event_types et
cross join (values
  ('draft', 'Draft', 10, false),
  ('submitted', 'Submitted', 20, false),
  ('triage', 'Under Review', 30, false),
  ('investigation', 'Investigation', 40, false),
  ('capa', 'CAPA', 50, false),
  ('verification', 'Verification', 60, false),
  ('approval', 'Approval', 70, false),
  ('closed', 'Closed', 80, true),
  ('reopened', 'Reopened', 90, false),
  ('cancelled', 'Cancelled', 100, true)
) as s(code, label, sort_order, is_terminal)
where et.organization_id is null
  and et.code in ('incident', 'near_miss', 'hazard', 'unsafe_act', 'unsafe_condition', 'safety_observation')
on conflict do nothing;

create table if not exists public.report_category_templates (
  id uuid primary key default gen_random_uuid(),
  event_type_code text not null,
  code text not null,
  name text not null,
  sort_order integer not null default 0,
  unique (event_type_code, code)
);

insert into public.report_category_templates (event_type_code, code, name, sort_order) values
  ('incident', 'first_aid', 'First Aid', 10),
  ('incident', 'medical_treatment', 'Medical Treatment', 20),
  ('incident', 'lost_time', 'Lost Time Injury', 30),
  ('incident', 'fatality', 'Fatality', 40),
  ('incident', 'property_damage', 'Property Damage', 50),
  ('incident', 'environmental', 'Environmental Incident', 60),
  ('incident', 'fire', 'Fire', 70),
  ('incident', 'vehicle', 'Vehicle', 80),
  ('incident', 'electrical', 'Electrical', 90),
  ('incident', 'fall', 'Fall', 100),
  ('incident', 'struck_by', 'Struck By', 110),
  ('incident', 'caught_in', 'Caught In', 120),
  ('incident', 'other', 'Other', 999),
  ('near_miss', 'process', 'Process', 10),
  ('near_miss', 'behavioral', 'Behavioral', 20),
  ('near_miss', 'equipment', 'Equipment', 30),
  ('near_miss', 'other', 'Other', 999),
  ('hazard', 'physical', 'Physical', 10),
  ('hazard', 'chemical', 'Chemical', 20),
  ('hazard', 'electrical', 'Electrical', 30),
  ('hazard', 'ergonomic', 'Ergonomic', 40),
  ('hazard', 'other', 'Other', 999),
  ('unsafe_act', 'ppe', 'PPE Non-compliance', 10),
  ('unsafe_act', 'procedure', 'Procedure Bypass', 20),
  ('unsafe_act', 'positioning', 'Unsafe Positioning', 30),
  ('unsafe_act', 'other', 'Other', 999),
  ('unsafe_condition', 'housekeeping', 'Housekeeping', 10),
  ('unsafe_condition', 'guarding', 'Missing Guarding', 20),
  ('unsafe_condition', 'access', 'Access / Egress', 30),
  ('unsafe_condition', 'other', 'Other', 999),
  ('safety_observation', 'positive', 'Positive Observation', 10),
  ('safety_observation', 'improvement', 'Improvement Opportunity', 20),
  ('safety_observation', 'other', 'Other', 999)
on conflict do nothing;

alter table public.capa_items drop constraint if exists capa_items_source_module_check;
alter table public.capa_items
  add constraint capa_items_source_module_check
  check (source_module in (
    'incident', 'near_miss', 'hazard', 'unsafe_act', 'unsafe_condition',
    'safety_observation', 'ehs_report', 'risk_assessment', 'inspection',
    'audit', 'permit', 'training', 'contractor', 'other', 'action_item'
  ));

create or replace function public.seed_org_report_categories(p_organization_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.event_categories (organization_id, event_type_id, code, name, is_active)
  select p_organization_id, et.id, t.code, t.name, true
  from public.report_category_templates t
  join public.event_types et on et.code = t.event_type_code and et.organization_id is null
  on conflict (organization_id, event_type_id, code) do nothing;
end;
$$;

create or replace function public.next_event_number(
  p_organization_id uuid,
  p_sequence_key text,
  p_prefix text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_value bigint;
  v_pad integer;
  v_include_year boolean;
  v_year text;
  v_prefix text;
begin
  insert into public.number_sequences (organization_id, sequence_key, prefix, current_value, pad_length, include_year)
  values (p_organization_id, p_sequence_key, p_prefix, 0, 5, true)
  on conflict (organization_id, sequence_key) do nothing;

  update public.number_sequences
  set current_value = current_value + 1,
      updated_at = timezone('utc', now()),
      prefix = coalesce(nullif(prefix, ''), p_prefix)
  where organization_id = p_organization_id
    and sequence_key = p_sequence_key
  returning current_value, pad_length, include_year, prefix
  into v_value, v_pad, v_include_year, v_prefix;

  v_year := to_char(timezone('utc', now()), 'YYYY');
  if coalesce(v_include_year, true) then
    return v_prefix || v_year || '-' || lpad(v_value::text, coalesce(v_pad, 5), '0');
  end if;
  return v_prefix || lpad(v_value::text, coalesce(v_pad, 5), '0');
end;
$$;

grant execute on function public.next_event_number(uuid, text, text) to authenticated;

alter table public.report_status_definitions enable row level security;
alter table public.report_custom_field_definitions enable row level security;
alter table public.report_custom_field_values enable row level security;
alter table public.report_category_templates enable row level security;

drop policy if exists report_status_defs_select on public.report_status_definitions;
create policy report_status_defs_select on public.report_status_definitions
  for select using (
    organization_id is null
    or public.is_org_member(organization_id)
    or public.is_platform_admin()
  );

drop policy if exists report_status_defs_mutate on public.report_status_definitions;
create policy report_status_defs_mutate on public.report_status_definitions
  for all using (
    public.is_platform_admin()
    or (organization_id is not null and public.has_org_permission(organization_id, 'settings.manage'))
  )
  with check (
    public.is_platform_admin()
    or (organization_id is not null and public.has_org_permission(organization_id, 'settings.manage'))
  );

drop policy if exists report_custom_fields_defs on public.report_custom_field_definitions;
create policy report_custom_fields_defs on public.report_custom_field_definitions
  for all using (
    public.is_platform_admin() or public.is_org_member(organization_id)
  )
  with check (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'settings.manage')
  );

drop policy if exists report_custom_fields_vals on public.report_custom_field_values;
create policy report_custom_fields_vals on public.report_custom_field_values
  for all using (
    public.is_platform_admin() or public.is_org_member(organization_id)
  )
  with check (
    public.is_platform_admin() or public.is_org_member(organization_id)
  );

drop policy if exists report_category_templates_select on public.report_category_templates;
create policy report_category_templates_select on public.report_category_templates
  for select using (auth.uid() is not null);

create or replace function public.assert_custom_field_same_org()
returns trigger
language plpgsql
as $$
declare
  event_org uuid;
  def_org uuid;
begin
  select organization_id into event_org from public.ehs_events where id = new.event_id;
  select organization_id into def_org from public.report_custom_field_definitions where id = new.field_definition_id;
  if event_org is null or def_org is null or event_org <> new.organization_id or def_org <> new.organization_id then
    raise exception 'custom field value organization mismatch';
  end if;
  return new;
end;
$$;

drop trigger if exists report_custom_field_values_same_org on public.report_custom_field_values;
create trigger report_custom_field_values_same_org
  before insert or update on public.report_custom_field_values
  for each row execute function public.assert_custom_field_same_org();
