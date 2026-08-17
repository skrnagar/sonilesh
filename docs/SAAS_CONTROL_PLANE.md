# EHS360 SaaS control plane

This document describes the commercial control plane: organizations, plans, subscriptions, feature entitlements, usage, platform RBAC, RLS, billing abstraction, and customer overrides.

Incident Management, Risk Management, and Permit to Work **modules are not implemented in this phase**. Feature keys for those modules exist in the catalog so they can be entitled without shipping the workflows.

## Architecture

```
SaaS Platform
  → Organizations
    → Subscription
      → Plan
        → Plan features
          → Entitlement engine
            → Organization feature overrides
              → Effective entitlements
                → Customer application
```

Layers:

1. SaaS platform (`/admin`) — staff console, distinct from the customer EHS app
2. Organization / tenant
3. Subscription
4. Plan (database catalog — never hard-coded names in entitlement logic)
5. Feature catalog
6. Entitlement engine
7. Usage engine (live counts where possible)
8. Customer overrides
9. Billing configuration (`BillingProvider`, no live checkout)
10. Audit trail

## Database

Migrations: `supabase/migrations/20260326000002_foundation_tenancy_rbac.sql`, `...00003_subscriptions_entitlements.sql`, `...00004_platform_admin_audit.sql`, `...00007_seed_data.sql`, `...00021_saas_control_plane.sql`, `...00022_saas_billing_interval_custom.sql`.

Core tables:

| Table | Role |
| --- | --- |
| `organizations` | Tenant company (`trial`, `active`, `suspended`, `cancelled`, `archived`, plus legacy `pending` / `churned`) |
| `organization_settings` | Timezone, currency, branding, notification and security JSON |
| `plans` | Commercial SKUs (`plan_type`: trial / standard / enterprise / custom) |
| `features` | Capability catalog (`key` = `code`, immutable after insert) |
| `plan_features` | Plan × feature matrix (`enabled`, `limit_value`, `configuration` JSONB) |
| `subscriptions` | Org ↔ plan, prices, trial, billing interval (`monthly` / `yearly` / `custom`) |
| `subscription_items` | Add-ons / future usage lines |
| `organization_feature_overrides` | Per-customer enablement, additive limits, temporary windows |
| `usage_metrics` / `usage_events` | Metering and future usage-based billing |
| `billing_accounts` | Provider-agnostic customer ids |
| `audit_logs` | SaaS administration events |

## Tenant model

- Every tenant row is an `organizations` record with a unique `slug`.
- Customer users attach via `organization_members`.
- Customer queries must be scoped to the **authenticated membership**, not an `organization_id` taken from the URL.
- Helper: `authorizeOrganizationAccess()` / `canAccessOrganization()` in `src/lib/auth/access.ts`.
- Platform staff may access tenants according to `profiles.platform_role`; they still use server session, not client-side filtering.

Organization A must never read or write Organization B subscriptions, features, usage, billing, or users. PostgreSQL RLS on tenant tables enforces `organization_id` from JWT/membership. Frontend tables are not a security boundary.

## Subscription model

An organization has at most one non-deleted subscription in `trialing | active | past_due | paused`.

Fields include plan, status, trial window, period, `billing_interval`, `base_price_cents`, `discount_cents`, `final_price_cents`, custom prices, notes.

Actions (audited): change plan, extend trial, apply discount, cancel at period end, suspend organization.

Payment capture is **not** implemented. `src/lib/billing/provider.ts` defines `BillingProvider` (`createCustomer`, `createSubscription`, `updateSubscription`, `cancelSubscription`, `createInvoice`, `getCustomer`, `getSubscription`). `ManualBillingProvider` is the current adapter. Stripe/Razorpay must implement the same interface and must not leak into domain services.

## Feature model

`features.code` is the stable key (`incident_management`, `risk_assessment`, `permit_to_work`, `ai_copilot`, `max_users`, …).

