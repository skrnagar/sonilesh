-- Phase 10: Contractor Management + Prequalification engine
-- Extends contractor_companies / workers / documents from 00013.
-- Reuses checklist_assignments, training_assignments, ehs-attachments, notifications.
-- Example categories are templates (organization_id is null) — not legal mandates.

-- ---------------------------------------------------------------------------
-- People model: link members to a contractor company (portal / workforce)
-- ---------------------------------------------------------------------------
alter table public.organization_members
  add column if not exists contractor_company_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'organization_members_contractor_company_fk'
  ) then
    alter table public.organization_members
      add constraint organization_members_contractor_company_fk
      foreign key (contractor_company_id)
      references public.contractor_companies (id)
      on delete set null;
  end if;
end $$;

create index if not exists organization_members_contractor_company_idx
  on public.organization_members (contractor_company_id)
  where contractor_company_id is not null and deleted_at is null;

-- ---------------------------------------------------------------------------
-- Helper: which contractor company the current user represents (portal contact)
-- ---------------------------------------------------------------------------
create or replace function public.contractor_company_id_for_user(p_organization_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select m.contractor_company_id
  from public.organization_members m
  where m.organization_id = p_organization_id
    and m.user_id = auth.uid()
    and m.status = 'active'
    and m.deleted_at is null
    and m.contractor_company_id is not null
  limit 1
$$;

create or replace function public.can_read_contractor_company(p_organization_id uuid, p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_platform_admin()
    or public.has_org_permission(p_organization_id, 'contractor.view')
    or public.has_org_permission(p_organization_id, 'contractors.view')
    or public.contractor_company_id_for_user(p_organization_id) = p_company_id
$$;

-- ---------------------------------------------------------------------------
-- Categories (org-null = example templates)
-- ---------------------------------------------------------------------------
create table if not exists public.contractor_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, code)
);

create unique index if not exists contractor_categories_template_code_uidx
  on public.contractor_categories (code)
  where organization_id is null;

-- ---------------------------------------------------------------------------
-- Extend contractor_companies
-- ---------------------------------------------------------------------------
alter table public.contractor_companies
  add column if not exists legal_name text,
  add column if not exists trade_name text,
  add column if not exists gstin text,
  add column if not exists pan text,
  add column if not exists cin text,
  add column if not exists registered_address text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists postal_code text,
  add column if not exists country text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists website text,
  add column if not exists category_id uuid references public.contractor_categories (id),
  add column if not exists notes text,
  add column if not exists blacklist_reason text,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references public.profiles (id),
  add column if not exists created_by uuid references public.profiles (id);

-- ---------------------------------------------------------------------------
-- Contacts, settings, invites
-- ---------------------------------------------------------------------------
create table if not exists public.contractor_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  company_id uuid not null references public.contractor_companies (id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  role_title text,
  is_primary boolean not null default false,
  user_id uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table if not exists public.contractor_settings (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  prequal_pass_percent numeric(6,2),
  prequal_conditional_percent numeric(6,2),
  enforce_mandatory_docs boolean not null default false,
  ptw_enforce_readiness boolean not null default false,
  induction_required boolean not null default true,
  mandatory_doc_types text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint contractor_settings_thresholds_chk check (
    prequal_pass_percent is null
    or prequal_conditional_percent is null
    or prequal_conditional_percent <= prequal_pass_percent
  )
);

create table if not exists public.contractor_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  company_id uuid not null references public.contractor_companies (id) on delete cascade,
  contact_id uuid references public.contractor_contacts (id) on delete set null,
  email text not null,
  full_name text,
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- Prequalification + versions (checklist engine is the questionnaire)
-- ---------------------------------------------------------------------------
create table if not exists public.contractor_prequalification (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  company_id uuid not null references public.contractor_companies (id) on delete cascade,
  checklist_template_id uuid references public.checklist_templates (id),
  current_assignment_id uuid references public.checklist_assignments (id),
  status text not null default 'draft'
    check (status in (
      'draft', 'in_progress', 'submitted', 'passed', 'conditional', 'failed', 'expired'
    )),
  score_percent numeric(6,2),
  pass_percent numeric(6,2),
  conditional_percent numeric(6,2),
  outcome text
    check (outcome is null or outcome in (
      'unconfigured', 'passed', 'conditional', 'failed'
    )),
  valid_until date,
  notes text,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table if not exists public.contractor_prequalification_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  prequalification_id uuid not null references public.contractor_prequalification (id) on delete cascade,
  version integer not null,
  checklist_assignment_id uuid references public.checklist_assignments (id),
  score_percent numeric(6,2),
  outcome text,
  pass_percent numeric(6,2),
  conditional_percent numeric(6,2),
  snapshot jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  unique (prequalification_id, version)
);

-- ---------------------------------------------------------------------------
-- Contracts
-- ---------------------------------------------------------------------------
create table if not exists public.contractor_contracts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  company_id uuid not null references public.contractor_companies (id) on delete cascade,
  contract_number text,
  title text not null,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'suspended', 'expired', 'closed')),
  starts_on date,
  ends_on date,
  value_amount numeric(14,2),
  currency text not null default 'INR',
  notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Explicit site / project assignment (approval at A ≠ B)
