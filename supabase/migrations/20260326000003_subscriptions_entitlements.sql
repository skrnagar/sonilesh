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
