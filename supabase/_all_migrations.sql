-- EHS360 full schema
-- Paste into Supabase SQL Editor for project sqybbygfksnjvmatiafm

-- >>> 20260326000001_extensions_and_helpers.sql
-- EHS360: extensions and shared trigger helpers
create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.current_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;


-- >>> 20260326000002_foundation_tenancy_rbac.sql
-- EHS360 Phase 1: foundation tenancy + RBAC + org structure

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  phone text,
  is_platform_admin boolean not null default false,
  locale text not null default 'en',
  timezone text not null default 'UTC',
  last_sign_in_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  legal_name text,
  industry text,
  company_type text,
  status text not null default 'pending'
    check (status in ('pending', 'trial', 'active', 'suspended', 'cancelled', 'churned')),
  logo_url text,
  website text,
  country text,
  timezone text not null default 'UTC',
  onboarding_completed_at timestamptz,
  trial_ends_at timestamptz,
  last_activity_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  deleted_at timestamptz
);

create table public.organization_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations (id) on delete cascade,
  branding jsonb not null default '{}'::jsonb,
  terminology jsonb not null default '{}'::jsonb,
  risk_matrix jsonb not null default '{"scale":5,"bands":{"low":[1,4],"medium":[5,9],"high":[10,14],"critical":[15,25]}}'::jsonb,
  locale text not null default 'en',
  date_format text not null default 'yyyy-MM-dd',
  allow_anonymous_reporting boolean not null default false,
  investigation_severity_threshold integer not null default 3,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'invited'
    check (status in ('invited', 'active', 'suspended', 'removed')),
  title text,
  employee_number text,
  is_owner boolean not null default false,
  invited_email text,
  invited_at timestamptz,
  joined_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  deleted_at timestamptz,
  unique (organization_id, user_id)
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  module text not null,
  action text not null,
  description text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  is_system boolean not null default false,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  unique (organization_id, code)
);

-- Allow one set of global system roles where organization_id is null
create unique index roles_system_code_uidx
  on public.roles (code)
  where organization_id is null;

create table public.role_permissions (
  role_id uuid not null references public.roles (id) on delete cascade,
  permission_id uuid not null references public.permissions (id) on delete cascade,
  primary key (role_id, permission_id)
);

create table public.business_units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  code text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  deleted_at timestamptz,
  unique (organization_id, code)
);

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  business_unit_id uuid references public.business_units (id),
  name text not null,
  code text not null,
  address text,
  city text,
  country text,
  timezone text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  deleted_at timestamptz,
  unique (organization_id, code)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  site_id uuid references public.sites (id),
  business_unit_id uuid references public.business_units (id),
  name text not null,
  code text not null,
  status text not null default 'active',
  start_date date,
  end_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  deleted_at timestamptz,
  unique (organization_id, code)
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  site_id uuid references public.sites (id),
  name text not null,
  code text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  deleted_at timestamptz,
  unique (organization_id, site_id, code)
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  site_id uuid not null references public.sites (id) on delete cascade,
  name text not null,
  code text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  deleted_at timestamptz,
  unique (organization_id, site_id, code)
);

create table public.member_roles (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.organization_members (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete cascade,
  scope text not null default 'organization'
    check (scope in ('platform', 'organization', 'site', 'department', 'own')),
  site_id uuid references public.sites (id),
  department_id uuid references public.departments (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create index organization_members_user_idx on public.organization_members (user_id);
create index organization_members_org_idx on public.organization_members (organization_id);
create index sites_org_idx on public.sites (organization_id);
create index projects_org_idx on public.projects (organization_id);
create index member_roles_member_idx on public.member_roles (member_id);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger organizations_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();
create trigger organization_settings_updated_at before update on public.organization_settings
  for each row execute function public.set_updated_at();
create trigger organization_members_updated_at before update on public.organization_members
  for each row execute function public.set_updated_at();
create trigger roles_updated_at before update on public.roles
  for each row execute function public.set_updated_at();
create trigger business_units_updated_at before update on public.business_units
  for each row execute function public.set_updated_at();
create trigger sites_updated_at before update on public.sites
  for each row execute function public.set_updated_at();
create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger departments_updated_at before update on public.departments
  for each row execute function public.set_updated_at();
create trigger locations_updated_at before update on public.locations
  for each row execute function public.set_updated_at();

-- Auto-create profile on auth signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- >>> 20260326000003_subscriptions_entitlements.sql
-- EHS360 Phase 3: subscription + entitlement engine

create table public.features (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  category text not null default 'module'
    check (category in ('module', 'limit', 'integration', 'addon')),
  value_type text not null default 'boolean'
    check (value_type in ('boolean', 'numeric', 'unlimited')),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  is_active boolean not null default true,
  is_public boolean not null default true,
  is_custom boolean not null default false,
  sort_order integer not null default 0,
  trial_days integer not null default 14,
  price_monthly_cents integer not null default 0,
  price_yearly_cents integer not null default 0,
  currency text not null default 'USD',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.plan_features (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  feature_id uuid not null references public.features (id) on delete cascade,
  enabled boolean not null default true,
  limit_value numeric,
  unlimited boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique (plan_id, feature_id)
);

create table public.billing_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations (id) on delete cascade,
  billing_email text,
  company_name text,
  tax_id text,
  address jsonb not null default '{}'::jsonb,
  currency text not null default 'USD',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  plan_id uuid not null references public.plans (id),
  status text not null default 'trialing'
    check (status in ('trialing', 'active', 'past_due', 'cancelled', 'paused', 'expired')),
  billing_interval text not null default 'monthly'
    check (billing_interval in ('monthly', 'yearly')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  cancel_at timestamptz,
  cancelled_at timestamptz,
  custom_price_monthly_cents integer,
  custom_price_yearly_cents integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  deleted_at timestamptz
);

create unique index subscriptions_one_active_per_org
  on public.subscriptions (organization_id)
  where deleted_at is null and status in ('trialing', 'active', 'past_due', 'paused');

create table public.subscription_items (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  feature_id uuid references public.features (id),
  description text,
  quantity numeric not null default 1,
  unit_price_cents integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.organization_feature_overrides (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  feature_id uuid not null references public.features (id) on delete cascade,
  enabled boolean,
  limit_value numeric,
  unlimited boolean not null default false,
  reason text,
  starts_at timestamptz not null default timezone('utc', now()),
  ends_at timestamptz,
  is_temporary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  unique (organization_id, feature_id, starts_at)
);

create table public.usage_metrics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  feature_id uuid not null references public.features (id) on delete cascade,
  period_start date not null,
  period_end date not null,
  usage_value numeric not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, feature_id, period_start, period_end)
);

create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  feature_id uuid not null references public.features (id) on delete cascade,
  event_name text not null,
  quantity numeric not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id)
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  billing_account_id uuid references public.billing_accounts (id),
  subscription_id uuid references public.subscriptions (id),
  invoice_number text not null,
  status text not null default 'draft'
    check (status in ('draft', 'open', 'paid', 'void', 'uncollectible')),
  currency text not null default 'USD',
  subtotal_cents integer not null default 0,
  tax_cents integer not null default 0,
  total_cents integer not null default 0,
  period_start timestamptz,
  period_end timestamptz,
  due_date date,
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, invoice_number)
);