-- ---------------------------------------------------------------------------
create table if not exists public.contractor_site_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  company_id uuid not null references public.contractor_companies (id) on delete cascade,
  site_id uuid not null references public.sites (id) on delete cascade,
  status text not null default 'requested'
    check (status in ('requested', 'approved', 'rejected', 'suspended', 'expired')),
  valid_from date,
  valid_until date,
  requested_by uuid references public.profiles (id),
  approved_by uuid references public.profiles (id),
  approved_at timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (company_id, site_id)
);

create table if not exists public.contractor_project_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  company_id uuid not null references public.contractor_companies (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  site_assignment_id uuid references public.contractor_site_assignments (id) on delete set null,
  status text not null default 'requested'
    check (status in ('requested', 'approved', 'rejected', 'suspended', 'expired')),
  valid_from date,
  valid_until date,
  requested_by uuid references public.profiles (id),
  approved_by uuid references public.profiles (id),
  approved_at timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (company_id, project_id)
);

-- ---------------------------------------------------------------------------
-- Workers: link to people model
-- ---------------------------------------------------------------------------
alter table public.contractor_workers
  add column if not exists member_id uuid references public.organization_members (id) on delete set null,
  add column if not exists profile_id uuid references public.profiles (id) on delete set null,
  add column if not exists trade text,
  add column if not exists role_title text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists id_number text;

create table if not exists public.contractor_worker_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  worker_id uuid not null references public.contractor_workers (id) on delete cascade,
  company_id uuid not null references public.contractor_companies (id) on delete cascade,
  site_id uuid references public.sites (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  status text not null default 'requested'
    check (status in ('requested', 'approved', 'rejected', 'suspended', 'expired')),
  valid_from date,
  valid_until date,
  approved_by uuid references public.profiles (id),
  approved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint contractor_worker_assignments_scope_chk check (
    site_id is not null or project_id is not null
  )
);

-- ---------------------------------------------------------------------------
-- Inductions
-- ---------------------------------------------------------------------------
create table if not exists public.contractor_inductions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  site_id uuid references public.sites (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  title text not null,
  description text,
  validity_days integer,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.contractor_induction_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  induction_id uuid not null references public.contractor_inductions (id) on delete cascade,
  worker_id uuid not null references public.contractor_workers (id) on delete cascade,
  company_id uuid not null references public.contractor_companies (id) on delete cascade,
  completed_at timestamptz,
  expires_on date,
  recorded_by uuid references public.profiles (id),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (induction_id, worker_id)
);

