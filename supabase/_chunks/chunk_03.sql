-- EHS360 chunk 3 — paste into SQL Editor and Run
-- Project: sqybbygfksnjvmatiafm

-- >>> 20260326000010_permits.sql
-- Phase 7: configurable Permit to Work engine

create table public.permit_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  default_validity_hours integer not null default 8,
  requires_risk_assessment boolean not null default true,
  is_system boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, code)
);

create unique index permit_types_system_code_uidx
  on public.permit_types (code)
  where organization_id is null;

create table public.permits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  permit_type_id uuid not null references public.permit_types (id),
  permit_number text not null,
  status text not null default 'requested'
    check (status in (
      'requested', 'risk_check', 'pre_work_checklist', 'authorization',
      'active', 'extension_pending', 'closeout', 'closed', 'cancelled', 'expired'
    )),
  title text not null,
  work_description text not null default '',
  site_id uuid references public.sites (id),
  project_id uuid references public.projects (id),
  location_id uuid references public.locations (id),
  requester_id uuid references public.profiles (id),
  issuer_id uuid references public.profiles (id),
  area_owner_id uuid references public.profiles (id),
  risk_assessment_id uuid references public.risk_assessments (id),
  valid_from timestamptz,
  valid_to timestamptz,
  isolation_loto_required boolean not null default false,
  isolation_details text,
  closeout_notes text,
  closed_at timestamptz,
  closed_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  deleted_at timestamptz,
  unique (organization_id, permit_number)
);

create table public.permit_checklist_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  permit_id uuid not null references public.permits (id) on delete cascade,
  item_text text not null,
  is_required boolean not null default true,
  is_checked boolean not null default false,
  checked_by uuid references public.profiles (id),
  checked_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.permit_approvals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  permit_id uuid not null references public.permits (id) on delete cascade,
  approver_role text not null,
  approver_id uuid references public.profiles (id),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  signature_name text,
  signed_at timestamptz,
  comments text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.permit_extensions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  permit_id uuid not null references public.permits (id) on delete cascade,
  previous_valid_to timestamptz not null,
  new_valid_to timestamptz not null,
  reason text not null,
  requested_by uuid references public.profiles (id),
  approved_by uuid references public.profiles (id),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default timezone('utc', now())
);

create table public.permit_attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  permit_id uuid not null references public.permits (id) on delete cascade,
  file_name text not null,
  file_url text not null,
  content_type text,
  uploaded_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now())
);

create index permits_org_status_idx on public.permits (organization_id, status);
create index permits_valid_to_idx on public.permits (organization_id, valid_to);

insert into public.permit_types (organization_id, code, name, description, is_system, sort_order)
values
  (null, 'hot_work', 'Hot Work', 'Welding, cutting, grinding', true, 1),
  (null, 'confined_space', 'Confined Space', 'Entry into confined spaces', true, 2),
  (null, 'work_at_height', 'Work at Height', 'Elevated work', true, 3),
  (null, 'excavation', 'Excavation', 'Digging and trenching', true, 4),
  (null, 'electrical', 'Electrical', 'Electrical work', true, 5),
  (null, 'lifting', 'Lifting', 'Lifting operations', true, 6),
  (null, 'loto', 'LOTO', 'Lockout / tagout', true, 7),
  (null, 'general_work', 'General Work', 'General permit to work', true, 8)
on conflict do nothing;

-- Expire active permits past valid_to (callable by cron / app)
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
  where status = 'active'
    and valid_to is not null
    and valid_to < timezone('utc', now())
    and deleted_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create trigger permit_types_updated_at before update on public.permit_types
  for each row execute function public.set_updated_at();
create trigger permits_updated_at before update on public.permits
  for each row execute function public.set_updated_at();


-- >>> 20260326000011_checklists_inspections_audits.sql
-- Phase 8: generic checklist engine (inspection + audit)

create table public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  checklist_type text not null check (checklist_type in ('inspection', 'audit')),
  is_active boolean not null default true,
  scoring_enabled boolean not null default true,
  auto_capa_on_fail boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  deleted_at timestamptz,
  unique (organization_id, code)
);

