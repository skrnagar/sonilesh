-- SaaS control plane: platform staff RBAC + commercial columns (additive)

alter table public.profiles
  add column if not exists platform_role text
    check (
      platform_role is null
      or platform_role in (
        'super_admin',
        'platform_admin',
        'billing_admin',
        'support_admin',
        'read_only'
      )
    );

update public.profiles
set platform_role = 'super_admin'
where is_platform_admin = true
  and platform_role is null;

alter table public.organizations
  add column if not exists company_size text;

alter table public.organizations drop constraint if exists organizations_status_check;
alter table public.organizations
  add constraint organizations_status_check
  check (status in ('pending', 'trial', 'active', 'suspended', 'cancelled', 'churned', 'archived'));

alter table public.organization_settings
  add column if not exists default_currency text not null default 'USD',
  add column if not exists notification_config jsonb not null default '{}'::jsonb,
  add column if not exists security_config jsonb not null default '{}'::jsonb;

alter table public.plans
  add column if not exists plan_type text not null default 'standard'
    check (plan_type in ('trial', 'standard', 'enterprise', 'custom'));

update public.plans set plan_type = 'trial' where code = 'free_trial' and plan_type = 'standard';
update public.plans set plan_type = 'enterprise' where code = 'enterprise' and plan_type = 'standard';
update public.plans set plan_type = 'custom' where is_custom = true;

alter table public.features
  add column if not exists catalog_group text not null default 'ehs'
    check (catalog_group in ('core', 'ehs', 'operations', 'analytics', 'integrations', 'enterprise', 'ai')),
  add column if not exists feature_type text not null default 'boolean'
    check (feature_type in ('boolean', 'limit', 'usage', 'tier', 'addon'));

update public.features set feature_type = 'limit' where value_type in ('numeric', 'unlimited');
update public.features set feature_type = 'addon' where category = 'addon';
update public.features set catalog_group = 'integrations' where category = 'integration';
update public.features set catalog_group = 'ai' where code like 'ai_%';
update public.features set catalog_group = 'enterprise' where code in ('sso', 'custom_branding', 'custom_workflows', 'api_access');
update public.features set catalog_group = 'analytics' where code in ('advanced_analytics', 'advanced_reports', 'scheduled_reports');
update public.features set catalog_group = 'core' where category = 'limit' or code in ('dashboard', 'multi_site', 'multi_project', 'multi_business_unit');
update public.features set catalog_group = 'operations' where code in (
  'training', 'contractor_management', 'ppe_management', 'chemical_sds',
  'document_control', 'moc', 'toolbox_talks', 'action_items', 'competency'
);

alter table public.plan_features
  add column if not exists configuration jsonb not null default '{}'::jsonb;

alter table public.subscriptions
  add column if not exists trial_start timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists base_price_cents integer,
  add column if not exists discount_cents integer not null default 0,
  add column if not exists final_price_cents integer,
  add column if not exists notes text;

alter table public.subscription_items
  add column if not exists amount_cents integer not null default 0,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.organization_feature_overrides
  add column if not exists override_type text not null default 'permanent'
    check (override_type in ('temporary', 'permanent', 'contract'));

update public.organization_feature_overrides
set override_type = 'temporary'
where is_temporary = true and override_type = 'permanent';

alter table public.usage_metrics
  add column if not exists metric_key text;

alter table public.usage_events
  add column if not exists metric_key text,
  add column if not exists reference_type text,
  add column if not exists reference_id uuid;

alter table public.billing_accounts
  add column if not exists provider text not null default 'manual',
  add column if not exists external_customer_id text,
  add column if not exists status text not null default 'active',
  add column if not exists metadata jsonb not null default '{}'::jsonb;

insert into public.features (code, name, description, category, value_type, catalog_group, feature_type) values
  ('dashboard', 'Dashboard', 'EHS operational dashboard', 'module', 'boolean', 'core', 'boolean'),
  ('unsafe_act', 'Unsafe Act', 'Unsafe act reporting entitlement', 'module', 'boolean', 'ehs', 'boolean'),
  ('unsafe_condition', 'Unsafe Condition', 'Unsafe condition reporting entitlement', 'module', 'boolean', 'ehs', 'boolean'),
  ('competency', 'Competency', 'Competency tracking entitlement', 'module', 'boolean', 'operations', 'boolean'),
  ('action_items', 'Action Items', 'Standalone action-item tracking entitlement', 'module', 'boolean', 'operations', 'boolean'),
  ('multi_project', 'Multi Project', 'Multiple projects per organization', 'module', 'boolean', 'core', 'boolean')
on conflict (code) do nothing;

-- Attach new boolean modules to professional+ by default (dashboard to all public plans)
insert into public.plan_features (plan_id, feature_id, enabled, limit_value, unlimited)
select p.id, f.id, true, null, false
from public.plans p
cross join public.features f
where f.code = 'dashboard'
  and p.code in ('free_trial', 'starter', 'professional', 'business', 'enterprise', 'custom')
on conflict (plan_id, feature_id) do update set enabled = true;

insert into public.plan_features (plan_id, feature_id, enabled, limit_value, unlimited)
select p.id, f.id, true, null, false
from public.plans p
cross join public.features f
where f.code in ('unsafe_act', 'unsafe_condition', 'action_items', 'competency', 'multi_project')
  and p.code in ('professional', 'business', 'enterprise', 'custom')
on conflict (plan_id, feature_id) do update set enabled = excluded.enabled;

insert into public.permissions (code, module, action, description) values
  ('saas.organizations.view', 'saas', 'view', 'View organizations in the control plane'),
  ('saas.organizations.create', 'saas', 'create', 'Create organizations'),
  ('saas.organizations.update', 'saas', 'update', 'Update organizations'),
  ('saas.organizations.suspend', 'saas', 'suspend', 'Suspend or reactivate organizations'),
  ('saas.subscriptions.view', 'saas', 'view', 'View subscriptions'),
  ('saas.subscriptions.manage', 'saas', 'manage', 'Create, change, or cancel subscriptions'),
  ('saas.plans.view', 'saas', 'view', 'View plans'),
  ('saas.plans.manage', 'saas', 'manage', 'Create, edit, or archive plans'),
  ('saas.features.view', 'saas', 'view', 'View feature catalog'),
  ('saas.features.manage', 'saas', 'manage', 'Create or update features'),
  ('saas.entitlements.view', 'saas', 'view', 'View entitlements'),
  ('saas.entitlements.override', 'saas', 'override', 'Create or remove feature overrides'),
  ('saas.usage.view', 'saas', 'view', 'View usage'),
  ('saas.billing.view', 'saas', 'view', 'View billing configuration'),
  ('saas.billing.manage', 'saas', 'manage', 'Manage billing configuration'),
  ('saas.audit.view', 'saas', 'view', 'View platform audit logs')
on conflict (code) do nothing;