-- ---------------------------------------------------------------------------
-- Assessments (consume checklist engine)
-- ---------------------------------------------------------------------------
create table if not exists public.contractor_assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  company_id uuid not null references public.contractor_companies (id) on delete cascade,
  worker_id uuid references public.contractor_workers (id) on delete set null,
  site_id uuid references public.sites (id),
  checklist_assignment_id uuid not null references public.checklist_assignments (id),
  title text,
  score_percent numeric(6,2),
  status text not null default 'open',
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- Performance, status history, blacklist
-- ---------------------------------------------------------------------------
create table if not exists public.contractor_performance (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  company_id uuid not null references public.contractor_companies (id) on delete cascade,
  site_id uuid references public.sites (id),
  period_start date,
  period_end date,
  safety_score numeric(5,2),
  incidents_count integer not null default 0,
  findings_count integer not null default 0,
  capa_open_count integer not null default 0,
  notes text,
  recorded_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.contractor_status_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  company_id uuid not null references public.contractor_companies (id) on delete cascade,
  from_status text,
  to_status text not null,
  reason text,
  actor_user_id uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.contractor_blacklist_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  company_id uuid not null references public.contractor_companies (id) on delete cascade,
  worker_id uuid references public.contractor_workers (id) on delete set null,
  reason text not null,
  effective_on date not null default (timezone('utc', now()))::date,
  lifted_on date,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- Documents: metadata + storage path (files live in ehs-attachments)
-- ---------------------------------------------------------------------------
alter table public.contractor_documents
  add column if not exists worker_id uuid references public.contractor_workers (id) on delete cascade,
  add column if not exists storage_path text,
  add column if not exists file_name text,
  add column if not exists mime_type text,
  add column if not exists file_size integer,
  add column if not exists is_mandatory boolean not null default false,
  add column if not exists verification_status text not null default 'pending',
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by uuid references public.profiles (id),
  add column if not exists verification_notes text,
  add column if not exists uploaded_by uuid references public.profiles (id),
  add column if not exists notes text;

alter table public.contractor_documents drop constraint if exists contractor_documents_status_check;
alter table public.contractor_documents
  add constraint contractor_documents_status_check
  check (status in ('pending', 'valid', 'expired', 'rejected'));

alter table public.contractor_documents drop constraint if exists contractor_documents_verification_status_check;
alter table public.contractor_documents
  add constraint contractor_documents_verification_status_check
  check (verification_status in ('pending', 'verified', 'rejected'));

alter table public.contractor_documents alter column status set default 'pending';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists contractor_categories_org_idx
  on public.contractor_categories (organization_id, is_active);
create index if not exists contractor_contacts_company_idx
  on public.contractor_contacts (organization_id, company_id);
create index if not exists contractor_invites_org_email_idx
  on public.contractor_invites (organization_id, email);
create index if not exists contractor_prequalification_company_idx
  on public.contractor_prequalification (organization_id, company_id, status);
create index if not exists contractor_contracts_company_idx
  on public.contractor_contracts (organization_id, company_id, status);
create index if not exists contractor_site_assignments_site_idx
  on public.contractor_site_assignments (organization_id, site_id, status);
create index if not exists contractor_project_assignments_project_idx
  on public.contractor_project_assignments (organization_id, project_id, status);
create index if not exists contractor_worker_assignments_scope_idx
  on public.contractor_worker_assignments (organization_id, site_id, project_id, status);
create index if not exists contractor_induction_records_worker_idx
  on public.contractor_induction_records (organization_id, worker_id);
create index if not exists contractor_assessments_company_idx
  on public.contractor_assessments (organization_id, company_id);
create index if not exists contractor_performance_company_idx
  on public.contractor_performance (organization_id, company_id);
create index if not exists contractor_status_history_company_idx
  on public.contractor_status_history (organization_id, company_id, created_at desc);
create index if not exists contractor_documents_company_idx
  on public.contractor_documents (organization_id, company_id, verification_status);
create index if not exists contractor_workers_profile_idx
  on public.contractor_workers (organization_id, profile_id)
  where profile_id is not null;

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
drop trigger if exists contractor_categories_updated_at on public.contractor_categories;
create trigger contractor_categories_updated_at before update on public.contractor_categories
  for each row execute function public.set_updated_at();
drop trigger if exists contractor_contacts_updated_at on public.contractor_contacts;
create trigger contractor_contacts_updated_at before update on public.contractor_contacts
  for each row execute function public.set_updated_at();
drop trigger if exists contractor_settings_updated_at on public.contractor_settings;
create trigger contractor_settings_updated_at before update on public.contractor_settings
  for each row execute function public.set_updated_at();
drop trigger if exists contractor_prequalification_updated_at on public.contractor_prequalification;
create trigger contractor_prequalification_updated_at before update on public.contractor_prequalification
  for each row execute function public.set_updated_at();
drop trigger if exists contractor_contracts_updated_at on public.contractor_contracts;
create trigger contractor_contracts_updated_at before update on public.contractor_contracts
  for each row execute function public.set_updated_at();
drop trigger if exists contractor_site_assignments_updated_at on public.contractor_site_assignments;
create trigger contractor_site_assignments_updated_at before update on public.contractor_site_assignments
  for each row execute function public.set_updated_at();
drop trigger if exists contractor_project_assignments_updated_at on public.contractor_project_assignments;
create trigger contractor_project_assignments_updated_at before update on public.contractor_project_assignments
  for each row execute function public.set_updated_at();
drop trigger if exists contractor_worker_assignments_updated_at on public.contractor_worker_assignments;
create trigger contractor_worker_assignments_updated_at before update on public.contractor_worker_assignments
  for each row execute function public.set_updated_at();
drop trigger if exists contractor_inductions_updated_at on public.contractor_inductions;
create trigger contractor_inductions_updated_at before update on public.contractor_inductions
  for each row execute function public.set_updated_at();

-- Self-verify guard: uploader cannot mark their own document verified
create or replace function public.prevent_contractor_doc_self_verify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and new.verification_status = 'verified'
     and (old.verification_status is distinct from 'verified'
          or old.verified_by is distinct from new.verified_by) then
    if new.verified_by is null then
      raise exception 'verified_by is required';
    end if;
    if new.uploaded_by is not null and new.verified_by = new.uploaded_by then
      raise exception 'cannot self-verify contractor documents';
    end if;
    if not (
      public.is_platform_admin()
      or public.has_org_permission(new.organization_id, 'contractor_document.verify')
    ) then
      raise exception 'missing permission: contractor_document.verify';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists contractor_documents_no_self_verify on public.contractor_documents;
create trigger contractor_documents_no_self_verify
  before update on public.contractor_documents
  for each row execute function public.prevent_contractor_doc_self_verify();

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
insert into public.permissions (code, module, action, description) values
  ('contractor.view', 'contractor', 'view', 'View contractor register'),
  ('contractor.create', 'contractor', 'create', 'Create contractor companies'),
  ('contractor.update', 'contractor', 'update', 'Update contractor companies'),
  ('contractor.approve', 'contractor', 'approve', 'Approve contractor status and prequalification'),
  ('contractor.manage', 'contractor', 'manage', 'Full contractor administration'),
  ('contractor_worker.view', 'contractor_worker', 'view', 'View contractor workers'),
  ('contractor_worker.manage', 'contractor_worker', 'manage', 'Manage contractor workers'),
  ('contractor_document.view', 'contractor_document', 'view', 'View contractor documents'),
  ('contractor_document.manage', 'contractor_document', 'manage', 'Upload and manage contractor documents'),
  ('contractor_document.verify', 'contractor_document', 'verify', 'Verify contractor documents'),
  ('contractor_access.view', 'contractor_access', 'view', 'View contractor site/project assignments'),
  ('contractor_access.approve', 'contractor_access', 'approve', 'Approve contractor site/project access'),
  ('contractor_access.manage', 'contractor_access', 'manage', 'Manage contractor site/project access')
on conflict (code) do nothing;

insert into public.roles (organization_id, code, name, description, is_system, is_default)
values (null, 'contractor_contact', 'Contractor contact', 'External contractor portal user', true, false)
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.organization_id is null
  and r.code in ('tenant_admin', 'ehs_manager')
  and p.code in (
    'contractor.view','contractor.create','contractor.update','contractor.approve','contractor.manage',
    'contractor_worker.view','contractor_worker.manage',
    'contractor_document.view','contractor_document.manage','contractor_document.verify',
    'contractor_access.view','contractor_access.approve','contractor_access.manage',
    'contractors.view','contractors.manage'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.organization_id is null
  and r.code = 'ehs_officer'
  and p.code in (
    'contractor.view','contractor.create','contractor.update','contractor.approve',
    'contractor_worker.view','contractor_worker.manage',
    'contractor_document.view','contractor_document.manage','contractor_document.verify',
    'contractor_access.view','contractor_access.approve',
    'contractors.view'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.organization_id is null
  and r.code = 'site_manager'
  and p.code in (
    'contractor.view','contractor_worker.view','contractor_document.view',
    'contractor_access.view','contractor_access.approve','contractors.view'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.organization_id is null
  and r.code = 'contractor_contact'
  and p.code in (
    'contractor_document.view','contractor_document.manage','contractor_access.view'
  )
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Example categories (templates, not legally mandatory)
-- ---------------------------------------------------------------------------
insert into public.contractor_categories (organization_id, code, name, description, sort_order)
select null, v.code, v.name, v.description, v.sort_order
from (values
  ('civil', 'Civil', 'Example trade category — not a legal classification.', 10),
  ('electrical', 'Electrical', 'Example trade category — not a legal classification.', 20),
  ('mechanical', 'Mechanical', 'Example trade category — not a legal classification.', 30),
  ('scaffolding', 'Scaffolding', 'Example trade category — not a legal classification.', 40),
  ('lifting', 'Lifting / rigging', 'Example trade category — not a legal classification.', 50),
  ('hvac', 'HVAC', 'Example trade category — not a legal classification.', 60),
  ('housekeeping', 'Housekeeping', 'Example trade category — not a legal classification.', 70),
  ('security', 'Security', 'Example trade category — not a legal classification.', 80),
  ('logistics', 'Logistics', 'Example trade category — not a legal classification.', 90),
  ('general', 'General / other', 'Example catch-all category.', 100)
) as v(code, name, description, sort_order)
where not exists (
  select 1 from public.contractor_categories c
  where c.organization_id is null and c.code = v.code
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'contractor_categories','contractor_contacts','contractor_settings','contractor_invites',
    'contractor_prequalification','contractor_prequalification_versions','contractor_contracts',
    'contractor_site_assignments','contractor_project_assignments','contractor_worker_assignments',
    'contractor_inductions','contractor_induction_records','contractor_assessments',
    'contractor_performance','contractor_status_history','contractor_blacklist_records'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Categories: templates readable by members; writes org-scoped
drop policy if exists contractor_categories_read on public.contractor_categories;
create policy contractor_categories_read on public.contractor_categories
  for select using (
    organization_id is null
    or public.is_platform_admin()
    or public.is_org_member(organization_id)
  );
drop policy if exists contractor_categories_write on public.contractor_categories;
create policy contractor_categories_write on public.contractor_categories
  for all using (
    public.is_platform_admin()
    or (organization_id is not null and (
      public.has_org_permission(organization_id, 'contractor.manage')
      or public.has_org_permission(organization_id, 'contractors.manage')
    ))
  )
  with check (
    public.is_platform_admin()
    or (organization_id is not null and (
      public.has_org_permission(organization_id, 'contractor.manage')
      or public.has_org_permission(organization_id, 'contractors.manage')
    ))
  );

-- Tighten existing company/worker/document ALL policies
drop policy if exists contractor_companies_tenant on public.contractor_companies;
drop policy if exists contractor_companies_select on public.contractor_companies;
drop policy if exists contractor_companies_insert on public.contractor_companies;
drop policy if exists contractor_companies_update on public.contractor_companies;
drop policy if exists contractor_companies_delete on public.contractor_companies;
create policy contractor_companies_select on public.contractor_companies
  for select using (public.can_read_contractor_company(organization_id, id));
create policy contractor_companies_insert on public.contractor_companies
  for insert with check (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'contractor.create')
    or public.has_org_permission(organization_id, 'contractor.manage')
    or public.has_org_permission(organization_id, 'contractors.manage')
  );
create policy contractor_companies_update on public.contractor_companies
  for update using (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'contractor.update')
    or public.has_org_permission(organization_id, 'contractor.manage')
    or public.has_org_permission(organization_id, 'contractors.manage')
    or public.contractor_company_id_for_user(organization_id) = id
  )
  with check (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'contractor.update')
    or public.has_org_permission(organization_id, 'contractor.manage')
    or public.has_org_permission(organization_id, 'contractors.manage')
    or public.contractor_company_id_for_user(organization_id) = id
  );
create policy contractor_companies_delete on public.contractor_companies
  for delete using (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'contractor.manage')
    or public.has_org_permission(organization_id, 'contractors.manage')
  );

drop policy if exists contractor_workers_tenant on public.contractor_workers;
drop policy if exists contractor_workers_select on public.contractor_workers;
drop policy if exists contractor_workers_write on public.contractor_workers;
create policy contractor_workers_select on public.contractor_workers
  for select using (public.can_read_contractor_company(organization_id, company_id));
create policy contractor_workers_write on public.contractor_workers
  for all using (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'contractor_worker.manage')
    or public.has_org_permission(organization_id, 'contractor.manage')
    or public.has_org_permission(organization_id, 'contractors.manage')
  )
  with check (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'contractor_worker.manage')
    or public.has_org_permission(organization_id, 'contractor.manage')
    or public.has_org_permission(organization_id, 'contractors.manage')
  );

