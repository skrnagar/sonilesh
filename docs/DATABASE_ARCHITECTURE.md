# Database Architecture

## Conventions

- Primary keys: `uuid` (`gen_random_uuid()`)
- Tenant column: `organization_id uuid not null references organizations(id)`
- Audit columns: `created_at`, `updated_at`, `created_by`, `updated_by`
- Soft delete: `deleted_at timestamptz null`
- Master data: `is_active boolean default true` (no hard delete)
- All timestamps stored in UTC

## Foundation domains

### Identity & tenancy
`profiles`, `organizations`, `organization_settings`, `organization_members`

### RBAC
`permissions`, `roles`, `role_permissions`, `member_roles`

### Org structure
`business_units`, `sites`, `projects`, `departments`, `locations`

### Subscriptions
`features`, `plans`, `plan_features`, `subscriptions`, `subscription_items`,
`organization_feature_overrides`, `usage_metrics`, `usage_events`,
`billing_accounts`, `invoices`, `subscription_events`

### Platform admin
`platform_settings`, `support_tickets`, `audit_logs` (global + tenant)

### EHS reporting (Phase 5)
`event_types`, `event_categories`, `severity_levels`, `ehs_events`,
`ehs_event_people`, `ehs_event_witnesses`, `ehs_event_injuries`,
`ehs_event_comments`, `ehs_event_attachments`, `ehs_event_activity`,
`investigations`, `capa_items`, `number_sequences`

## Isolation

Every organization-owned table has RLS policies that resolve membership via `organization_members` and optional site scope via `member_roles.site_id`.

Platform Super Admin access uses a `profiles.is_platform_admin` flag checked in RLS helpers — never bypasses audit logging for admin mutations.
