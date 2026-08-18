# SaaS operations

Staff console is **`/admin`**, not `/platform` (`/platform` is a marketing redirect).

## Daily

- `/admin` KPIs, `/admin/support`, `/admin/audit`
- Suspended orgs cannot use `/app` (layout short-circuit)

## Subscriptions

Change plan, trial, discount, cancel-at-period-end from `/admin/subscriptions` / org detail. These write `subscriptions` and audit logs. They do **not** charge a PSP until a real `BillingProvider` exists.

## Entitlements

`/admin/entitlements` and org feature overrides. Additive limits. Temporary windows via `starts_at` / `ends_at`.

## Incidents

Do not set commercial status on EHS rows. If a tenant is past_due, entitlement grace (`BILLING_GRACE_DAYS`) applies at the subscription layer.

## Cron

Wire `POST /api/internal/compliance-tick` with `CRON_SECRET` when you enable a schedule. Until then, applicability ticks are manual.

## Readiness score

A dedicated `/platform` score page was **not** added (route is marketing). If needed, put a checklist widget on `/admin` later.