drop policy if exists contractor_documents_tenant on public.contractor_documents;
drop policy if exists contractor_documents_select on public.contractor_documents;
drop policy if exists contractor_documents_insert on public.contractor_documents;
drop policy if exists contractor_documents_update on public.contractor_documents;
drop policy if exists contractor_documents_delete on public.contractor_documents;
create policy contractor_documents_select on public.contractor_documents
  for select using (public.can_read_contractor_company(organization_id, company_id));
create policy contractor_documents_insert on public.contractor_documents
  for insert with check (
    public.can_read_contractor_company(organization_id, company_id)
    and (
      public.has_org_permission(organization_id, 'contractor_document.manage')
      or public.has_org_permission(organization_id, 'contractor.manage')
      or public.has_org_permission(organization_id, 'contractors.manage')
      or public.contractor_company_id_for_user(organization_id) = company_id
    )
  );
create policy contractor_documents_update on public.contractor_documents
  for update using (
    public.can_read_contractor_company(organization_id, company_id)
    and (
      public.has_org_permission(organization_id, 'contractor_document.manage')
      or public.has_org_permission(organization_id, 'contractor_document.verify')
      or public.has_org_permission(organization_id, 'contractor.manage')
      or public.contractor_company_id_for_user(organization_id) = company_id
    )
  )
  with check (
    public.can_read_contractor_company(organization_id, company_id)
  );
