-- Phase 6: Permit to Work Engine enrichment
-- Extends existing permit_types / permits (00010); does not duplicate Risk/JSA/JHA

-- ---------------------------------------------------------------------------
-- Permissions (keep permits.* prefix for backward compatibility)
-- ---------------------------------------------------------------------------
insert into public.permissions (code, module, action, description) values
  ('permits.update', 'permits', 'update', 'Update permits'),
  ('permits.submit', 'permits', 'submit', 'Submit permits for review'),
  ('permits.assign', 'permits', 'assign', 'Assign permit people'),
  ('permits.review', 'permits', 'review', 'Review permits'),
  ('permits.reject', 'permits', 'reject', 'Reject permits'),
  ('permits.activate', 'permits', 'activate', 'Activate permits'),
  ('permits.suspend', 'permits', 'suspend', 'Suspend active permits'),
  ('permits.resume', 'permits', 'resume', 'Resume suspended permits'),
  ('permits.extend', 'permits', 'extend', 'Extend permit validity'),
  ('permits.cancel', 'permits', 'cancel', 'Cancel permits'),
  ('permits.export', 'permits', 'export', 'Export permit reports'),
  ('permits.configure', 'permits', 'configure', 'Configure permit types and rules')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.organization_id is null
  and r.code in ('tenant_admin', 'ehs_manager', 'ehs_officer')
  and p.code in (
    'permits.update','permits.submit','permits.assign','permits.review','permits.reject',
    'permits.activate','permits.suspend','permits.resume','permits.extend','permits.cancel',
    'permits.export','permits.configure'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.organization_id is null
  and r.code = 'supervisor'
  and p.code in (
    'permits.create','permits.update','permits.submit','permits.review',
    'permits.approve','permits.extend','permits.suspend'
  )
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Permit types: org config knobs
-- ---------------------------------------------------------------------------
alter table public.permit_types
  add column if not exists number_prefix text,
  add column if not exists requires_approved_risk boolean not null default true,
  add column if not exists requires_isolation boolean not null default false,
  add column if not exists requires_closeout_checklist boolean not null default true,
  add column if not exists prevent_self_approval boolean not null default true,
  add column if not exists match_risk_site boolean not null default false,
  add column if not exists config jsonb not null default '{}'::jsonb;

update public.permit_types set number_prefix = upper(code) where number_prefix is null;

update public.permit_types set
  requires_isolation = true
where code in ('loto', 'electrical', 'confined_space') and organization_id is null;

-- ---------------------------------------------------------------------------
-- Expand permit status vocabulary (keep legacy values during migrate)
-- ---------------------------------------------------------------------------
alter table public.permits drop constraint if exists permits_status_check;

update public.permits set status = 'risk_review' where status = 'risk_check';
update public.permits set status = 'approval_required' where status = 'authorization';

alter table public.permits
  add column if not exists business_unit_id uuid references public.business_units (id),
  add column if not exists department_id uuid references public.departments (id),
  add column if not exists work_leader_id uuid references public.profiles (id),
  add column if not exists permit_issuer_id uuid references public.profiles (id),
  add column if not exists ehs_approver_id uuid references public.profiles (id),
  add column if not exists jsa_id uuid references public.risk_assessments (id),
  add column if not exists jha_id uuid references public.risk_assessments (id),
  add column if not exists work_order_ref text,
  add column if not exists client_reference text,
  add column if not exists contractor_name text,
  add column if not exists worker_count integer,
  add column if not exists equipment text,
  add column if not exists tools text,
  add column if not exists materials text,
  add column if not exists additional_controls text,
  add column if not exists priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'critical')),
  add column if not exists custom_fields jsonb not null default '{}'::jsonb,
  add column if not exists residual_risk_band text,
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_by uuid references public.profiles (id),
  add column if not exists suspension_reason text,
  add column if not exists submitted_at timestamptz,
  add column if not exists activated_at timestamptz,
  add column if not exists qr_token text,
  add column if not exists checklist_template_id uuid,
  add column if not exists description text;

-- Align issuer naming: copy issuer_id → permit_issuer_id where set
update public.permits
set permit_issuer_id = issuer_id
where permit_issuer_id is null and issuer_id is not null;

-- Description alias for work_description consumers
update public.permits
set description = work_description
where description is null;