create table public.checklist_sections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  template_id uuid not null references public.checklist_templates (id) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.checklist_questions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  section_id uuid not null references public.checklist_sections (id) on delete cascade,
  prompt text not null,
  question_type text not null
    check (question_type in (
      'pass_fail', 'yes_no', 'na', 'text', 'number', 'date',
      'single_select', 'multi_select', 'photo', 'signature'
    )),
  is_required boolean not null default true,
  weight numeric(8,2) not null default 1,
  sort_order integer not null default 0,
  help_text text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.checklist_options (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  question_id uuid not null references public.checklist_questions (id) on delete cascade,
  label text not null,
  value text not null,
  score numeric(8,2),
  is_failing boolean not null default false,
  sort_order integer not null default 0
);

create table public.finding_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  code text not null,
  name text not null,
  severity_rank integer not null default 1,
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, code)
);

create unique index finding_categories_system_code_uidx
  on public.finding_categories (code)
  where organization_id is null;

create table public.checklist_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  template_id uuid not null references public.checklist_templates (id),
  assignment_number text not null,
  checklist_type text not null check (checklist_type in ('inspection', 'audit')),
  title text not null,
  status text not null default 'scheduled'
    check (status in (
      'scheduled', 'assigned', 'in_progress', 'completed', 'findings_review',
      'capa', 'closed', 'cancelled',
      'planned', 'auditee_notified', 'conducted', 'findings_recorded',
      'categorized', 'capa_linked', 'report_issued'
    )),
  site_id uuid references public.sites (id),
  project_id uuid references public.projects (id),
  assignee_id uuid references public.profiles (id),
  auditee_id uuid references public.profiles (id),
  scheduled_for date,
  due_date date,
  recurrence_rule text,
  started_at timestamptz,
  completed_at timestamptz,
  score_percent numeric(6,2),
  report_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  deleted_at timestamptz,
  unique (organization_id, assignment_number)
);

create table public.checklist_responses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  assignment_id uuid not null references public.checklist_assignments (id) on delete cascade,
  question_id uuid not null references public.checklist_questions (id),
  value_text text,
  value_number numeric,
  value_date date,
  value_json jsonb,
  is_na boolean not null default false,
  comment text,
  photo_url text,
  signature_name text,
  score numeric(8,2),
  answered_by uuid references public.profiles (id),
  answered_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (assignment_id, question_id)
);

create table public.checklist_findings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  assignment_id uuid not null references public.checklist_assignments (id) on delete cascade,
  response_id uuid references public.checklist_responses (id) on delete set null,
  category_id uuid references public.finding_categories (id),
  title text not null,
  description text,
  capa_id uuid references public.capa_items (id) on delete set null,
  status text not null default 'open'
    check (status in ('open', 'capa_linked', 'accepted', 'closed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  deleted_at timestamptz
);

insert into public.finding_categories (organization_id, code, name, severity_rank, is_system)
values
  (null, 'major', 'Major', 3, true),
  (null, 'minor', 'Minor', 2, true),
  (null, 'observation', 'Observation', 1, true)
on conflict do nothing;

create index checklist_assignments_org_status_idx
  on public.checklist_assignments (organization_id, status, checklist_type);
create index checklist_findings_assignment_idx on public.checklist_findings (assignment_id);

create trigger checklist_templates_updated_at before update on public.checklist_templates
  for each row execute function public.set_updated_at();
create trigger checklist_assignments_updated_at before update on public.checklist_assignments
  for each row execute function public.set_updated_at();
create trigger checklist_findings_updated_at before update on public.checklist_findings
  for each row execute function public.set_updated_at();


-- >>> 20260326000012_capa_engine.sql
-- Phase 9: central CAPA enhancements (shared platform service)

alter table public.capa_items
  add column if not exists verification_required boolean not null default true;

alter table public.capa_items
  add column if not exists evidence text;

alter table public.capa_items
  add column if not exists rework_count integer not null default 0;

alter table public.capa_items
  add column if not exists escalated_at timestamptz;

alter table public.capa_items
  add column if not exists last_reminder_at timestamptz;

alter table public.capa_items
  drop constraint if exists capa_items_source_module_check;

alter table public.capa_items
  add constraint capa_items_source_module_check
  check (source_module in (
    'incident', 'near_miss', 'hazard', 'risk_assessment', 'inspection',
    'audit', 'permit', 'training', 'contractor', 'other', 'action_item'
  ));

-- Overdue is derived (due_date < today AND status not terminal)
create or replace function public.capa_is_overdue(p_status text, p_due_date date)
returns boolean
language sql
immutable
as $$
  select p_due_date is not null
    and p_due_date < (timezone('utc', now()))::date
    and p_status not in ('verified', 'closed', 'cancelled');
$$;

create table if not exists public.capa_activity (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  capa_id uuid not null references public.capa_items (id) on delete cascade,
  action text not null,
  from_status text,
  to_status text,
  notes text,
  actor_id uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists capa_activity_capa_idx on public.capa_activity (capa_id, created_at desc);

-- BR-001 style gate: source cannot close while required open CAPA remain
create or replace function public.has_blocking_capa(
  p_organization_id uuid,
  p_source_module text,
  p_source_record_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.capa_items c
    where c.organization_id = p_organization_id
      and c.source_module = p_source_module
      and c.source_record_id = p_source_record_id
      and c.is_required = true
      and c.status not in ('verified', 'closed', 'cancelled')
      and c.deleted_at is null
  );
$$;


-- >>> 20260326000013_supporting_modules.sql
-- Phase 10: supporting EHS modules

-- Training & Competency
create table public.training_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  code text not null,
  name text not null,
  is_active boolean not null default true,
  unique (organization_id, code)
);

create table public.training_courses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  training_type_id uuid references public.training_types (id),
  code text not null,
  title text not null,
  description text,
  validity_days integer,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  unique (organization_id, code)
);