create policy contractor_documents_delete on public.contractor_documents
  for delete using (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'contractor_document.manage')
    or public.has_org_permission(organization_id, 'contractor.manage')
  );

-- Generic company-scoped tables
do $$
declare
  t text;
begin
  foreach t in array array[
    'contractor_contacts','contractor_invites','contractor_prequalification',
    'contractor_contracts',
    'contractor_site_assignments','contractor_project_assignments',
    'contractor_worker_assignments','contractor_induction_records',
    'contractor_assessments','contractor_performance','contractor_status_history',
    'contractor_blacklist_records'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format(
      'create policy %I on public.%I for select using (public.can_read_contractor_company(organization_id, company_id))',
      t || '_select', t
    );
    execute format('drop policy if exists %I on public.%I', t || '_write', t);
    execute format(
      $p$
      create policy %I on public.%I for all using (
        public.is_platform_admin()
        or public.has_org_permission(organization_id, 'contractor.manage')
        or public.has_org_permission(organization_id, 'contractors.manage')
        or public.has_org_permission(organization_id, 'contractor.update')
        or public.has_org_permission(organization_id, 'contractor_access.manage')
      ) with check (
        public.is_platform_admin()
        or public.has_org_permission(organization_id, 'contractor.manage')
        or public.has_org_permission(organization_id, 'contractors.manage')
        or public.has_org_permission(organization_id, 'contractor.update')
        or public.has_org_permission(organization_id, 'contractor.create')
        or public.has_org_permission(organization_id, 'contractor_access.manage')
        or public.contractor_company_id_for_user(organization_id) = company_id
      )
      $p$,
      t || '_write', t
    );
  end loop;
end $$;

drop policy if exists contractor_prequalification_versions_select on public.contractor_prequalification_versions;
create policy contractor_prequalification_versions_select on public.contractor_prequalification_versions
  for select using (
    exists (
      select 1 from public.contractor_prequalification p
      where p.id = prequalification_id
        and public.can_read_contractor_company(p.organization_id, p.company_id)
    )
  );
drop policy if exists contractor_prequalification_versions_write on public.contractor_prequalification_versions;
create policy contractor_prequalification_versions_write on public.contractor_prequalification_versions
  for all using (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'contractor.manage')
    or public.has_org_permission(organization_id, 'contractors.manage')
    or public.has_org_permission(organization_id, 'contractor.update')
  )
  with check (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'contractor.manage')
    or public.has_org_permission(organization_id, 'contractors.manage')
    or public.has_org_permission(organization_id, 'contractor.update')
    or public.has_org_permission(organization_id, 'contractor.approve')
  );