create table public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  event_type text not null,
  from_plan_id uuid references public.plans (id),
  to_plan_id uuid references public.plans (id),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id)
);

create trigger features_updated_at before update on public.features
  for each row execute function public.set_updated_at();
create trigger plans_updated_at before update on public.plans
  for each row execute function public.set_updated_at();
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();
create trigger billing_accounts_updated_at before update on public.billing_accounts
  for each row execute function public.set_updated_at();
create trigger organization_feature_overrides_updated_at before update on public.organization_feature_overrides
  for each row execute function public.set_updated_at();
create trigger usage_metrics_updated_at before update on public.usage_metrics
  for each row execute function public.set_updated_at();
create trigger invoices_updated_at before update on public.invoices
  for each row execute function public.set_updated_at();


-- >>> 20260326000004_platform_admin_audit.sql
-- EHS360 Phase 2: platform admin support + audit trail

create table public.platform_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  description text,
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references public.profiles (id)
);

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete set null,
  created_by uuid references public.profiles (id),
  assigned_to uuid references public.profiles (id),
  subject text not null,
  body text not null,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete set null,
  actor_user_id uuid references public.profiles (id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  previous_values jsonb,
  new_values jsonb,
  reason text,
  ip_address text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index audit_logs_org_idx on public.audit_logs (organization_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);

create trigger support_tickets_updated_at before update on public.support_tickets
  for each row execute function public.set_updated_at();
create trigger platform_settings_updated_at before update on public.platform_settings
  for each row execute function public.set_updated_at();

-- Prevent mutation of audit logs
create or replace function public.prevent_audit_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_logs are append-only';
end;
$$;

create trigger audit_logs_no_update
  before update or delete on public.audit_logs
  for each row execute function public.prevent_audit_mutation();


-- >>> 20260326000005_ehs_events.sql
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


-- >>> 20260326000006_rls_policies.sql
-- EHS360: RLS helpers + policies

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_platform_admin from public.profiles p where p.id = auth.uid() and p.deleted_at is null),
    false
  );
$$;

create or replace function public.is_org_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.deleted_at is null
  );
$$;

create or replace function public.has_org_permission(
  p_organization_id uuid,
  p_permission_code text,
  p_site_id uuid default null
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if public.is_platform_admin() then
    return true;
  end if;

  return exists (
    select 1
    from public.organization_members m
    join public.member_roles mr on mr.member_id = m.id and mr.deleted_at is null
    join public.role_permissions rp on rp.role_id = mr.role_id
    join public.permissions p on p.id = rp.permission_id
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.deleted_at is null
      and p.code = p_permission_code
      and (
        mr.scope in ('organization', 'platform')
        or p_site_id is null
        or mr.site_id is null
        or mr.site_id = p_site_id
      )
  );
end;
$$;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_settings enable row level security;
alter table public.organization_members enable row level security;
alter table public.permissions enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.member_roles enable row level security;
alter table public.business_units enable row level security;
alter table public.sites enable row level security;
alter table public.projects enable row level security;
alter table public.departments enable row level security;
alter table public.locations enable row level security;
alter table public.features enable row level security;
alter table public.plans enable row level security;
alter table public.plan_features enable row level security;
alter table public.billing_accounts enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_items enable row level security;
alter table public.organization_feature_overrides enable row level security;
alter table public.usage_metrics enable row level security;
alter table public.usage_events enable row level security;
alter table public.invoices enable row level security;
alter table public.subscription_events enable row level security;
alter table public.platform_settings enable row level security;
alter table public.support_tickets enable row level security;
alter table public.audit_logs enable row level security;
alter table public.number_sequences enable row level security;
alter table public.event_types enable row level security;
alter table public.event_categories enable row level security;
alter table public.severity_levels enable row level security;
alter table public.ehs_events enable row level security;
alter table public.ehs_event_people enable row level security;
alter table public.ehs_event_witnesses enable row level security;
alter table public.ehs_event_injuries enable row level security;
alter table public.ehs_event_comments enable row level security;
alter table public.ehs_event_attachments enable row level security;
alter table public.ehs_event_activity enable row level security;
alter table public.investigations enable row level security;
alter table public.capa_items enable row level security;

-- Profiles
create policy profiles_select_self_or_admin on public.profiles
  for select using (id = auth.uid() or public.is_platform_admin());
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid() or public.is_platform_admin());