alter table public.permits
  add constraint permits_status_check check (status in (
    'draft', 'requested', 'under_review', 'risk_review', 'pre_work_checklist',
    'approval_required', 'approved', 'active', 'suspended', 'extension_pending',
    'expired', 'closeout', 'closed', 'rejected', 'cancelled',
    -- legacy (read-only after migrate; transitions prefer canonical)
    'risk_check', 'authorization'
  ));

create unique index if not exists permits_org_qr_token_uidx
  on public.permits (organization_id, qr_token)
  where qr_token is not null;

-- ---------------------------------------------------------------------------
-- Type fields (tenant custom fields — no core schema changes per customer)
-- ---------------------------------------------------------------------------
create table if not exists public.permit_type_fields (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  permit_type_id uuid not null references public.permit_types (id) on delete cascade,
  field_key text not null,
  label text not null,
  field_type text not null default 'text'
    check (field_type in ('text', 'number', 'boolean', 'date', 'select', 'textarea')),
  options jsonb not null default '[]'::jsonb,
  is_required boolean not null default false,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, permit_type_id, field_key)
);

-- ---------------------------------------------------------------------------
-- Templates / checklists (configurable per type)
-- ---------------------------------------------------------------------------
create table if not exists public.permit_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  permit_type_id uuid references public.permit_types (id) on delete cascade,
  code text not null,
  name text not null,
  purpose text not null default 'pre_work'
    check (purpose in ('pre_work', 'closeout', 'extension')),
  is_system boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, code)
);

create unique index if not exists permit_templates_system_code_uidx
  on public.permit_templates (code)
  where organization_id is null;

create table if not exists public.permit_checklist_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  template_id uuid not null references public.permit_templates (id) on delete cascade,
  item_key text not null,
  prompt text not null,
  response_type text not null default 'yes_no'
    check (response_type in (
      'yes_no', 'yes_no_na', 'pass_fail', 'text', 'number', 'photo', 'signature'
    )),
  is_required boolean not null default true,
  evidence_required boolean not null default false,
  failure_blocks_approval boolean not null default false,
  failure_requires_comment boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

-- Instance checklist header (groups items on a permit)
create table if not exists public.permit_checklists (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  permit_id uuid not null references public.permits (id) on delete cascade,
  template_id uuid references public.permit_templates (id),
  purpose text not null default 'pre_work'
    check (purpose in ('pre_work', 'closeout', 'extension')),
  status text not null default 'open'
    check (status in ('open', 'complete', 'blocked')),
  completed_at timestamptz,
  completed_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now())
);

-- Enrich existing checklist items
alter table public.permit_checklist_items
  add column if not exists checklist_id uuid references public.permit_checklists (id) on delete cascade,
  add column if not exists item_key text,
  add column if not exists response_type text default 'yes_no',
  add column if not exists response_value text,
  add column if not exists comment text,
  add column if not exists evidence_required boolean not null default false,
  add column if not exists failure_blocks_approval boolean not null default false,
  add column if not exists failure_requires_comment boolean not null default true,
  add column if not exists is_blocking_failure boolean not null default false;

-- ---------------------------------------------------------------------------
-- Workers, isolations, suspensions, closeouts, comments, history, rules
-- ---------------------------------------------------------------------------
create table if not exists public.permit_workers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  permit_id uuid not null references public.permits (id) on delete cascade,
  user_id uuid references public.profiles (id),
  worker_name text,
  role_label text not null default 'worker',
  contractor_company text,
  is_contractor boolean not null default false,
  acknowledged_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.permit_isolations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  permit_id uuid not null references public.permits (id) on delete cascade,
  isolation_number text,
  isolation_type text not null default 'electrical'
    check (isolation_type in (
      'electrical', 'mechanical', 'hydraulic', 'pneumatic',
      'pressure', 'thermal', 'chemical', 'other'
    )),
  equipment text,
  energy_source text,
  isolation_point text,
  method text,
  status text not null default 'required'
    check (status in ('required', 'applied', 'verified', 'released')),
  applied_by uuid references public.profiles (id),
  verified_by uuid references public.profiles (id),
  applied_at timestamptz,
  verified_at timestamptz,
  released_at timestamptz,
  released_by uuid references public.profiles (id),
  evidence_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.permit_extensions
  add column if not exists reviewed_by uuid references public.profiles (id),
  add column if not exists reviewed_at timestamptz,
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_at timestamptz;

