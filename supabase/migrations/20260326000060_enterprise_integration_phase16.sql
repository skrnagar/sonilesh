-- Phase 16: Enterprise Integration Hub + API platform + scale
-- Tenant isolation (organization_id + RLS) on all org-scoped tables.
-- Credentials are secret-ref / encrypted payload — never plaintext in app responses.
-- Vendor adapters are catalog metadata; live vendor SDKs are not claimed production-ready.

-- ---------------------------------------------------------------------------
-- Features (copy grants from related existing features — no plan-name hardcoding)
-- ---------------------------------------------------------------------------
insert into public.features (code, name, description, category, value_type)
values
  ('integrations', 'Integrations', 'Enterprise integration hub and connectors', 'integration', 'boolean'),
  ('public_api', 'Public API', 'Organization public REST API (/api/v1)', 'integration', 'boolean'),
  ('enterprise_search', 'Enterprise Search', 'Unified org-scoped search', 'module', 'boolean'),
  ('marketplace', 'Marketplace', 'Templates, connectors, and apps catalog (no payments)', 'addon', 'boolean')
on conflict (code) do nothing;

insert into public.plan_features (plan_id, feature_id, enabled, limit_value, unlimited)
select pf.plan_id, nf.id, pf.enabled, pf.limit_value, pf.unlimited
from public.plan_features pf
join public.features ofeat on ofeat.id = pf.feature_id and ofeat.code = 'hrms_integration'
join public.features nf on nf.code = 'integrations'
on conflict (plan_id, feature_id) do update set enabled = excluded.enabled;

insert into public.plan_features (plan_id, feature_id, enabled, limit_value, unlimited)
select pf.plan_id, nf.id, pf.enabled, pf.limit_value, pf.unlimited
from public.plan_features pf
join public.features ofeat on ofeat.id = pf.feature_id and ofeat.code = 'api_access'
join public.features nf on nf.code = 'public_api'
on conflict (plan_id, feature_id) do update set enabled = excluded.enabled;

insert into public.plan_features (plan_id, feature_id, enabled, limit_value, unlimited)
select pf.plan_id, nf.id, pf.enabled, pf.limit_value, pf.unlimited
from public.plan_features pf
join public.features ofeat on ofeat.id = pf.feature_id and ofeat.code = 'advanced_analytics'
join public.features nf on nf.code = 'enterprise_search'
on conflict (plan_id, feature_id) do update set enabled = excluded.enabled;

insert into public.plan_features (plan_id, feature_id, enabled, limit_value, unlimited)
select pf.plan_id, nf.id, pf.enabled, pf.limit_value, pf.unlimited
from public.plan_features pf
join public.features ofeat on ofeat.id = pf.feature_id and ofeat.code = 'custom_workflows'
join public.features nf on nf.code = 'marketplace'
on conflict (plan_id, feature_id) do update set enabled = excluded.enabled;

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
insert into public.permissions (code, module, action, description) values
  ('integrations.view', 'integrations', 'view', 'View integration hub and sync status'),
  ('integrations.manage', 'integrations', 'manage', 'Connect, map, and run integrations'),
  ('api.manage', 'api', 'manage', 'Create and revoke organization API keys'),
  ('webhooks.manage', 'webhooks', 'manage', 'Configure outbound webhooks'),
  ('import.manage', 'import', 'manage', 'Run bulk CSV imports'),
  ('search.use', 'search', 'use', 'Use enterprise search'),
  ('marketplace.view', 'marketplace', 'view', 'Browse marketplace catalog'),
  ('marketplace.install', 'marketplace', 'install', 'Install marketplace templates (no payment)')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.organization_id is null
  and p.code in ('integrations.view', 'search.use', 'marketplace.view')
  and r.code in (
    'super_admin', 'tenant_admin', 'ehs_admin', 'ehs_manager', 'ehs_officer',
    'site_manager', 'auditor', 'department_head', 'viewer'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.organization_id is null
  and p.code in (
    'integrations.manage', 'api.manage', 'webhooks.manage',
    'import.manage', 'marketplace.install'
  )
  and r.code in ('super_admin', 'tenant_admin', 'ehs_admin')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Multi-country: extend existing org/site model (do not duplicate legal engine)
-- ---------------------------------------------------------------------------
alter table public.sites
  add column if not exists locale text,
  add column if not exists currency text,
  add column if not exists jurisdiction_id uuid references public.jurisdictions (id) on delete set null;

alter table public.organization_settings
  add column if not exists default_jurisdiction_id uuid references public.jurisdictions (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Integration catalog + connections
-- ---------------------------------------------------------------------------
create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  code text not null,
  name text not null,
  category text not null
    check (category in (
      'hrms', 'idp', 'erp', 'iot', 'dms', 'notify', 'calendar', 'csv', 'other'
    )),
  maturity text not null default 'sandbox'
    check (maturity in ('real', 'sandbox', 'architecture')),
  description text,
  capabilities jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists integrations_platform_code_uidx
  on public.integrations (code)
  where organization_id is null;

create unique index if not exists integrations_org_code_uidx
  on public.integrations (organization_id, code)
  where organization_id is not null;

create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  integration_id uuid not null references public.integrations (id) on delete restrict,
  name text not null,
  status text not null default 'needs_attention'
    check (status in ('available', 'connected', 'needs_attention', 'failed', 'disabled')),
  sync_mode text not null default 'manual'
    check (sync_mode in ('full', 'incremental', 'manual', 'scheduled')),
  schedule_cron text,
  cursor jsonb not null default '{}'::jsonb,
  last_sync_at timestamptz,
  last_error text,
  records_synced integer not null default 0,
  error_count integer not null default 0,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  deleted_at timestamptz
);

create index if not exists integration_connections_org_status_idx
  on public.integration_connections (organization_id, status)
  where deleted_at is null;

create table if not exists public.integration_credentials (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  connection_id uuid not null references public.integration_connections (id) on delete cascade,
  kind text not null default 'secret_ref',
  secret_ref text not null,
  encrypted_payload text,
  key_version integer not null default 1,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  unique (connection_id)
);

create table if not exists public.integration_mappings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  connection_id uuid not null references public.integration_connections (id) on delete cascade,
  entity_type text not null
    check (entity_type in ('employee', 'department', 'location', 'project', 'other')),
  external_field text not null,
  internal_entity text not null
    check (internal_entity in ('worker', 'department', 'site', 'project', 'member', 'other')),
  internal_field text not null,
  transform jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (connection_id, entity_type, external_field)
);