`feature_type`: boolean | limit | usage | tier | addon.

`catalog_group`: core | ehs | operations | analytics | integrations | enterprise | ai.

Creating a feature does not implement the EHS module. The matrix at `/admin/entitlements` writes `plan_features`.

## Entitlement calculation

```
Effective = base plan features
          + plan feature configuration
          + organization overrides (active window only)
```

Limit overrides are **additive**: plan 5 sites + override +10 = **15** sites.

Boolean overrides can enable a module the plan does not include (or disable one it does).

Temporary overrides use `starts_at` / `ends_at` (`override_type = temporary`). Expired rows are ignored.

Code:

- Pure merge: `src/lib/entitlements/resolve.ts` (`mergeEntitlements`)
- DB engine: `src/lib/entitlements/engine.ts` (`getEffectivePlan`, `getEffectiveEntitlements`, `hasFeature`, `getFeatureLimit`, `checkFeatureAccess`, `checkUsageLimit`, `getRemainingUsage`)
- Request path: `src/lib/services/entitlements.ts`

Frontend `<FeatureGate feature="advanced_analytics">` is UX only. Writes must call `requireFeature` / `checkLimit` on the server.

## Usage model

Prefer live counts:

- users → `organization_members` (active)
- sites → `sites`
- projects → `projects`

`usage_metrics` / `usage_events` exist for metered metrics (API calls, storage) and future billing. `checkLimit` / `checkRequestedUsage` block requests that would exceed remaining capacity (example: 487 users + 10 requested against 500 → block with “User limit reached…”).

## RBAC (SaaS staff)

`profiles.is_platform_admin` plus `profiles.platform_role`:

| Role | Intent |
| --- | --- |
| `super_admin` | Full control plane |
| `platform_admin` | All except `saas.billing.manage` |
| `billing_admin` | Subscriptions and billing, view orgs |
| `support_admin` | View + limited org update, no entitlement override |
| `read_only` | View only |

Permission codes live in `permissions` (`saas.organizations.*`, `saas.subscriptions.*`, `saas.plans.*`, `saas.features.*`, `saas.entitlements.*`, `saas.usage.view`, `saas.billing.*`, `saas.audit.view`). Matrix: `src/lib/auth/platform.ts`.

Customer RBAC remains org-scoped (`src/lib/services/rbac.ts`) and never sees `/admin`.

## RLS

Customer policies restrict rows to the caller’s organization membership.

Platform admins use elevated policies where defined in foundation migrations; application services still call `assertPlatformAdmin` / `requirePlatformAdmin` before mutations.

Never authorize solely from a path parameter.

## Customer overrides

`/admin/organizations/[id]?tab=features` shows base plan, effective entitlements, and overrides. Create / remove is audited (`saas.feature_override.upserted` / `.removed`).

## Customer experience

`/app/settings/subscription` — current plan, live usage bars, enabled features, upgrade prompt.

`/app/settings/billing` — public plan selection (no payment provider).

Locked modules use `UpgradeState` → Explore upgrade.

## Admin UI

`/admin` (also `/admin/dashboard`): KPIs from live Supabase data.

Also: `/admin/organizations`, `/admin/organizations/new`, `/admin/plans`, `/admin/features`, `/admin/entitlements`, `/admin/subscriptions`, `/admin/usage`, `/admin/billing`, `/admin/audit`, `/admin/settings`.

## Audit

`writeAuditLog` records actor, organization, action, resource, old/new values, reason, timestamp. Examples: organization created, plan changed, feature override, discount, suspend, trial extend.

## Tests

- `src/lib/entitlements/resolve.test.ts` — additive limits, enable override, expiry, 487+10 user cap
- `src/lib/auth/platform.test.ts` — role permission splits
- `src/lib/auth/access.test.ts` — org isolation (URL id insufficient)
- Apply migrations on a linked Supabase project to exercise RLS with two orgs; unit tests encode the authorization contract used by the app.
