-- EHS360 chunk 1 — paste into SQL Editor and Run
-- Project: sqybbygfksnjvmatiafm

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

