# Self-hosting SONIL EHS360

This product keeps **Supabase** (Auth, Postgres, Storage, RLS) in self-hosted mode. We do **not** replace Auth with a custom user table. Point the Next.js app at either:

1. The [official supabase/docker](https://github.com/supabase/supabase/tree/master/docker) stack, or
2. An existing self-hosted Supabase project.

`DEPLOYMENT_MODE=self_hosted` then:

- Hides in-app Razorpay checkout (`/app/settings/billing` shows a license message).
- Intersects `hasFeature()` with `SELF_HOST_FEATURE_CODES` (comma-separated module codes) so the same entitlement function gates cloud and self-host.
- Expects a **single organization**. Create it once (onboarding or SQL); do not use the SaaS tenant switcher.

SaaS admin tenant screens remain available to `is_platform_admin` for that one company.

## Prerequisites

- Docker + Docker Compose
- A running Supabase stack (or cloud project you accept for that customer)
- SMTP credentials for Auth emails (`GOTRUE_SMTP_*` in the Supabase docker `.env`)

## Environment

Copy `.env.selfhost.example` to `.env.selfhost`:

```
DEPLOYMENT_MODE=self_hosted
NEXT_PUBLIC_APP_URL=https://ehs.example.com
NEXT_PUBLIC_SUPABASE_URL=http://kong:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SELF_HOST_FEATURE_CODES=incident_management,near_miss,hazard_reporting,capa,permit_to_work,inspections,training
BILLING_GRACE_DAYS=3
```

License: issue a comma-separated feature list (or wrap it in your own signed token and expand it at boot). Do not invent a second gating function — `hasFeature` / `requireFeature` already enforce it.

## App containers

```bash
docker compose up -d --build
```

The `app` service serves Next.js. `caddy` terminates HTTP on port 80 (edit `deploy/Caddyfile` for TLS). `worker` polls overdue CAPA without Edge Functions.

## Migrations

Against the Supabase Postgres (not the optional scratch `db`):

```bash
psql "$DATABASE_URL" -f supabase/_all_migrations.sql
psql "$DATABASE_URL" -f supabase/migrations/20260326000018_reporting_notifications_selfhost.sql
```

Or `node scripts/apply-migrations.mjs` if that script is configured for the instance.

## SMTP

Configure GoTrue SMTP in the Supabase docker env so password reset and invites work. Application notifications currently write `in_app_notifications` + `audit_logs`; wire SMTP from a later worker if you need email.

## Backup

```cron
0 2 * * * pg_dump "$DATABASE_URL" | gzip > /backups/ehs-$(date +\%F).sql.gz
```

Keep Storage bucket dumps (`ehs-attachments`) on the same cadence.