create table public.competency_matrix (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  role_code text not null,
  course_id uuid not null references public.training_courses (id) on delete cascade,
  is_required boolean not null default true,
  unique (organization_id, role_code, course_id)
);

create table public.training_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  course_id uuid not null references public.training_courses (id),
  user_id uuid not null references public.profiles (id),
  status text not null default 'assigned'
    check (status in ('assigned', 'in_progress', 'completed', 'expired', 'cancelled')),
  due_date date,
  completed_at timestamptz,
  expires_at date,
  certificate_url text,
  score numeric(6,2),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

-- Contractors
create table public.contractor_companies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  registration_number text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'active', 'suspended', 'blacklisted', 'deactivated')),
  safety_score numeric(5,2),
  insurance_expires_on date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.contractor_workers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  company_id uuid not null references public.contractor_companies (id) on delete cascade,
  full_name text not null,
  employee_number text,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'blacklisted')),
  induction_completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.contractor_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  company_id uuid not null references public.contractor_companies (id) on delete cascade,
  doc_type text not null,
  title text not null,
  file_url text,
  expires_on date,
  status text not null default 'valid'
    check (status in ('valid', 'expired', 'rejected')),
  created_at timestamptz not null default timezone('utc', now())
);

-- PPE
create table public.ppe_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  code text not null,
  name text not null,
  unique (organization_id, code)
);

create table public.ppe_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  category_id uuid references public.ppe_categories (id),
  name text not null,
  sku text,
  inventory_qty integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.ppe_requirements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  category_id uuid not null references public.ppe_categories (id),
  requirement_scope text not null check (requirement_scope in ('role', 'task')),
  scope_key text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.ppe_issuances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  item_id uuid not null references public.ppe_items (id),
  user_id uuid not null references public.profiles (id),
  issued_at timestamptz not null default timezone('utc', now()),
  expires_on date,
  replaced_at timestamptz,
  status text not null default 'issued'
    check (status in ('issued', 'returned', 'replaced', 'expired')),
  created_at timestamptz not null default timezone('utc', now())
);

-- Chemical / SDS
create table public.chemicals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  cas_number text,
  hazard_classification text,
  location_id uuid references public.locations (id),
  usage_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.chemical_sds (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  chemical_id uuid not null references public.chemicals (id) on delete cascade,
  version text not null,
  file_url text,
  effective_from date,
  is_current boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

-- Document control
create table public.controlled_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  doc_number text not null,
  title text not null,
  status text not null default 'draft'
    check (status in ('draft', 'in_review', 'approved', 'distributed', 'expired', 'obsolete')),
  current_version text,
  expires_on date,
  is_controlled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  unique (organization_id, doc_number)
);

create table public.document_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  document_id uuid not null references public.controlled_documents (id) on delete cascade,
  version text not null,
  file_url text,
  approved_by uuid references public.profiles (id),
  approved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.document_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  document_id uuid not null references public.controlled_documents (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  acknowledged_at timestamptz not null default timezone('utc', now()),
  unique (document_id, user_id)
);

-- MOC
create table public.moc_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  moc_number text not null,
  title text not null,
  description text,
  status text not null default 'requested'
    check (status in (
      'requested', 'risk_review', 'approval', 'implementation',
      'post_change_verification', 'closed', 'cancelled'
    )),
  site_id uuid references public.sites (id),
  requester_id uuid references public.profiles (id),
  risk_assessment_id uuid references public.risk_assessments (id),
  implemented_at timestamptz,
  verified_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  unique (organization_id, moc_number)
);