create table if not exists public.integration_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  connection_id uuid not null references public.integration_connections (id) on delete cascade,
  mode text not null
    check (mode in ('full', 'incremental', 'manual', 'scheduled')),
  status text not null default 'queued'
    check (status in ('queued', 'running', 'completed', 'failed', 'cancelled')),
  cursor_start jsonb not null default '{}'::jsonb,
  cursor_end jsonb not null default '{}'::jsonb,
  records_in integer not null default 0,
  records_written integer not null default 0,
  records_deduped integer not null default 0,
  records_failed integer not null default 0,
  started_at timestamptz,
  finished_at timestamptz,
  error text,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id)
);

create index if not exists integration_sync_jobs_org_status_idx
  on public.integration_sync_jobs (organization_id, status, created_at desc);

create table if not exists public.integration_sync_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  connection_id uuid not null references public.integration_connections (id) on delete cascade,
  job_id uuid references public.integration_sync_jobs (id) on delete set null,
  external_system text not null,
  external_id text not null,
  entity_type text not null,
  internal_id uuid,
  payload_hash text,
  status text not null default 'pending'
    check (status in ('pending', 'written', 'deduped', 'failed', 'skipped')),
  error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists integration_sync_records_dedup_uidx
  on public.integration_sync_records (organization_id, external_system, external_id);

create table if not exists public.integration_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  connection_id uuid references public.integration_connections (id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id)
);

create index if not exists integration_events_org_created_idx
  on public.integration_events (organization_id, created_at desc);

create table if not exists public.integration_webhooks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  target_url text not null,
  secret_ref text not null,
  encrypted_secret text,
  event_types text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  deleted_at timestamptz
);

create table if not exists public.integration_webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  webhook_id uuid not null references public.integration_webhooks (id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  idempotency_key text not null,
  status text not null default 'pending'
    check (status in ('pending', 'delivered', 'retrying', 'failed', 'rejected')),
  attempt_count integer not null default 0,
  next_attempt_at timestamptz,
  last_status_code integer,
  last_error text,
  delivered_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists integration_webhook_deliveries_idem_uidx
  on public.integration_webhook_deliveries (organization_id, webhook_id, idempotency_key);

create table if not exists public.integration_errors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  connection_id uuid references public.integration_connections (id) on delete set null,
  job_id uuid references public.integration_sync_jobs (id) on delete set null,
  code text not null,
  message text not null,
  payload jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists integration_errors_org_open_idx
  on public.integration_errors (organization_id, created_at desc)
  where resolved_at is null;

create table if not exists public.integration_inbound_receipts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  external_system text not null,
  external_id text not null,
  signature_ok boolean not null default false,
  received_at timestamptz not null default timezone('utc', now()),
  payload jsonb not null default '{}'::jsonb
);

