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
