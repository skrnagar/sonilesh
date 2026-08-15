-- EHS360 Phase 5: shared reporting engine (Incident / Near Miss / UA / UC / Hazard)

create table public.number_sequences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  sequence_key text not null,
  prefix text not null default '',
  current_value bigint not null default 0,
  pad_length integer not null default 5,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, sequence_key)
);

create table public.event_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  code text not null,
  name text not null,
  feature_code text not null,
  description text,
  is_system boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, code)
);

create unique index event_types_system_code_uidx
  on public.event_types (code)
  where organization_id is null;

create table public.event_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  event_type_id uuid not null references public.event_types (id) on delete cascade,
  code text not null,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, event_type_id, code)
);

create table public.severity_levels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  code text not null,
  name text not null,
  rank integer not null,
  color text,
  requires_investigation boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index severity_levels_org_code_uidx
  on public.severity_levels (organization_id, code)
  where organization_id is not null;

create unique index severity_levels_system_code_uidx
  on public.severity_levels (code)
  where organization_id is null;

create table public.ehs_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  event_type_id uuid not null references public.event_types (id),
  event_category_id uuid references public.event_categories (id),
  event_number text not null,
  site_id uuid references public.sites (id),
  project_id uuid references public.projects (id),
  department_id uuid references public.departments (id),
  location_id uuid references public.locations (id),
  business_unit_id uuid references public.business_units (id),
  severity_id uuid references public.severity_levels (id),
  status text not null default 'draft'
    check (status in (
      'draft', 'submitted', 'triage', 'investigation',
      'capa', 'verification', 'approval', 'closed', 'reopened', 'cancelled'
    )),
  title text,
  description text not null default '',
  occurred_at timestamptz not null default timezone('utc', now()),
  reported_at timestamptz,
  reporter_id uuid references public.profiles (id),
  is_anonymous boolean not null default false,
  immediate_action text,
  assigned_to uuid references public.profiles (id),
  investigator_id uuid references public.profiles (id),
  equipment_assets text,
  regulatory_reportable boolean not null default false,
  investigation_required boolean not null default false,
  duplicate_of_id uuid references public.ehs_events (id),
  closed_at timestamptz,
  closed_by uuid references public.profiles (id),
  closure_notes text,
  no_action_required boolean not null default false,
  no_action_accepted_by uuid references public.profiles (id),
  no_action_accepted_at timestamptz,
  no_action_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  deleted_at timestamptz,
  unique (organization_id, event_number)
);

create index ehs_events_org_status_idx on public.ehs_events (organization_id, status);
create index ehs_events_org_occurred_idx on public.ehs_events (organization_id, occurred_at desc);
create index ehs_events_site_idx on public.ehs_events (site_id);

create table public.ehs_event_people (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  event_id uuid not null references public.ehs_events (id) on delete cascade,
  person_name text not null,
  person_role text,
  company text,
  is_employee boolean,
  user_id uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now())
);

create table public.ehs_event_witnesses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  event_id uuid not null references public.ehs_events (id) on delete cascade,
  witness_name text not null,
  statement text,
  contact text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.ehs_event_injuries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  event_id uuid not null references public.ehs_events (id) on delete cascade,
  person_name text,
  body_part text,
  injury_type text,
  treatment text,
  lost_time boolean not null default false,
  details text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.ehs_event_comments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  event_id uuid not null references public.ehs_events (id) on delete cascade,
  body text not null,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.ehs_event_attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  event_id uuid not null references public.ehs_events (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  file_size bigint,
  kind text not null default 'document'
    check (kind in ('document', 'photo', 'video', 'other')),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.ehs_event_activity (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  event_id uuid not null references public.ehs_events (id) on delete cascade,
  actor_user_id uuid references public.profiles (id),
  activity_type text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.investigations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  event_id uuid not null unique references public.ehs_events (id) on delete cascade,
  method text check (method in ('5_why', 'fishbone', 'free_text', 'other')),
  root_cause text,
  contributing_factors jsonb not null default '[]'::jsonb,
  narrative text,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'completed')),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id)
);

create table public.capa_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  source_module text not null,
  source_record_id uuid not null,
  event_id uuid references public.ehs_events (id) on delete set null,
  title text not null,
  description text,
  capa_type text not null default 'corrective'
    check (capa_type in ('corrective', 'preventive')),
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'pending_verification', 'verified', 'closed', 'cancelled')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'critical')),
  owner_id uuid references public.profiles (id),
  due_date date,
  verification_method text,
  verification_evidence text,
  verified_by uuid references public.profiles (id),
  verified_at timestamptz,
  is_required boolean not null default true,
  closed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  deleted_at timestamptz
);

create index capa_items_org_status_idx on public.capa_items (organization_id, status);
create index capa_items_event_idx on public.capa_items (event_id);

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
begin
  insert into public.number_sequences (organization_id, sequence_key, prefix, current_value)
  values (p_organization_id, p_sequence_key, p_prefix, 1)
  on conflict (organization_id, sequence_key)
  do update set
    current_value = public.number_sequences.current_value + 1,
    updated_at = timezone('utc', now())
  returning current_value, pad_length into v_value, v_pad;

  return p_prefix || lpad(v_value::text, v_pad, '0');
end;
$$;

create trigger ehs_events_updated_at before update on public.ehs_events
  for each row execute function public.set_updated_at();
create trigger investigations_updated_at before update on public.investigations
  for each row execute function public.set_updated_at();
create trigger capa_items_updated_at before update on public.capa_items
  for each row execute function public.set_updated_at();
create trigger number_sequences_updated_at before update on public.number_sequences
  for each row execute function public.set_updated_at();