-- Organizations
create policy organizations_select on public.organizations
  for select using (public.is_platform_admin() or public.is_org_member(id));
create policy organizations_insert on public.organizations
  for insert with check (auth.uid() is not null);
create policy organizations_update on public.organizations
  for update using (
    public.is_platform_admin()
    or public.has_org_permission(id, 'settings.manage')
  );

-- Organization settings
create policy organization_settings_select on public.organization_settings
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));
create policy organization_settings_mutate on public.organization_settings
  for all using (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'settings.manage')
  )
  with check (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'settings.manage')
  );

-- Members
create policy organization_members_select on public.organization_members
  for select using (public.is_platform_admin() or public.is_org_member(organization_id) or user_id = auth.uid());
create policy organization_members_mutate on public.organization_members
  for all using (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'users.manage')
  )
  with check (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'users.manage')
    or (user_id = auth.uid())
  );

-- Permissions & roles (readable by members; mutable by admins)
create policy permissions_select on public.permissions for select using (auth.uid() is not null);
create policy roles_select on public.roles
  for select using (
    organization_id is null
    or public.is_platform_admin()
    or public.is_org_member(organization_id)
  );
create policy role_permissions_select on public.role_permissions for select using (auth.uid() is not null);
create policy member_roles_select on public.member_roles
  for select using (
    public.is_platform_admin()
    or exists (
      select 1 from public.organization_members m
      where m.id = member_id and (public.is_org_member(m.organization_id) or m.user_id = auth.uid())
    )
  );
create policy member_roles_mutate on public.member_roles
  for all using (
    public.is_platform_admin()
    or exists (
      select 1 from public.organization_members m
      where m.id = member_id and public.has_org_permission(m.organization_id, 'users.manage')
    )
  )
  with check (
    public.is_platform_admin()
    or exists (
      select 1 from public.organization_members m
      where m.id = member_id and public.has_org_permission(m.organization_id, 'users.manage')
    )
  );

-- Org structure tables
create policy business_units_tenant on public.business_units
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));
create policy sites_tenant on public.sites
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));
create policy projects_tenant on public.projects
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));
create policy departments_tenant on public.departments
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));
create policy locations_tenant on public.locations
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));

-- Plans/features catalog
create policy features_select on public.features for select using (auth.uid() is not null);
create policy plans_select on public.plans for select using (auth.uid() is not null or is_public = true);
create policy plan_features_select on public.plan_features for select using (auth.uid() is not null);
create policy features_admin on public.features for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy plans_admin on public.plans for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy plan_features_admin on public.plan_features for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- Subscription domain
create policy billing_accounts_tenant on public.billing_accounts
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.has_org_permission(organization_id, 'billing.view') or public.is_platform_admin());
create policy subscriptions_select on public.subscriptions
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));
create policy subscriptions_admin on public.subscriptions
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy subscription_items_select on public.subscription_items
  for select using (
    public.is_platform_admin()
    or exists (
      select 1 from public.subscriptions s
      where s.id = subscription_id and public.is_org_member(s.organization_id)
    )
  );
create policy organization_feature_overrides_select on public.organization_feature_overrides
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));
create policy organization_feature_overrides_admin on public.organization_feature_overrides
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy usage_metrics_tenant on public.usage_metrics
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));
create policy usage_events_tenant on public.usage_events
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));
create policy invoices_tenant on public.invoices
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));
create policy subscription_events_tenant on public.subscription_events
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));

-- Platform
create policy platform_settings_admin on public.platform_settings
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy support_tickets_access on public.support_tickets
  for all using (
    public.is_platform_admin()
    or created_by = auth.uid()
    or (organization_id is not null and public.is_org_member(organization_id))
  )
  with check (
    public.is_platform_admin()
    or created_by = auth.uid()
    or (organization_id is not null and public.is_org_member(organization_id))
  );
create policy audit_logs_select on public.audit_logs
  for select using (
    public.is_platform_admin()
    or (organization_id is not null and public.has_org_permission(organization_id, 'audit.view'))
  );
create policy audit_logs_insert on public.audit_logs
  for insert with check (auth.uid() is not null);

-- EHS events domain
create policy event_types_select on public.event_types
  for select using (organization_id is null or public.is_org_member(organization_id) or public.is_platform_admin());
