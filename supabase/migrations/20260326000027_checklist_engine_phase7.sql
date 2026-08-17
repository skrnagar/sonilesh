-- Phase 7: Universal Checklist Engine + Inspections + Audits enrichment
-- One reusable engine (checklist_*) — PTW keeps its own tables for now; future modules reuse this engine.

-- ---------------------------------------------------------------------------
-- Expand module types (future: equipment, vehicle, behavioral, etc.)
-- ---------------------------------------------------------------------------
alter table public.checklist_templates drop constraint if exists checklist_templates_checklist_type_check;
alter table public.checklist_templates
  add constraint checklist_templates_checklist_type_check
  check (checklist_type in (
    'inspection', 'audit', 'equipment', 'vehicle', 'behavioral',
    'contractor', 'training', 'compliance', 'environmental', 'general', 'permit'
  ));

alter table public.checklist_assignments drop constraint if exists checklist_assignments_checklist_type_check;
alter table public.checklist_assignments
  add constraint checklist_assignments_checklist_type_check
  check (checklist_type in (
    'inspection', 'audit', 'equipment', 'vehicle', 'behavioral',
    'contractor', 'training', 'compliance', 'environmental', 'general', 'permit'
  ));

alter table public.checklist_templates
  add column if not exists module_context text,
  add column if not exists version integer not null default 1,
  add column if not exists pass_threshold_percent numeric(6,2) default 80,
  add column if not exists requires_review boolean not null default false,
  add column if not exists config jsonb not null default '{}'::jsonb;

alter table public.checklist_questions
  add column if not exists failing_values text[] not null default '{}',
  add column if not exists evidence_required boolean not null default false,
  add column if not exists max_score numeric(8,2);

alter table public.checklist_assignments
  add column if not exists business_unit_id uuid references public.business_units (id),
  add column if not exists department_id uuid references public.departments (id),
  add column if not exists location_id uuid references public.locations (id),
  add column if not exists reviewer_id uuid references public.profiles (id),
  add column if not exists reviewed_at timestamptz,
  add column if not exists approved_by uuid references public.profiles (id),
  add column if not exists approved_at timestamptz,
  add column if not exists priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'critical')),
  add column if not exists description text,
  add column if not exists total_score numeric(10,2),
  add column if not exists max_possible_score numeric(10,2),
  add column if not exists findings_count integer not null default 0,
  add column if not exists parent_assignment_id uuid references public.checklist_assignments (id);

alter table public.checklist_assignments drop constraint if exists checklist_assignments_status_check;
alter table public.checklist_assignments
  add constraint checklist_assignments_status_check
  check (status in (
    'draft', 'scheduled', 'assigned', 'in_progress', 'completed', 'findings_review',
    'under_review', 'approved', 'capa', 'closed', 'cancelled',
    'planned', 'auditee_notified', 'conducted', 'findings_recorded',
    'categorized', 'capa_linked', 'report_issued'
  ));

alter table public.checklist_responses
  add column if not exists is_failing boolean not null default false,
  add column if not exists storage_path text;

alter table public.checklist_findings
  add column if not exists severity_rank integer,
  add column if not exists site_id uuid references public.sites (id),
  add column if not exists due_date date,
  add column if not exists owner_id uuid references public.profiles (id),
  add column if not exists closed_at timestamptz,
  add column if not exists closed_by uuid references public.profiles (id);

-- Evidence (multi photos/files per assignment or response)
create table if not exists public.checklist_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  assignment_id uuid not null references public.checklist_assignments (id) on delete cascade,
  response_id uuid references public.checklist_responses (id) on delete set null,
  finding_id uuid references public.checklist_findings (id) on delete set null,
  storage_path text not null,
  file_name text not null,
  content_type text,
  file_size integer,
  uploaded_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists checklist_evidence_assignment_idx
  on public.checklist_evidence (assignment_id);

-- Immutable activity timeline
create table if not exists public.checklist_activity (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  assignment_id uuid not null references public.checklist_assignments (id) on delete cascade,
  actor_user_id uuid references public.profiles (id),
  event_type text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists checklist_activity_assignment_idx
  on public.checklist_activity (assignment_id, created_at desc);

-- Schedule definitions (recurring)
create table if not exists public.checklist_schedules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  template_id uuid not null references public.checklist_templates (id) on delete cascade,
  name text not null,
  checklist_type text not null,
  site_id uuid references public.sites (id),
  project_id uuid references public.projects (id),
  assignee_id uuid references public.profiles (id),
  recurrence_rule text not null default 'FREQ=WEEKLY',
  next_run_date date,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Permissions
insert into public.permissions (code, module, action, description) values
  ('inspections.create', 'inspections', 'create', 'Create inspections'),
  ('inspections.review', 'inspections', 'review', 'Review inspections'),
  ('inspections.close', 'inspections', 'close', 'Close inspections'),
  ('audits.create', 'audits', 'create', 'Create audits'),
  ('audits.review', 'audits', 'review', 'Review audits'),
  ('audits.close', 'audits', 'close', 'Close audits'),
  ('findings.view', 'findings', 'view', 'View checklist findings'),
  ('findings.manage', 'findings', 'manage', 'Manage findings and CAPA links')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.organization_id is null
  and r.code in ('tenant_admin', 'ehs_manager', 'ehs_officer')
  and p.code in (
    'inspections.create','inspections.review','inspections.close',
    'audits.create','audits.review','audits.close',
    'findings.view','findings.manage'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.organization_id is null
  and r.code = 'supervisor'
  and p.code in ('inspections.conduct','inspections.create','findings.view')
on conflict do nothing;

-- Same-org integrity
create or replace function public.assert_checklist_assignment_same_org()
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
  if new.template_id is not null then
    select organization_id into ref_org from public.checklist_templates where id = new.template_id;
    if ref_org is null or ref_org <> new.organization_id then
      raise exception 'template_id must belong to the same organization';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists checklist_assignments_same_org on public.checklist_assignments;
create trigger checklist_assignments_same_org
  before insert or update on public.checklist_assignments
  for each row execute function public.assert_checklist_assignment_same_org();

-- RLS
alter table public.checklist_evidence enable row level security;
alter table public.checklist_activity enable row level security;
alter table public.checklist_schedules enable row level security;

drop policy if exists checklist_evidence_tenant on public.checklist_evidence;
create policy checklist_evidence_tenant on public.checklist_evidence
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));

drop policy if exists checklist_activity_select on public.checklist_activity;
create policy checklist_activity_select on public.checklist_activity
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));

drop policy if exists checklist_activity_insert on public.checklist_activity;
create policy checklist_activity_insert on public.checklist_activity
  for insert with check (public.is_platform_admin() or public.is_org_member(organization_id));

drop policy if exists checklist_schedules_tenant on public.checklist_schedules;
create policy checklist_schedules_tenant on public.checklist_schedules
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'checklists.manage')
  );

create trigger checklist_schedules_updated_at before update on public.checklist_schedules
  for each row execute function public.set_updated_at();