create unique index if not exists integration_inbound_receipts_dedup_uidx
  on public.integration_inbound_receipts (organization_id, external_system, external_id);

-- ---------------------------------------------------------------------------
-- Public API keys (hashed) + idempotency
-- ---------------------------------------------------------------------------
create table if not exists public.organization_api_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null,
  scopes text[] not null default '{}',
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id)
);

create unique index if not exists organization_api_keys_hash_uidx
  on public.organization_api_keys (key_hash);

create table if not exists public.api_idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  key text not null,
  method text not null,
  path text not null,
  response_status integer,
  response_body jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, key)
);

-- ---------------------------------------------------------------------------
-- Async CSV import
-- ---------------------------------------------------------------------------
create table if not exists public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  entity_type text not null
    check (entity_type in (
      'users', 'workers', 'sites', 'projects', 'contractors', 'training', 'certificates'
    )),
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  filename text,
  row_count integer not null default 0,
  success_count integer not null default 0,
  error_count integer not null default 0,
  error_summary text,
  created_at timestamptz not null default timezone('utc', now()),
  started_at timestamptz,
  finished_at timestamptz,
  created_by uuid references public.profiles (id)
);

create table if not exists public.import_job_rows (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  job_id uuid not null references public.import_jobs (id) on delete cascade,
  row_number integer not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued'
    check (status in ('queued', 'written', 'skipped', 'failed')),
  error text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists import_job_rows_job_status_idx
  on public.import_job_rows (job_id, status);

-- ---------------------------------------------------------------------------
-- Marketplace catalog (metadata only — no payments)
-- ---------------------------------------------------------------------------
create table if not exists public.marketplace_catalog_items (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  kind text not null check (kind in ('template', 'connector', 'app')),
  name text not null,
  description text,
  feature_code text,
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_installs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  catalog_item_id uuid not null references public.marketplace_catalog_items (id) on delete restrict,
  status text not null default 'installed'
    check (status in ('installed', 'disabled')),
  installed_at timestamptz not null default timezone('utc', now()),
  installed_by uuid references public.profiles (id),
  unique (organization_id, catalog_item_id)
);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
drop trigger if exists integrations_updated_at on public.integrations;
create trigger integrations_updated_at before update on public.integrations
  for each row execute function public.set_updated_at();
drop trigger if exists integration_connections_updated_at on public.integration_connections;
create trigger integration_connections_updated_at before update on public.integration_connections
  for each row execute function public.set_updated_at();
drop trigger if exists integration_credentials_updated_at on public.integration_credentials;
create trigger integration_credentials_updated_at before update on public.integration_credentials
  for each row execute function public.set_updated_at();
drop trigger if exists integration_mappings_updated_at on public.integration_mappings;
create trigger integration_mappings_updated_at before update on public.integration_mappings
  for each row execute function public.set_updated_at();
drop trigger if exists integration_sync_records_updated_at on public.integration_sync_records;
create trigger integration_sync_records_updated_at before update on public.integration_sync_records
  for each row execute function public.set_updated_at();
drop trigger if exists integration_webhooks_updated_at on public.integration_webhooks;
create trigger integration_webhooks_updated_at before update on public.integration_webhooks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.integrations enable row level security;
alter table public.integration_connections enable row level security;
alter table public.integration_credentials enable row level security;
alter table public.integration_mappings enable row level security;
alter table public.integration_sync_jobs enable row level security;
alter table public.integration_sync_records enable row level security;
alter table public.integration_events enable row level security;
alter table public.integration_webhooks enable row level security;
alter table public.integration_webhook_deliveries enable row level security;
alter table public.integration_errors enable row level security;
alter table public.integration_inbound_receipts enable row level security;
alter table public.organization_api_keys enable row level security;
alter table public.api_idempotency_keys enable row level security;
alter table public.import_jobs enable row level security;
alter table public.import_job_rows enable row level security;
alter table public.marketplace_catalog_items enable row level security;
alter table public.marketplace_installs enable row level security;

drop policy if exists integrations_select on public.integrations;
create policy integrations_select on public.integrations
  for select using (
    organization_id is null
    or public.is_platform_admin()
    or public.is_org_member(organization_id)
  );

drop policy if exists integrations_write on public.integrations;
create policy integrations_write on public.integrations
  for all using (
    public.is_platform_admin()
    or (organization_id is not null and public.has_org_permission(organization_id, 'integrations.manage'))
  )
  with check (
    public.is_platform_admin()
    or (organization_id is not null and public.has_org_permission(organization_id, 'integrations.manage'))
  );

drop policy if exists integration_connections_select on public.integration_connections;
create policy integration_connections_select on public.integration_connections
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));
drop policy if exists integration_connections_write on public.integration_connections;
create policy integration_connections_write on public.integration_connections
  for all using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'integrations.manage')
  )
  with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'integrations.manage')
  );