create policy event_categories_tenant on public.event_categories
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));
create policy severity_levels_select on public.severity_levels
  for select using (organization_id is null or public.is_org_member(organization_id) or public.is_platform_admin());
create policy number_sequences_tenant on public.number_sequences
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));

create policy ehs_events_select on public.ehs_events
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));
create policy ehs_events_insert on public.ehs_events
  for insert with check (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'incidents.create')
    or public.has_org_permission(organization_id, 'near_miss.create')
    or public.has_org_permission(organization_id, 'hazards.create')
  );
create policy ehs_events_update on public.ehs_events
  for update using (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'incidents.update', site_id)
    or public.has_org_permission(organization_id, 'near_miss.update', site_id)
    or public.has_org_permission(organization_id, 'hazards.update', site_id)
    or reporter_id = auth.uid()
  );

create policy ehs_event_people_tenant on public.ehs_event_people
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));
create policy ehs_event_witnesses_tenant on public.ehs_event_witnesses
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));
create policy ehs_event_injuries_tenant on public.ehs_event_injuries
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));
create policy ehs_event_comments_tenant on public.ehs_event_comments
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));
create policy ehs_event_attachments_tenant on public.ehs_event_attachments
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));
create policy ehs_event_activity_tenant on public.ehs_event_activity
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));
create policy ehs_event_activity_insert on public.ehs_event_activity
  for insert with check (public.is_platform_admin() or public.is_org_member(organization_id));
create policy investigations_tenant on public.investigations
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));
create policy capa_items_tenant on public.capa_items
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));


-- >>> 20260326000007_seed_data.sql
-- EHS360 seed: permissions, system roles, features, plans, event types, severities

insert into public.permissions (code, module, action, description) values
  ('platform.admin', 'platform', 'admin', 'Full SaaS platform administration'),
  ('settings.manage', 'settings', 'manage', 'Manage organization settings'),
  ('users.manage', 'users', 'manage', 'Manage organization users and roles'),
  ('users.view', 'users', 'view', 'View organization users'),
  ('sites.manage', 'sites', 'manage', 'Manage sites and locations'),
  ('sites.view', 'sites', 'view', 'View sites'),
  ('billing.view', 'billing', 'view', 'View billing and subscription'),
  ('audit.view', 'audit', 'view', 'View audit trail'),
  ('dashboard.view', 'dashboard', 'view', 'View EHS dashboard'),
  ('incidents.create', 'incidents', 'create', 'Create incidents'),
  ('incidents.view', 'incidents', 'view', 'View incidents'),
  ('incidents.update', 'incidents', 'update', 'Update incidents'),
  ('incidents.investigate', 'incidents', 'investigate', 'Investigate incidents'),
  ('incidents.approve', 'incidents', 'approve', 'Approve/close incidents'),
  ('incidents.export', 'incidents', 'export', 'Export incidents'),
  ('near_miss.create', 'near_miss', 'create', 'Create near misses'),
  ('near_miss.view', 'near_miss', 'view', 'View near misses'),
  ('near_miss.update', 'near_miss', 'update', 'Update near misses'),
  ('hazards.create', 'hazards', 'create', 'Create hazards/UA/UC'),
  ('hazards.view', 'hazards', 'view', 'View hazards/UA/UC'),
  ('hazards.update', 'hazards', 'update', 'Update hazards/UA/UC'),
  ('capa.create', 'capa', 'create', 'Create CAPA items'),
  ('capa.view', 'capa', 'view', 'View CAPA items'),
  ('capa.update', 'capa', 'update', 'Update CAPA items'),
  ('capa.verify', 'capa', 'verify', 'Verify CAPA items'),
  ('reports.view', 'reports', 'view', 'View reports'),
  ('analytics.view', 'analytics', 'view', 'View analytics'),
  ('master_data.manage', 'master_data', 'manage', 'Manage master data')
on conflict (code) do nothing;

insert into public.roles (organization_id, code, name, description, is_system, is_default) values
  (null, 'super_admin', 'Super Admin', 'Platform super administrator', true, false),
  (null, 'tenant_admin', 'Tenant Admin', 'Organization owner/admin', true, false),
  (null, 'ehs_admin', 'EHS Admin', 'EHS configuration administrator', true, false),
  (null, 'ehs_manager', 'EHS Manager', 'EHS program manager', true, false),
  (null, 'ehs_officer', 'EHS Officer', 'Day-to-day EHS officer', true, false),
  (null, 'site_manager', 'Site Manager', 'Site operational owner', true, false),
  (null, 'department_head', 'Department Head', 'Department owner', true, false),
  (null, 'supervisor', 'Supervisor', 'First-line supervisor', true, false),
  (null, 'employee', 'Employee', 'Standard employee reporter', true, true),
  (null, 'contractor', 'Contractor', 'Contractor reporter', true, false),
  (null, 'auditor', 'Auditor', 'Internal/external auditor', true, false),
  (null, 'investigator', 'Investigator', 'Assigned investigator', true, false),
  (null, 'viewer', 'Viewer', 'Read-only viewer', true, false)
on conflict do nothing;

