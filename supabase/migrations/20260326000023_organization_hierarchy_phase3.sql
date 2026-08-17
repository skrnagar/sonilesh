-- Phase 3: organization hierarchy enrichment, invitations, onboarding progress, scopes

-- Organizations: company profile fields
alter table public.organizations
  add column if not exists legal_name text,
  add column if not exists company_size text,
  add column if not exists state text,
  add column if not exists city text,
  add column if not exists currency text default 'INR',
  add column if not exists website text,
  add column if not exists logo_url text;

-- Organization settings: regional + hierarchy config
alter table public.organization_settings
  add column if not exists hierarchy_config jsonb not null default '{
    "use_business_units": true,
    "use_projects": true,
    "use_departments": true,
    "use_locations": true
  }'::jsonb,
  add column if not exists time_format text not null default '24h',
  add column if not exists language text not null default 'en';

-- Onboarding progress (resumable wizard)
create table if not exists public.organization_onboarding_progress (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations (id) on delete cascade,
  current_step text not null default 'welcome',
  completed_steps text[] not null default '{}',
  skipped_steps text[] not null default '{}',
  step_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references public.profiles (id)
);

-- Business units enrichment
alter table public.business_units
  add column if not exists description text,
  add column if not exists head_member_id uuid references public.organization_members (id),
  add column if not exists status text not null default 'active';

do $$ begin
  alter table public.business_units
    add constraint business_units_status_check
    check (status in ('active', 'inactive', 'archived'));
exception when duplicate_object then null;
end $$;

-- Sites enrichment
alter table public.sites
  add column if not exists state text,
  add column if not exists latitude numeric,
  add column if not exists longitude numeric,
  add column if not exists site_manager_member_id uuid references public.organization_members (id),
  add column if not exists site_type text not null default 'permanent',
  add column if not exists status text not null default 'active',
  add column if not exists start_date date,
  add column if not exists end_date date;

do $$ begin
  alter table public.sites
    add constraint sites_site_type_check
    check (site_type in ('permanent', 'temporary_project'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.sites
    add constraint sites_status_check
    check (status in ('active', 'inactive', 'archived'));
exception when duplicate_object then null;
end $$;

-- Projects enrichment
alter table public.projects
  add column if not exists project_type text,
  add column if not exists client_name text,
  add column if not exists project_manager_member_id uuid references public.organization_members (id),
  add column if not exists expected_end_date date,
  add column if not exists actual_end_date date;

-- Expand project status values (drop old check if any, add new)
alter table public.projects drop constraint if exists projects_status_check;
alter table public.projects
  add constraint projects_status_check
  check (status in ('planning', 'active', 'on_hold', 'completed', 'cancelled'));

-- Departments enrichment
alter table public.departments
  add column if not exists business_unit_id uuid references public.business_units (id),
  add column if not exists head_member_id uuid references public.organization_members (id),
  add column if not exists status text not null default 'active';

do $$ begin
  alter table public.departments
    add constraint departments_status_check
    check (status in ('active', 'inactive', 'archived'));
exception when duplicate_object then null;
end $$;

-- Locations enrichment (hierarchy + optional project)
alter table public.locations
  add column if not exists parent_location_id uuid references public.locations (id),
  add column if not exists project_id uuid references public.projects (id),
  add column if not exists location_type text not null default 'other',
  add column if not exists description text,
  add column if not exists status text not null default 'active';

do $$ begin
  alter table public.locations
    add constraint locations_status_check
    check (status in ('active', 'inactive', 'archived'));
exception when duplicate_object then null;
end $$;

-- Member scopes: extend beyond site/department
alter table public.member_roles drop constraint if exists member_roles_scope_check;
alter table public.member_roles
  add constraint member_roles_scope_check
  check (scope in (
    'platform',
    'organization',
    'business_unit',
    'site',
    'project',
    'department',
    'own',
    'self'
  ));

alter table public.member_roles
  add column if not exists business_unit_id uuid references public.business_units (id),
  add column if not exists project_id uuid references public.projects (id);

-- Invitations (secure token, expiry)
create table if not exists public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null,
  full_name text,
  role_code text not null default 'employee',
  business_unit_id uuid references public.business_units (id),
  site_id uuid references public.sites (id),
  department_id uuid references public.departments (id),
  project_id uuid references public.projects (id),
  scope text not null default 'organization'
    check (scope in ('organization', 'business_unit', 'site', 'project', 'department', 'self')),
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  unique (organization_id, email)
);

create index if not exists organization_invitations_org_idx
  on public.organization_invitations (organization_id);
create index if not exists organization_invitations_token_idx
  on public.organization_invitations (token_hash);

-- Configurable project types (org-level catalog)
create table if not exists public.organization_project_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  code text not null,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, code)
);

-- RLS
alter table public.organization_onboarding_progress enable row level security;
alter table public.organization_invitations enable row level security;
alter table public.organization_project_types enable row level security;

drop policy if exists onboarding_progress_tenant on public.organization_onboarding_progress;
create policy onboarding_progress_tenant on public.organization_onboarding_progress
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists invitations_tenant on public.organization_invitations;
create policy invitations_tenant on public.organization_invitations
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists project_types_tenant on public.organization_project_types;
create policy project_types_tenant on public.organization_project_types
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

-- Integrity helpers: ensure child org matches parent org
create or replace function public.assert_same_org_site()
returns trigger
language plpgsql
as $$
declare
  site_org uuid;
begin
  if new.site_id is null then
    return new;
  end if;
  select organization_id into site_org from public.sites where id = new.site_id;
  if site_org is null or site_org <> new.organization_id then
    raise exception 'site_id must belong to the same organization';
  end if;
  return new;
end;
$$;

drop trigger if exists projects_same_org_site on public.projects;
create trigger projects_same_org_site
  before insert or update on public.projects
  for each row execute function public.assert_same_org_site();

drop trigger if exists departments_same_org_site on public.departments;
create trigger departments_same_org_site
  before insert or update on public.departments
  for each row execute function public.assert_same_org_site();

drop trigger if exists locations_same_org_site on public.locations;
create trigger locations_same_org_site
  before insert or update on public.locations
  for each row execute function public.assert_same_org_site();

create or replace function public.assert_same_org_bu()
returns trigger
language plpgsql
as $$
declare
  bu_org uuid;
begin
  if new.business_unit_id is null then
    return new;
  end if;
  select organization_id into bu_org from public.business_units where id = new.business_unit_id;
  if bu_org is null or bu_org <> new.organization_id then
    raise exception 'business_unit_id must belong to the same organization';
  end if;
  return new;
end;
$$;

drop trigger if exists sites_same_org_bu on public.sites;
create trigger sites_same_org_bu
  before insert or update on public.sites
  for each row execute function public.assert_same_org_bu();

drop trigger if exists projects_same_org_bu on public.projects;
create trigger projects_same_org_bu
  before insert or update on public.projects
  for each row execute function public.assert_same_org_bu();

drop trigger if exists departments_same_org_bu on public.departments;
create trigger departments_same_org_bu
  before insert or update on public.departments
  for each row execute function public.assert_same_org_bu();