-- Toolbox talks
create table public.toolbox_talks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  talk_number text not null,
  topic text not null,
  site_id uuid references public.sites (id),
  project_id uuid references public.projects (id),
  presenter_id uuid references public.profiles (id),
  held_at timestamptz not null default timezone('utc', now()),
  notes text,
  photo_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  unique (organization_id, talk_number)
);

create table public.toolbox_attendance (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  talk_id uuid not null references public.toolbox_talks (id) on delete cascade,
  user_id uuid references public.profiles (id),
  attendee_name text,
  created_at timestamptz not null default timezone('utc', now())
);

-- Action items (can link to CAPA)
create table public.action_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title text not null,
  description text,
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'completed', 'cancelled')),
  owner_id uuid references public.profiles (id),
  due_date date,
  evidence text,
  capa_id uuid references public.capa_items (id) on delete set null,
  source_module text,
  source_record_id uuid,
  escalated_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  deleted_at timestamptz
);

create index training_assignments_user_idx on public.training_assignments (organization_id, user_id, status);
create index action_items_org_status_idx on public.action_items (organization_id, status);
create index contractor_companies_org_idx on public.contractor_companies (organization_id, status);

create trigger training_courses_updated_at before update on public.training_courses
  for each row execute function public.set_updated_at();
create trigger contractor_companies_updated_at before update on public.contractor_companies
  for each row execute function public.set_updated_at();
create trigger chemicals_updated_at before update on public.chemicals
  for each row execute function public.set_updated_at();
create trigger controlled_documents_updated_at before update on public.controlled_documents
  for each row execute function public.set_updated_at();
create trigger moc_requests_updated_at before update on public.moc_requests
  for each row execute function public.set_updated_at();
create trigger toolbox_talks_updated_at before update on public.toolbox_talks
  for each row execute function public.set_updated_at();
create trigger action_items_updated_at before update on public.action_items
  for each row execute function public.set_updated_at();
create trigger ppe_items_updated_at before update on public.ppe_items
  for each row execute function public.set_updated_at();


-- >>> 20260326000014_modules_rls_and_permissions.sql
-- RLS + permissions for phases 6â€“10

insert into public.permissions (code, module, action, description) values
  ('risk.view', 'risk', 'view', 'View risk assessments'),
  ('risk.create', 'risk', 'create', 'Create risk assessments'),
  ('risk.update', 'risk', 'update', 'Update risk assessments'),
  ('risk.approve', 'risk', 'approve', 'Approve risk assessments'),
  ('permits.view', 'permits', 'view', 'View permits'),
  ('permits.create', 'permits', 'create', 'Create permits'),
  ('permits.approve', 'permits', 'approve', 'Approve permits'),
  ('permits.close', 'permits', 'close', 'Close permits'),
  ('inspections.view', 'inspections', 'view', 'View inspections'),
  ('inspections.conduct', 'inspections', 'conduct', 'Conduct inspections'),
  ('audits.view', 'audits', 'view', 'View audits'),
  ('audits.conduct', 'audits', 'conduct', 'Conduct audits'),
  ('checklists.manage', 'checklists', 'manage', 'Manage checklist templates'),
  ('training.view', 'training', 'view', 'View training'),
  ('training.manage', 'training', 'manage', 'Manage training'),
  ('contractors.view', 'contractors', 'view', 'View contractors'),
  ('contractors.manage', 'contractors', 'manage', 'Manage contractors'),
  ('ppe.view', 'ppe', 'view', 'View PPE'),
  ('ppe.manage', 'ppe', 'manage', 'Manage PPE'),
  ('chemicals.view', 'chemicals', 'view', 'View chemicals'),
  ('chemicals.manage', 'chemicals', 'manage', 'Manage chemicals'),
  ('documents.view', 'documents', 'view', 'View documents'),
  ('documents.manage', 'documents', 'manage', 'Manage documents'),
  ('moc.view', 'moc', 'view', 'View MOC'),
  ('moc.manage', 'moc', 'manage', 'Manage MOC'),
  ('toolbox.view', 'toolbox', 'view', 'View toolbox talks'),
  ('toolbox.manage', 'toolbox', 'manage', 'Manage toolbox talks'),
  ('actions.view', 'actions', 'view', 'View action items'),
  ('actions.manage', 'actions', 'manage', 'Manage action items'),
  ('field.access', 'field', 'access', 'Access field experience')