alter table public.permit_approvals
  add column if not exists approval_level integer not null default 1,
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_at timestamptz;

-- Expand approval status
alter table public.permit_approvals drop constraint if exists permit_approvals_status_check;
alter table public.permit_approvals
  add constraint permit_approvals_status_check
  check (status in ('pending', 'approved', 'rejected', 'skipped'));

create table if not exists public.permit_suspensions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  permit_id uuid not null references public.permits (id) on delete cascade,
  reason_code text not null default 'other'
    check (reason_code in (
      'unsafe_condition', 'weather', 'equipment_issue', 'emergency',
      'procedure_violation', 'other'
    )),
  reason text not null,
  suspended_by uuid references public.profiles (id),
  suspended_at timestamptz not null default timezone('utc', now()),
  resumed_by uuid references public.profiles (id),
  resumed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.permit_closeouts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  permit_id uuid not null references public.permits (id) on delete cascade,
  owner_id uuid references public.profiles (id),
  notes text,
  work_completed boolean not null default false,
  area_restored boolean not null default false,
  tools_removed boolean not null default false,
  isolations_released boolean not null default false,
  personnel_accounted boolean not null default false,
  checklist_id uuid references public.permit_checklists (id),
  closed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.permit_comments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  permit_id uuid not null references public.permits (id) on delete cascade,
  author_id uuid references public.profiles (id),
  body text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.permit_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  permit_id uuid not null references public.permits (id) on delete cascade,
  actor_user_id uuid references public.profiles (id),
  event_type text not null,
  message text not null,
  old_value jsonb,
  new_value jsonb,
  reason text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists permit_history_permit_idx
  on public.permit_history (permit_id, created_at desc);

create table if not exists public.permit_approval_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  permit_type_id uuid references public.permit_types (id) on delete cascade,
  site_id uuid references public.sites (id),
  name text not null,
  residual_risk_bands text[] not null default '{}',
  required_role text not null,
  approval_level integer not null default 1,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

-- Attachments: align with storage path model (keep file_url for legacy)
alter table public.permit_attachments
  add column if not exists storage_path text,
  add column if not exists file_size integer;

-- FK for checklist template on permits
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'permits_checklist_template_id_fkey'
  ) then
    alter table public.permits
      add constraint permits_checklist_template_id_fkey
      foreign key (checklist_template_id) references public.permit_templates (id);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Seed system checklist templates (examples — not legal requirements)
-- ---------------------------------------------------------------------------
insert into public.permit_templates (organization_id, permit_type_id, code, name, purpose, is_system, sort_order)
select null, pt.id, 'hot_work_pre', 'Hot Work Pre-Work Checks', 'pre_work', true, 1
from public.permit_types pt where pt.code = 'hot_work' and pt.organization_id is null
on conflict do nothing;

insert into public.permit_templates (organization_id, permit_type_id, code, name, purpose, is_system, sort_order)
select null, pt.id, 'confined_space_pre', 'Confined Space Pre-Entry Checks', 'pre_work', true, 2
from public.permit_types pt where pt.code = 'confined_space' and pt.organization_id is null
on conflict do nothing;

insert into public.permit_templates (organization_id, permit_type_id, code, name, purpose, is_system, sort_order)
select null, pt.id, 'wah_pre', 'Work at Height Pre-Work Checks', 'pre_work', true, 3
from public.permit_types pt where pt.code = 'work_at_height' and pt.organization_id is null
on conflict do nothing;

insert into public.permit_templates (organization_id, permit_type_id, code, name, purpose, is_system, sort_order)
select null, pt.id, 'electrical_pre', 'Electrical Pre-Work Checks', 'pre_work', true, 4
from public.permit_types pt where pt.code = 'electrical' and pt.organization_id is null
on conflict do nothing;

insert into public.permit_templates (organization_id, permit_type_id, code, name, purpose, is_system, sort_order)
select null, null, 'ptw_closeout', 'Standard Permit Close-Out', 'closeout', true, 90
on conflict do nothing;