-- Map permissions to roles (system roles)
with role_map as (
  select r.id as role_id, r.code, p.id as permission_id, p.code as permission_code
  from public.roles r
  cross join public.permissions p
  where r.organization_id is null
)
insert into public.role_permissions (role_id, permission_id)
select role_id, permission_id from role_map
where
  (code = 'super_admin')
  or (code = 'tenant_admin' and permission_code <> 'platform.admin')
  or (code = 'ehs_admin' and permission_code in (
    'settings.manage','users.manage','users.view','sites.manage','sites.view','audit.view','dashboard.view',
    'incidents.create','incidents.view','incidents.update','incidents.investigate','incidents.approve','incidents.export',
    'near_miss.create','near_miss.view','near_miss.update','hazards.create','hazards.view','hazards.update',
    'capa.create','capa.view','capa.update','capa.verify','reports.view','analytics.view','master_data.manage','billing.view'
  ))
  or (code = 'ehs_manager' and permission_code in (
    'users.view','sites.view','audit.view','dashboard.view','billing.view',
    'incidents.create','incidents.view','incidents.update','incidents.investigate','incidents.approve','incidents.export',
    'near_miss.create','near_miss.view','near_miss.update','hazards.create','hazards.view','hazards.update',
    'capa.create','capa.view','capa.update','capa.verify','reports.view','analytics.view'
  ))
  or (code = 'ehs_officer' and permission_code in (
    'sites.view','dashboard.view',
    'incidents.create','incidents.view','incidents.update','incidents.investigate',
    'near_miss.create','near_miss.view','near_miss.update','hazards.create','hazards.view','hazards.update',
    'capa.create','capa.view','capa.update','reports.view'
  ))
  or (code = 'site_manager' and permission_code in (
    'sites.view','dashboard.view','incidents.view','incidents.approve','near_miss.view','hazards.view',
    'capa.view','capa.verify','reports.view'
  ))
  or (code = 'department_head' and permission_code in (
    'dashboard.view','incidents.view','near_miss.view','hazards.view','capa.view','capa.update'
  ))
  or (code = 'supervisor' and permission_code in (
    'dashboard.view','incidents.create','incidents.view','incidents.update',
    'near_miss.create','near_miss.view','hazards.create','hazards.view','capa.create','capa.view','capa.update'
  ))
  or (code = 'employee' and permission_code in (
    'dashboard.view','incidents.create','incidents.view','near_miss.create','near_miss.view','hazards.create','hazards.view','capa.view'
  ))
  or (code = 'contractor' and permission_code in (
    'incidents.create','incidents.view','near_miss.create','near_miss.view','hazards.create','hazards.view','capa.view'
  ))
  or (code = 'auditor' and permission_code in (
    'dashboard.view','incidents.view','near_miss.view','hazards.view','capa.view','audit.view','reports.view'
  ))
  or (code = 'investigator' and permission_code in (
    'incidents.view','incidents.update','incidents.investigate','capa.create','capa.view','capa.update'
  ))
  or (code = 'viewer' and permission_code in (
    'dashboard.view','incidents.view','near_miss.view','hazards.view','capa.view','reports.view'
  ))
on conflict do nothing;

insert into public.features (code, name, description, category, value_type) values
  ('incident_management', 'Incident Management', 'Incident reporting and investigation', 'module', 'boolean'),
  ('near_miss', 'Near Miss', 'Near miss reporting', 'module', 'boolean'),
  ('hazard_reporting', 'Hazard Reporting', 'Hazard / UA / UC reporting', 'module', 'boolean'),
  ('risk_assessment', 'Risk Assessment', 'Risk assessments', 'module', 'boolean'),
  ('jsa', 'JSA', 'Job Safety Analysis', 'module', 'boolean'),
  ('jha', 'JHA', 'Job Hazard Analysis', 'module', 'boolean'),
  ('permit_to_work', 'Permit to Work', 'PTW module', 'module', 'boolean'),
  ('inspections', 'Inspections', 'Inspection module', 'module', 'boolean'),
  ('audits', 'Audits', 'Audit module', 'module', 'boolean'),
  ('capa', 'CAPA', 'Corrective and preventive actions', 'module', 'boolean'),
  ('training', 'Training', 'Training and competency', 'module', 'boolean'),
  ('contractor_management', 'Contractor Management', 'Contractor safety', 'module', 'boolean'),
  ('ppe_management', 'PPE Management', 'PPE tracking', 'module', 'boolean'),
  ('chemical_sds', 'Chemical / SDS', 'Chemical register', 'module', 'boolean'),
  ('document_control', 'Document Control', 'Controlled documents', 'module', 'boolean'),
  ('moc', 'Management of Change', 'MOC module', 'module', 'boolean'),
  ('toolbox_talks', 'Toolbox Talks', 'Safety meetings', 'module', 'boolean'),
  ('advanced_reports', 'Advanced Reports', 'Advanced reporting', 'module', 'boolean'),
  ('scheduled_reports', 'Scheduled Reports', 'Scheduled report delivery', 'module', 'boolean'),
  ('api_access', 'API Access', 'Public API access', 'integration', 'boolean'),
  ('sso', 'SSO', 'SAML/OIDC SSO', 'integration', 'boolean'),
  ('hrms_integration', 'HRMS Integration', 'HRMS sync', 'integration', 'boolean'),
  ('whatsapp_notifications', 'WhatsApp Notifications', 'WhatsApp channel', 'integration', 'boolean'),
  ('sms_notifications', 'SMS Notifications', 'SMS channel', 'integration', 'boolean'),
  ('ai_copilot', 'AI Copilot', 'AI assistance', 'addon', 'boolean'),
  ('advanced_analytics', 'Advanced Analytics', 'Advanced analytics', 'module', 'boolean'),
  ('custom_branding', 'Custom Branding', 'Tenant branding', 'addon', 'boolean'),
  ('multi_business_unit', 'Multi Business Unit', 'Multiple BUs', 'module', 'boolean'),
  ('multi_site', 'Multi Site', 'Multiple sites', 'module', 'boolean'),
  ('custom_workflows', 'Custom Workflows', 'Configurable workflows', 'module', 'boolean'),
  ('max_users', 'Max Users', 'User seat limit', 'limit', 'numeric'),
  ('max_sites', 'Max Sites', 'Site limit', 'limit', 'numeric'),
  ('max_projects', 'Max Projects', 'Project limit', 'limit', 'numeric'),
  ('max_storage_mb', 'Max Storage (MB)', 'Storage limit', 'limit', 'numeric'),
  ('max_contractors', 'Max Contractors', 'Contractor limit', 'limit', 'numeric'),
  ('max_documents', 'Max Documents', 'Document limit', 'limit', 'numeric'),
  ('max_monthly_reports', 'Max Monthly Reports', 'Monthly report limit', 'limit', 'numeric'),
  ('max_api_calls', 'Max API Calls', 'API call limit', 'limit', 'numeric')