on conflict (code) do nothing;

-- Grant new permissions to tenant_admin / ehs_manager system roles when present
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.organization_id is null
  and r.code in ('tenant_admin', 'ehs_manager', 'ehs_officer')
  and p.code in (
    'risk.view','risk.create','risk.update','risk.approve',
    'permits.view','permits.create','permits.approve','permits.close',
    'inspections.view','inspections.conduct','audits.view','audits.conduct',
    'checklists.manage','training.view','training.manage',
    'contractors.view','contractors.manage','ppe.view','ppe.manage',
    'chemicals.view','chemicals.manage','documents.view','documents.manage',
    'moc.view','moc.manage','toolbox.view','toolbox.manage',
    'actions.view','actions.manage','field.access','capa.view','capa.create','capa.update'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.organization_id is null
  and r.code in ('supervisor', 'employee')
  and p.code in (
    'risk.view','permits.view','inspections.view','training.view',
    'toolbox.view','actions.view','field.access','capa.view'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.organization_id is null
  and r.code = 'contractor'
  and p.code in ('field.access','permits.view','training.view','actions.view')
on conflict do nothing;

do $$
declare
  t text;
begin
  foreach t in array array[
    'risk_assessment_types','risk_matrices','risk_assessments','risk_assessment_team',
    'risk_hazards','risk_controls','permit_types','permits','permit_checklist_items',
    'permit_approvals','permit_extensions','permit_attachments','checklist_templates',
    'checklist_sections','checklist_questions','checklist_options','finding_categories',
    'checklist_assignments','checklist_responses','checklist_findings','capa_activity',
    'training_types','training_courses','competency_matrix','training_assignments',
    'contractor_companies','contractor_workers','contractor_documents',
    'ppe_categories','ppe_items','ppe_requirements','ppe_issuances',
    'chemicals','chemical_sds','controlled_documents','document_versions',
    'document_acknowledgements','moc_requests','toolbox_talks','toolbox_attendance',
    'action_items'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Helper: org-member ALL policy factory via dynamic SQL
do $$
declare
  t text;
begin
  foreach t in array array[
    'risk_matrices','risk_assessments','risk_assessment_team','risk_hazards','risk_controls',
    'permits','permit_checklist_items','permit_approvals','permit_extensions','permit_attachments',
    'checklist_templates','checklist_sections','checklist_questions','checklist_options',
    'checklist_assignments','checklist_responses','checklist_findings','capa_activity',
    'training_types','training_courses','competency_matrix','training_assignments',
    'contractor_companies','contractor_workers','contractor_documents',
    'ppe_categories','ppe_items','ppe_requirements','ppe_issuances',
    'chemicals','chemical_sds','controlled_documents','document_versions',
    'document_acknowledgements','moc_requests','toolbox_talks','toolbox_attendance',
    'action_items'
  ]
  loop
    execute format(
      'create policy %I on public.%I for all using (public.is_platform_admin() or public.is_org_member(organization_id)) with check (public.is_platform_admin() or public.is_org_member(organization_id))',
      t || '_tenant', t
    );
  end loop;
end $$;

create policy risk_assessment_types_read on public.risk_assessment_types
  for select using (
    organization_id is null
    or public.is_platform_admin()
    or public.is_org_member(organization_id)
  );
create policy risk_assessment_types_write on public.risk_assessment_types
  for all using (
    public.is_platform_admin()
    or (organization_id is not null and public.is_org_member(organization_id))
  )
  with check (
    public.is_platform_admin()
    or (organization_id is not null and public.is_org_member(organization_id))
  );

create policy permit_types_read on public.permit_types
  for select using (
    organization_id is null
    or public.is_platform_admin()
    or public.is_org_member(organization_id)
  );
create policy permit_types_write on public.permit_types
  for all using (
    public.is_platform_admin()
    or (organization_id is not null and public.is_org_member(organization_id))
  )
  with check (
    public.is_platform_admin()
    or (organization_id is not null and public.is_org_member(organization_id))
  );

create policy finding_categories_read on public.finding_categories
  for select using (
    organization_id is null
    or public.is_platform_admin()
    or public.is_org_member(organization_id)
  );
create policy finding_categories_write on public.finding_categories
  for all using (
    public.is_platform_admin()
    or (organization_id is not null and public.is_org_member(organization_id))
  )
  with check (
    public.is_platform_admin()
    or (organization_id is not null and public.is_org_member(organization_id))
  );


-- >>> 20260326000015_bootstrap_rls_fix.sql
-- Ensure onboarding works even if earlier bootstrap migration was skipped.
-- 1) Recreate security-definer RPC
-- 2) Allow authenticated users to insert their own first membership + org settings

create or replace function public.bootstrap_organization(
  p_name text,
  p_slug text,
  p_industry text,
  p_company_type text default null,
  p_country text default null
)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_org public.organizations;
  v_member public.organization_members;
  v_role_id uuid;
  v_plan_id uuid;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.organizations (
    name, slug, industry, company_type, country, status, trial_ends_at,
    created_by, updated_by, last_activity_at
  ) values (
    p_name,
    p_slug,
    p_industry,
    p_company_type,
    p_country,
    'trial',
    timezone('utc', now()) + interval '14 days',
    v_user,
    v_user,
    timezone('utc', now())
  )
  returning * into v_org;

  insert into public.organization_settings (organization_id)
  values (v_org.id)
  on conflict (organization_id) do nothing;

  insert into public.organization_members (
    organization_id, user_id, status, is_owner, joined_at, created_by
  ) values (
    v_org.id, v_user, 'active', true, timezone('utc', now()), v_user
  )
  returning * into v_member;

  select id into v_role_id
  from public.roles
  where organization_id is null and code = 'tenant_admin'
  limit 1;

  if v_role_id is not null then
    insert into public.member_roles (member_id, role_id, scope)
    values (v_member.id, v_role_id, 'organization');
  end if;

  select id into v_plan_id
  from public.plans
  where code = 'free_trial'
  limit 1;

  if v_plan_id is not null then
    insert into public.subscriptions (
      organization_id, plan_id, status, billing_interval,
      trial_ends_at, current_period_start, current_period_end, created_by
    ) values (
      v_org.id, v_plan_id, 'trialing', 'monthly',
      v_org.trial_ends_at, timezone('utc', now()), v_org.trial_ends_at, v_user
    );

    insert into public.billing_accounts (organization_id, company_name)
    values (v_org.id, v_org.name);

    insert into public.subscription_events (
      organization_id, event_type, to_plan_id, created_by, payload
    ) values (
      v_org.id, 'trial_started', v_plan_id, v_user, '{"source":"onboarding"}'::jsonb
    );
  end if;

  insert into public.audit_logs (
    organization_id, actor_user_id, action, entity_type, entity_id, new_values
  ) values (
    v_org.id, v_user, 'organization.created', 'organization', v_org.id,
    jsonb_build_object('name', v_org.name, 'industry', v_org.industry, 'status', v_org.status)
  );

  return v_org;
end;
$$;

grant execute on function public.bootstrap_organization(text, text, text, text, text) to authenticated;

-- Fallback path without RPC: creator can insert own owner membership once
drop policy if exists organization_members_bootstrap_insert on public.organization_members;
create policy organization_members_bootstrap_insert on public.organization_members
  for insert
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and is_owner = true
    and status = 'active'
  );