-- Hot work items
insert into public.permit_checklist_templates (
  organization_id, template_id, item_key, prompt, response_type,
  is_required, failure_blocks_approval, sort_order
)
select null, t.id, v.item_key, v.prompt, 'yes_no', true, v.blocks, v.sort_order
from public.permit_templates t
cross join (values
  ('area_inspected', 'Area inspected for combustibles', true, 1),
  ('fire_extinguisher', 'Fire extinguisher available', true, 2),
  ('fire_watch', 'Fire watch assigned', true, 3),
  ('ppe_available', 'Required PPE available', true, 4),
  ('emergency_access', 'Emergency access clear', true, 5)
) as v(item_key, prompt, blocks, sort_order)
where t.code = 'hot_work_pre' and t.organization_id is null
  and not exists (
    select 1 from public.permit_checklist_templates x
    where x.template_id = t.id and x.item_key = v.item_key
  );

insert into public.permit_checklist_templates (
  organization_id, template_id, item_key, prompt, response_type,
  is_required, failure_blocks_approval, sort_order
)
select null, t.id, v.item_key, v.prompt, 'yes_no', true, true, v.sort_order
from public.permit_templates t
cross join (values
  ('entry_auth', 'Entry authorization confirmed', 1),
  ('atmosphere', 'Atmospheric testing completed', 2),
  ('ventilation', 'Ventilation verified', 3),
  ('rescue_plan', 'Rescue plan in place', 4),
  ('attendant', 'Attendant / standby assigned', 5),
  ('comms', 'Communication method confirmed', 6)
) as v(item_key, prompt, sort_order)
where t.code = 'confined_space_pre' and t.organization_id is null
  and not exists (
    select 1 from public.permit_checklist_templates x
    where x.template_id = t.id and x.item_key = v.item_key
  );

insert into public.permit_checklist_templates (
  organization_id, template_id, item_key, prompt, response_type,
  is_required, failure_blocks_approval, sort_order
)
select null, t.id, v.item_key, v.prompt, 'yes_no', true, true, v.sort_order
from public.permit_templates t
cross join (values
  ('fall_protection', 'Fall protection in place', 1),
  ('scaffold_check', 'Scaffold / ladder checked', 2),
  ('anchorage', 'Anchorage verified', 3),
  ('barricading', 'Barricading in place', 4),
  ('rescue_plan', 'Rescue plan available', 5)
) as v(item_key, prompt, sort_order)
where t.code = 'wah_pre' and t.organization_id is null
  and not exists (
    select 1 from public.permit_checklist_templates x
    where x.template_id = t.id and x.item_key = v.item_key
  );

insert into public.permit_checklist_templates (
  organization_id, template_id, item_key, prompt, response_type,
  is_required, failure_blocks_approval, sort_order
)
select null, t.id, v.item_key, v.prompt, 'yes_no', true, true, v.sort_order
from public.permit_templates t
cross join (values
  ('isolation', 'Isolation completed', 1),
  ('loto', 'LOTO applied', 2),
  ('testing', 'Dead testing completed', 3),
  ('authorized_person', 'Authorized person assigned', 4)
) as v(item_key, prompt, sort_order)
where t.code = 'electrical_pre' and t.organization_id is null
  and not exists (
    select 1 from public.permit_checklist_templates x
    where x.template_id = t.id and x.item_key = v.item_key
  );

insert into public.permit_checklist_templates (
  organization_id, template_id, item_key, prompt, response_type,
  is_required, failure_blocks_approval, sort_order
)
select null, t.id, v.item_key, v.prompt, 'yes_no', true, false, v.sort_order
from public.permit_templates t
cross join (values
  ('work_completed', 'Work completed', 1),
  ('area_restored', 'Area restored', 2),
  ('tools_removed', 'Tools removed', 3),
  ('waste_removed', 'Waste removed', 4),
  ('isolation_released', 'Isolation released', 5),
  ('personnel_accounted', 'Personnel accounted for', 6)
) as v(item_key, prompt, sort_order)
where t.code = 'ptw_closeout' and t.organization_id is null
  and not exists (
    select 1 from public.permit_checklist_templates x
    where x.template_id = t.id and x.item_key = v.item_key
  );

-- ---------------------------------------------------------------------------
-- Same-org integrity
-- ---------------------------------------------------------------------------
create or replace function public.assert_permit_same_org()
returns trigger
language plpgsql
as $$
declare
  ref_org uuid;
