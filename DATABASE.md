# Database

Migrations: `supabase/migrations/` (apply in timestamp order). Combined file: `supabase/_all_migrations.sql` plus later numbered files.

## Foundation

Tenancy: `organizations`, `organization_settings`, `organization_members`, `profiles`

RBAC: `roles`, `permissions`, `role_permissions`, `member_roles`

Structure: `business_units`, `sites`, `projects`, `departments`, `locations`

Commercial: `plans`, `features`, `plan_features`, `subscriptions`, `subscription_items`, `organization_feature_overrides`, `usage_metrics`

Audit & comms: `audit_logs`, `notifications`, `notification_preferences`

Files: `attachments` (generic) plus module-specific attachment tables

## Rules

- Tenant-owned tables include `organization_id`.
- RLS enabled with policies (not merely `ENABLE ROW LEVEL SECURITY`).
- Prefer `created_at` / `updated_at` / `created_by` / `updated_by` / `deleted_at` on operational tables.

Seed (dev): `20260326000007_seed_data.sql` — system roles, permissions, plans, event types.

Schema narrative: `docs/DATABASE_ARCHITECTURE.md`.