drop policy if exists organization_settings_bootstrap_insert on public.organization_settings;
create policy organization_settings_bootstrap_insert on public.organization_settings
  for insert
  with check (
    auth.uid() is not null
    and exists (
      select 1 from public.organizations o
      where o.id = organization_id
        and o.created_by = auth.uid()
    )
  );

drop policy if exists member_roles_bootstrap_insert on public.member_roles;
create policy member_roles_bootstrap_insert on public.member_roles
  for insert
  with check (
    auth.uid() is not null
    and exists (
      select 1
      from public.organization_members m
      where m.id = member_id
        and m.user_id = auth.uid()
        and m.is_owner = true
    )
  );

-- Allow trial subscription insert by org owner during onboarding
drop policy if exists subscriptions_owner_insert on public.subscriptions;
create policy subscriptions_owner_insert on public.subscriptions
  for insert
  with check (
    public.is_platform_admin()
    or exists (
      select 1 from public.organization_members m
      where m.organization_id = subscriptions.organization_id
        and m.user_id = auth.uid()
        and m.is_owner = true
        and m.status = 'active'
    )
  );


-- >>> 20260326000016_perf_indexes.sql
-- Performance: dashboard KPI counts filter heavily by event_type_id under an org.
create index if not exists ehs_events_org_type_idx
  on public.ehs_events (organization_id, event_type_id)
  where deleted_at is null;

create index if not exists capa_items_org_due_idx
  on public.capa_items (organization_id, due_date)
  where deleted_at is null;