-- Portal contacts may insert their own contact/invite/doc-adjacent rows via WITH CHECK above.
-- Inductions (no company_id) — org members with contractor perms
drop policy if exists contractor_inductions_tenant on public.contractor_inductions;
create policy contractor_inductions_tenant on public.contractor_inductions
  for all using (
    public.is_platform_admin()
    or public.is_org_member(organization_id)
  )
  with check (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'contractor.manage')
    or public.has_org_permission(organization_id, 'contractor.update')
    or public.has_org_permission(organization_id, 'contractors.manage')
  );

drop policy if exists contractor_settings_select on public.contractor_settings;
create policy contractor_settings_select on public.contractor_settings
  for select using (
    public.is_platform_admin() or public.is_org_member(organization_id)
  );
drop policy if exists contractor_settings_write on public.contractor_settings;
create policy contractor_settings_write on public.contractor_settings
  for all using (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'contractor.manage')
    or public.has_org_permission(organization_id, 'settings.manage')
  )
  with check (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'contractor.manage')
    or public.has_org_permission(organization_id, 'settings.manage')
  );

-- Grants for new RLS helpers
revoke all on function public.contractor_company_id_for_user(uuid) from public;
revoke execute on function public.contractor_company_id_for_user(uuid) from anon;
grant execute on function public.contractor_company_id_for_user(uuid) to authenticated;
grant execute on function public.contractor_company_id_for_user(uuid) to service_role;

revoke all on function public.can_read_contractor_company(uuid, uuid) from public;
revoke execute on function public.can_read_contractor_company(uuid, uuid) from anon;
grant execute on function public.can_read_contractor_company(uuid, uuid) to authenticated;
grant execute on function public.can_read_contractor_company(uuid, uuid) to service_role;