drop policy if exists integration_credentials_select on public.integration_credentials;
create policy integration_credentials_select on public.integration_credentials
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));
drop policy if exists integration_credentials_write on public.integration_credentials;
create policy integration_credentials_write on public.integration_credentials
  for all using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'integrations.manage')
  )
  with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'integrations.manage')
  );

drop policy if exists integration_mappings_select on public.integration_mappings;
create policy integration_mappings_select on public.integration_mappings
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));
drop policy if exists integration_mappings_write on public.integration_mappings;
create policy integration_mappings_write on public.integration_mappings
  for all using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'integrations.manage')
  )
  with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'integrations.manage')
  );

drop policy if exists integration_sync_jobs_select on public.integration_sync_jobs;
create policy integration_sync_jobs_select on public.integration_sync_jobs
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));
drop policy if exists integration_sync_jobs_write on public.integration_sync_jobs;
create policy integration_sync_jobs_write on public.integration_sync_jobs
  for all using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'integrations.manage')
  )
  with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'integrations.manage')
  );

drop policy if exists integration_sync_records_select on public.integration_sync_records;
create policy integration_sync_records_select on public.integration_sync_records
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));
drop policy if exists integration_sync_records_write on public.integration_sync_records;
create policy integration_sync_records_write on public.integration_sync_records
  for all using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'integrations.manage')
  )
  with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'integrations.manage')
  );

drop policy if exists integration_events_select on public.integration_events;
create policy integration_events_select on public.integration_events
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));
drop policy if exists integration_events_write on public.integration_events;
create policy integration_events_write on public.integration_events
  for all using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'integrations.manage')
  )
  with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'integrations.manage')
  );

drop policy if exists integration_webhooks_select on public.integration_webhooks;
create policy integration_webhooks_select on public.integration_webhooks
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));
drop policy if exists integration_webhooks_write on public.integration_webhooks;
create policy integration_webhooks_write on public.integration_webhooks
  for all using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'webhooks.manage')
  )
  with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'webhooks.manage')
  );

drop policy if exists integration_webhook_deliveries_select on public.integration_webhook_deliveries;
create policy integration_webhook_deliveries_select on public.integration_webhook_deliveries
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));
drop policy if exists integration_webhook_deliveries_write on public.integration_webhook_deliveries;
create policy integration_webhook_deliveries_write on public.integration_webhook_deliveries
  for all using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'webhooks.manage')
  )
  with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'webhooks.manage')
  );

drop policy if exists integration_errors_select on public.integration_errors;
create policy integration_errors_select on public.integration_errors
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));
drop policy if exists integration_errors_write on public.integration_errors;
create policy integration_errors_write on public.integration_errors
  for all using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'integrations.manage')
  )
  with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'integrations.manage')
  );

drop policy if exists integration_inbound_receipts_select on public.integration_inbound_receipts;
create policy integration_inbound_receipts_select on public.integration_inbound_receipts
  for select using (public.is_platform_admin() or public.has_org_permission(organization_id, 'integrations.manage'));
drop policy if exists integration_inbound_receipts_write on public.integration_inbound_receipts;
create policy integration_inbound_receipts_write on public.integration_inbound_receipts
  for all using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'integrations.manage')
  )
  with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'integrations.manage')
  );

drop policy if exists organization_api_keys_select on public.organization_api_keys;
create policy organization_api_keys_select on public.organization_api_keys
  for select using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'api.manage')
  );
drop policy if exists organization_api_keys_write on public.organization_api_keys;
create policy organization_api_keys_write on public.organization_api_keys
  for all using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'api.manage')
  )
  with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'api.manage')
  );

drop policy if exists api_idempotency_keys_select on public.api_idempotency_keys;
create policy api_idempotency_keys_select on public.api_idempotency_keys
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));
drop policy if exists api_idempotency_keys_write on public.api_idempotency_keys;
create policy api_idempotency_keys_write on public.api_idempotency_keys
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));

drop policy if exists import_jobs_select on public.import_jobs;
create policy import_jobs_select on public.import_jobs
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));
drop policy if exists import_jobs_write on public.import_jobs;
create policy import_jobs_write on public.import_jobs
  for all using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'import.manage')
  )
  with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'import.manage')
  );