on conflict (code) do nothing;

insert into public.plans (code, name, description, is_active, is_public, is_custom, sort_order, trial_days, price_monthly_cents, price_yearly_cents) values
  ('free_trial', 'Free Trial', 'Trial access for evaluation', true, true, false, 10, 14, 0, 0),
  ('starter', 'Starter', 'Core EHS reporting for small teams', true, true, false, 20, 14, 9900, 99000),
  ('professional', 'Professional', 'Full EHS program for growing organizations', true, true, false, 30, 14, 24900, 249000),
  ('business', 'Business', 'Multi-site operations with advanced controls', true, true, false, 40, 14, 49900, 499000),
  ('enterprise', 'Enterprise', 'Enterprise scale with SSO and custom workflows', true, true, false, 50, 14, 0, 0),
  ('custom', 'Custom', 'Customer-specific commercial plan', true, false, true, 60, 30, 0, 0)
on conflict (code) do nothing;

-- Helper to attach plan features
create temporary table tmp_plan_feature_seed (
  plan_code text,
  feature_code text,
  enabled boolean,
  limit_value numeric,
  unlimited boolean
) on commit drop;

insert into tmp_plan_feature_seed (plan_code, feature_code, enabled, limit_value, unlimited) values
  -- free_trial core
  ('free_trial','incident_management',true,null,false),
  ('free_trial','near_miss',true,null,false),
  ('free_trial','hazard_reporting',true,null,false),
  ('free_trial','capa',true,null,false),
  ('free_trial','multi_site',true,null,false),
  ('free_trial','max_users',true,10,false),
  ('free_trial','max_sites',true,2,false),
  ('free_trial','max_projects',true,5,false),
  ('free_trial','max_storage_mb',true,1024,false),
  -- starter
  ('starter','incident_management',true,null,false),
  ('starter','near_miss',true,null,false),
  ('starter','hazard_reporting',true,null,false),
  ('starter','capa',true,null,false),
  ('starter','inspections',true,null,false),
  ('starter','toolbox_talks',true,null,false),
  ('starter','multi_site',true,null,false),
  ('starter','max_users',true,25,false),
  ('starter','max_sites',true,5,false),
  ('starter','max_projects',true,20,false),
  ('starter','max_storage_mb',true,5120,false),
  -- professional
  ('professional','incident_management',true,null,false),
  ('professional','near_miss',true,null,false),
  ('professional','hazard_reporting',true,null,false),
  ('professional','risk_assessment',true,null,false),
  ('professional','jsa',true,null,false),
  ('professional','jha',true,null,false),
  ('professional','permit_to_work',true,null,false),
  ('professional','inspections',true,null,false),
  ('professional','audits',true,null,false),
  ('professional','capa',true,null,false),
  ('professional','training',true,null,false),
  ('professional','contractor_management',true,null,false),
  ('professional','ppe_management',true,null,false),
  ('professional','document_control',true,null,false),
  ('professional','toolbox_talks',true,null,false),
  ('professional','advanced_reports',true,null,false),
  ('professional','advanced_analytics',true,null,false),
  ('professional','multi_site',true,null,false),
  ('professional','multi_business_unit',true,null,false),
  ('professional','max_users',true,100,false),
  ('professional','max_sites',true,25,false),
  ('professional','max_projects',true,100,false),
  ('professional','max_storage_mb',true,51200,false),
  -- business
  ('business','incident_management',true,null,false),
  ('business','near_miss',true,null,false),
  ('business','hazard_reporting',true,null,false),
  ('business','risk_assessment',true,null,false),
  ('business','jsa',true,null,false),
  ('business','jha',true,null,false),
  ('business','permit_to_work',true,null,false),
  ('business','inspections',true,null,false),
  ('business','audits',true,null,false),
  ('business','capa',true,null,false),
  ('business','training',true,null,false),
  ('business','contractor_management',true,null,false),
  ('business','ppe_management',true,null,false),
  ('business','chemical_sds',true,null,false),
  ('business','document_control',true,null,false),
  ('business','moc',true,null,false),
  ('business','toolbox_talks',true,null,false),
  ('business','advanced_reports',true,null,false),
  ('business','scheduled_reports',true,null,false),
  ('business','advanced_analytics',true,null,false),
  ('business','custom_branding',true,null,false),
  ('business','multi_site',true,null,false),
  ('business','multi_business_unit',true,null,false),
  ('business','custom_workflows',true,null,false),
  ('business','max_users',true,500,false),
  ('business','max_sites',true,100,false),
  ('business','max_projects',true,500,false),
  ('business','max_storage_mb',true,204800,false),
  -- enterprise unlimited-ish
  ('enterprise','incident_management',true,null,false),
  ('enterprise','near_miss',true,null,false),
  ('enterprise','hazard_reporting',true,null,false),
  ('enterprise','risk_assessment',true,null,false),
  ('enterprise','jsa',true,null,false),
  ('enterprise','jha',true,null,false),
  ('enterprise','permit_to_work',true,null,false),
  ('enterprise','inspections',true,null,false),
  ('enterprise','audits',true,null,false),
  ('enterprise','capa',true,null,false),
  ('enterprise','training',true,null,false),
  ('enterprise','contractor_management',true,null,false),
  ('enterprise','ppe_management',true,null,false),
  ('enterprise','chemical_sds',true,null,false),
  ('enterprise','document_control',true,null,false),
  ('enterprise','moc',true,null,false),
  ('enterprise','toolbox_talks',true,null,false),
  ('enterprise','advanced_reports',true,null,false),
  ('enterprise','scheduled_reports',true,null,false),
  ('enterprise','api_access',true,null,false),
  ('enterprise','sso',true,null,false),
  ('enterprise','hrms_integration',true,null,false),
  ('enterprise','ai_copilot',true,null,false),
  ('enterprise','advanced_analytics',true,null,false),
  ('enterprise','custom_branding',true,null,false),
  ('enterprise','multi_site',true,null,false),
  ('enterprise','multi_business_unit',true,null,false),
  ('enterprise','custom_workflows',true,null,false),
  ('enterprise','max_users',true,null,true),
  ('enterprise','max_sites',true,null,true),
  ('enterprise','max_projects',true,null,true),
  ('enterprise','max_storage_mb',true,null,true);

