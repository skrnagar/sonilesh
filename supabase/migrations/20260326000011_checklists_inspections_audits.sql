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