drop policy if exists import_job_rows_select on public.import_job_rows;
create policy import_job_rows_select on public.import_job_rows
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));
drop policy if exists import_job_rows_write on public.import_job_rows;
create policy import_job_rows_write on public.import_job_rows
  for all using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'import.manage')
  )
  with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'import.manage')
  );

drop policy if exists marketplace_catalog_select on public.marketplace_catalog_items;
create policy marketplace_catalog_select on public.marketplace_catalog_items
  for select using (is_active or public.is_platform_admin());

drop policy if exists marketplace_installs_select on public.marketplace_installs;
create policy marketplace_installs_select on public.marketplace_installs
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));
drop policy if exists marketplace_installs_write on public.marketplace_installs;
create policy marketplace_installs_write on public.marketplace_installs
  for all using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'marketplace.install')
  )
  with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'marketplace.install')
  );

-- Never expose ciphertext / key hashes to PostgREST clients
revoke select (encrypted_payload) on public.integration_credentials from anon, authenticated;
revoke select (encrypted_secret) on public.integration_webhooks from anon, authenticated;
revoke select (key_hash) on public.organization_api_keys from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Catalog seed (architecture / sandbox — not production vendor certifications)
-- ---------------------------------------------------------------------------
insert into public.integrations (organization_id, code, name, category, maturity, description, capabilities)
values
  (null, 'csv_manual', 'CSV / manual import', 'csv', 'real',
   'First-party CSV and mapping pipeline. No external vendor SDK.',
   '["full","incremental","manual","mapping"]'::jsonb),
  (null, 'hrms_workday', 'Workday HRMS', 'hrms', 'sandbox',
   'SANDBOX adapter only — not tested against a live Workday tenant.',
   '["employees","departments"]'::jsonb),
  (null, 'hrms_successfactors', 'SAP SuccessFactors', 'hrms', 'sandbox',
   'SANDBOX adapter only — not tested against a live SuccessFactors tenant.',
   '["employees","departments"]'::jsonb),
  (null, 'hrms_bamboohr', 'BambooHR', 'hrms', 'sandbox',
   'SANDBOX adapter only — not tested against a live BambooHR account.',
   '["employees"]'::jsonb),
  (null, 'idp_oidc', 'OIDC / SAML identity', 'idp', 'architecture',
   'Architecture stub for SSO/IdP. Use existing auth; do not treat as a certified IdP.',
   '["sso"]'::jsonb),
  (null, 'erp_sap', 'SAP ERP', 'erp', 'sandbox',
   'SANDBOX adapter only — not tested against a live SAP system.',
   '["projects","locations"]'::jsonb),
  (null, 'iot_meters', 'IoT / meters', 'iot', 'architecture',
   'Architecture stub. Does not emit live or simulated meter readings.',
   '["telemetry_contract"]'::jsonb),
  (null, 'dms_sharepoint', 'SharePoint / DMS', 'dms', 'sandbox',
   'SANDBOX adapter only — not tested against a live SharePoint tenant.',
   '["documents"]'::jsonb),
  (null, 'notify_slack', 'Slack notifications', 'notify', 'sandbox',
   'SANDBOX adapter only — not tested against a live Slack workspace.',
   '["notify"]'::jsonb),
  (null, 'notify_teams', 'Microsoft Teams', 'notify', 'sandbox',
   'SANDBOX adapter only — not tested against a live Teams tenant.',
   '["notify"]'::jsonb),
  (null, 'calendar_google', 'Google Calendar', 'calendar', 'sandbox',
   'SANDBOX adapter only — not tested against Google Calendar.',
   '["events"]'::jsonb)
on conflict do nothing;

insert into public.marketplace_catalog_items (code, kind, name, description, feature_code, metadata)
values
  ('tpl_incident_investigation', 'template', 'Incident investigation pack',
   'Checklist and terminology template for investigations. No payment.',
   'incident_management', '{"attaches":"template"}'::jsonb),
  ('tpl_capa_workflow', 'template', 'CAPA workflow starter',
   'Default CAPA stages as metadata. Does not replace the CAPA engine.',
   'capa', '{"attaches":"template"}'::jsonb),
  ('conn_csv_manual', 'connector', 'CSV connector',
   'Installs the first-party CSV connector into the integration hub.',
   'integrations', '{"connector_code":"csv_manual"}'::jsonb),
  ('app_search_saved_views', 'app', 'Saved search views',
   'Architecture metadata for saved enterprise search views.',
   'enterprise_search', '{"attaches":"app"}'::jsonb)
on conflict (code) do nothing;