insert into public.plan_features (plan_id, feature_id, enabled, limit_value, unlimited)
select p.id, f.id, s.enabled, s.limit_value, s.unlimited
from tmp_plan_feature_seed s
join public.plans p on p.code = s.plan_code
join public.features f on f.code = s.feature_code
on conflict (plan_id, feature_id) do update
set enabled = excluded.enabled,
    limit_value = excluded.limit_value,
    unlimited = excluded.unlimited;

-- System event types
insert into public.event_types (organization_id, code, name, feature_code, description, is_system, sort_order) values
  (null, 'incident', 'Incident', 'incident_management', 'Injury/illness, property, environmental, security incidents', true, 10),
  (null, 'near_miss', 'Near Miss', 'near_miss', 'Near miss events with no harm', true, 20),
  (null, 'unsafe_act', 'Unsafe Act', 'hazard_reporting', 'Unsafe act observations', true, 30),
  (null, 'unsafe_condition', 'Unsafe Condition', 'hazard_reporting', 'Unsafe condition observations', true, 40),
  (null, 'hazard', 'Hazard', 'hazard_reporting', 'General hazard reports', true, 50)
on conflict do nothing;

insert into public.severity_levels (organization_id, code, name, rank, color, requires_investigation) values
  (null, 'low', 'Low', 1, '#90D7D7', false),
  (null, 'medium', 'Medium', 2, '#F5D671', false),
  (null, 'high', 'High', 3, '#E8A87C', true),
  (null, 'critical', 'Critical', 4, '#C38D9E', true)
on conflict do nothing;

insert into public.platform_settings (key, value, description) values
  ('billing', '{"provider":"manual","currency":"USD"}'::jsonb, 'Billing configuration placeholder'),
  ('support', '{"email":"support@ehs360.app"}'::jsonb, 'Support contact'),
  ('security', '{"mfa_recommended_roles":["tenant_admin","ehs_manager"]}'::jsonb, 'Security defaults')
on conflict (key) do nothing;


-- >>> 20260326000008_onboarding_bootstrap.sql
-- Bootstrap organization creation without RBAC chicken-and-egg

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
  values (v_org.id);

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


-- >>> 20260326000009_risk_assessments.sql
-- Phase 6: configurable risk assessment engine (Risk / JSA / JHA)

create table public.risk_assessment_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, code)
);

create unique index risk_assessment_types_system_code_uidx
  on public.risk_assessment_types (code)
  where organization_id is null;