begin
  if new.site_id is not null then
    select organization_id into ref_org from public.sites where id = new.site_id;
    if ref_org is null or ref_org <> new.organization_id then
      raise exception 'site_id must belong to the same organization';
    end if;
  end if;
  if new.project_id is not null then
    select organization_id into ref_org from public.projects where id = new.project_id;
    if ref_org is null or ref_org <> new.organization_id then
      raise exception 'project_id must belong to the same organization';
    end if;
  end if;
  if new.risk_assessment_id is not null then
    select organization_id into ref_org from public.risk_assessments where id = new.risk_assessment_id;
    if ref_org is null or ref_org <> new.organization_id then
      raise exception 'risk_assessment_id must belong to the same organization';
    end if;
  end if;
  if new.jsa_id is not null then
    select organization_id into ref_org from public.risk_assessments where id = new.jsa_id;
    if ref_org is null or ref_org <> new.organization_id then
      raise exception 'jsa_id must belong to the same organization';
    end if;
  end if;
  if new.jha_id is not null then
    select organization_id into ref_org from public.risk_assessments where id = new.jha_id;
    if ref_org is null or ref_org <> new.organization_id then
      raise exception 'jha_id must belong to the same organization';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists permits_same_org on public.permits;
create trigger permits_same_org
  before insert or update on public.permits
  for each row execute function public.assert_permit_same_org();

-- Expire overdue also covers suspended → still expire when past valid_to while active only
create or replace function public.expire_overdue_permits()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.permits
  set status = 'expired', updated_at = timezone('utc', now())
  where status in ('active', 'extension_pending')
    and valid_to is not null
    and valid_to < timezone('utc', now())
    and deleted_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'permit_type_fields','permit_templates','permit_checklist_templates',
    'permit_checklists','permit_workers','permit_isolations','permit_suspensions',
    'permit_closeouts','permit_comments','permit_history','permit_approval_rules'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

drop policy if exists permit_type_fields_tenant on public.permit_type_fields;
create policy permit_type_fields_tenant on public.permit_type_fields
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));

drop policy if exists permit_templates_select on public.permit_templates;
create policy permit_templates_select on public.permit_templates
  for select using (
    public.is_platform_admin()
    or organization_id is null
    or public.is_org_member(organization_id)
  );

drop policy if exists permit_templates_write on public.permit_templates;
create policy permit_templates_write on public.permit_templates
  for all using (
    public.is_platform_admin()
    or (organization_id is not null and public.has_org_permission(organization_id, 'permits.configure'))
  )
  with check (
    public.is_platform_admin()
    or (organization_id is not null and public.has_org_permission(organization_id, 'permits.configure'))
  );

drop policy if exists permit_checklist_templates_select on public.permit_checklist_templates;
create policy permit_checklist_templates_select on public.permit_checklist_templates
  for select using (
    public.is_platform_admin()
    or organization_id is null
    or public.is_org_member(organization_id)
  );

drop policy if exists permit_checklists_tenant on public.permit_checklists;
create policy permit_checklists_tenant on public.permit_checklists
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));

drop policy if exists permit_workers_tenant on public.permit_workers;
create policy permit_workers_tenant on public.permit_workers
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));

drop policy if exists permit_isolations_tenant on public.permit_isolations;
create policy permit_isolations_tenant on public.permit_isolations
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));

drop policy if exists permit_suspensions_tenant on public.permit_suspensions;
create policy permit_suspensions_tenant on public.permit_suspensions
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));

drop policy if exists permit_closeouts_tenant on public.permit_closeouts;
create policy permit_closeouts_tenant on public.permit_closeouts
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));

drop policy if exists permit_comments_tenant on public.permit_comments;
create policy permit_comments_tenant on public.permit_comments
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));

drop policy if exists permit_history_select on public.permit_history;
create policy permit_history_select on public.permit_history
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));

drop policy if exists permit_history_insert on public.permit_history;
create policy permit_history_insert on public.permit_history
  for insert with check (public.is_platform_admin() or public.is_org_member(organization_id));

-- History immutable: no update/delete policies for members

drop policy if exists permit_approval_rules_tenant on public.permit_approval_rules;
create policy permit_approval_rules_tenant on public.permit_approval_rules
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'permits.configure')
  );

create trigger permit_templates_updated_at before update on public.permit_templates
  for each row execute function public.set_updated_at();
create trigger permit_isolations_updated_at before update on public.permit_isolations
  for each row execute function public.set_updated_at();