create table public.risk_matrices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null default 'Default 5x5',
  likelihood_max integer not null default 5 check (likelihood_max between 2 and 10),
  consequence_max integer not null default 5 check (consequence_max between 2 and 10),
  -- bands: [{code,name,min_score,max_score,color}] — never hard-coded in app logic
  bands jsonb not null default '[
    {"code":"low","name":"Low","min_score":1,"max_score":4,"color":"#22c55e"},
    {"code":"medium","name":"Medium","min_score":5,"max_score":9,"color":"#eab308"},
    {"code":"high","name":"High","min_score":10,"max_score":14,"color":"#f97316"},
    {"code":"critical","name":"Critical","min_score":15,"max_score":25,"color":"#ef4444"}
  ]'::jsonb,
  likelihood_labels jsonb not null default '["Rare","Unlikely","Possible","Likely","Almost Certain"]'::jsonb,
  consequence_labels jsonb not null default '["Insignificant","Minor","Moderate","Major","Catastrophic"]'::jsonb,
  is_default boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.risk_assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  assessment_type_id uuid not null references public.risk_assessment_types (id),
  matrix_id uuid references public.risk_matrices (id),
  assessment_number text not null,
  title text not null,
  task_activity text,
  site_id uuid references public.sites (id),
  project_id uuid references public.projects (id),
  location_id uuid references public.locations (id),
  department_id uuid references public.departments (id),
  status text not null default 'draft'
    check (status in (
      'draft', 'team_assigned', 'in_progress', 'review', 'approval',
      'active', 'periodic_review', 'retired', 'cancelled'
    )),
  assessment_date date not null default (timezone('utc', now()))::date,
  next_review_date date,
  approved_by uuid references public.profiles (id),
  approved_at timestamptz,
  owner_id uuid references public.profiles (id),
  inherent_risk_score integer,
  inherent_risk_band text,
  residual_risk_score integer,
  residual_risk_band text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  deleted_at timestamptz,
  unique (organization_id, assessment_number)
);

create table public.risk_assessment_team (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  assessment_id uuid not null references public.risk_assessments (id) on delete cascade,
  user_id uuid references public.profiles (id),
  member_name text,
  role_label text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.risk_hazards (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  assessment_id uuid not null references public.risk_assessments (id) on delete cascade,
  hazard_description text not null,
  persons_at_risk text,
  sort_order integer not null default 0,
  inherent_likelihood integer check (inherent_likelihood between 1 and 10),
  inherent_consequence integer check (inherent_consequence between 1 and 10),
  inherent_score integer,
  inherent_band text,
  residual_likelihood integer check (residual_likelihood between 1 and 10),
  residual_consequence integer check (residual_consequence between 1 and 10),
  residual_score integer,
  residual_band text,
  owner_id uuid references public.profiles (id),
  target_date date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.risk_controls (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  hazard_id uuid not null references public.risk_hazards (id) on delete cascade,
  control_type text not null
    check (control_type in ('existing', 'additional')),
  hierarchy text not null
    check (hierarchy in ('elimination', 'substitution', 'engineering', 'administrative', 'ppe')),
  description text not null,
  owner_id uuid references public.profiles (id),
  target_date date,
  capa_id uuid references public.capa_items (id) on delete set null,
  is_implemented boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create index risk_assessments_org_status_idx on public.risk_assessments (organization_id, status);
create index risk_hazards_assessment_idx on public.risk_hazards (assessment_id);
create index risk_controls_hazard_idx on public.risk_controls (hazard_id);

insert into public.risk_assessment_types (organization_id, code, name, description, is_system)
values
  (null, 'risk_assessment', 'Risk Assessment', 'General task/area risk assessment', true),
  (null, 'jsa', 'Job Safety Analysis', 'Job safety analysis', true),
  (null, 'jha', 'Job Hazard Analysis', 'Job hazard analysis', true)
on conflict do nothing;

create or replace function public.resolve_risk_band(
  p_matrix_id uuid,
  p_score integer
)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_band text;
begin
  if p_score is null or p_matrix_id is null then
    return null;
  end if;
  select b->>'code' into v_band
  from public.risk_matrices m
  cross join lateral jsonb_array_elements(m.bands) b
  where m.id = p_matrix_id
    and p_score between (b->>'min_score')::int and (b->>'max_score')::int
  order by (b->>'min_score')::int
  limit 1;
  return v_band;
end;
$$;

create trigger risk_assessment_types_updated_at before update on public.risk_assessment_types
  for each row execute function public.set_updated_at();
create trigger risk_matrices_updated_at before update on public.risk_matrices
  for each row execute function public.set_updated_at();
create trigger risk_assessments_updated_at before update on public.risk_assessments
  for each row execute function public.set_updated_at();
create trigger risk_hazards_updated_at before update on public.risk_hazards
  for each row execute function public.set_updated_at();
create trigger risk_controls_updated_at before update on public.risk_controls
  for each row execute function public.set_updated_at();


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
-- RLS + permissions for phases 6–10

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

-- >>> 20260326000017_event_numbering_grants.sql
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
  if p_organization_id is null then
    raise exception 'organization required';
  end if;

  if not (public.is_platform_admin() or public.is_org_member(p_organization_id)) then
    raise exception 'not authorized to allocate event numbers';
  end if;

  insert into public.number_sequences (organization_id, sequence_key, prefix, current_value)
  values (p_organization_id, p_sequence_key, p_prefix, 1)
  on conflict (organization_id, sequence_key)
  do update set
    current_value = public.number_sequences.current_value + 1,
    updated_at = timezone('utc', now())
  returning current_value, pad_length into v_value, v_pad;

  return p_prefix || lpad(v_value::text, coalesce(v_pad, 5), '0');
end;
$$;

grant execute on function public.next_event_number(uuid, text, text) to authenticated;
grant execute on function public.next_event_number(uuid, text, text) to service_role;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.has_org_permission(uuid, text, uuid) to authenticated;


