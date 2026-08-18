# EHS360 production architecture (audit summary)

**Date:** 18 August 2026  
**Live database:** `sqybbygfksnjvmatiafm` (sonilesh)  
**Production host:** https://sonilesh.vercel.app/  
**Scope:** Inspect existing code and live schema. Phases 12-gap / 13 / 14 / marketing UI were in flight and were **not rewritten**.

This is an audit of what exists. It is not a certification, SLA, or compliance attestation.

## System shape

```
Vercel (Next.js App Router)
  ├── Marketing  /(marketing)
  ├── Customer   /app
  ├── Field      /field
  ├── Contractor /contractor
  └── SaaS admin /admin   (not /platform)
        │
        ▼
Supabase Auth + Postgres RLS + Storage (ehs-attachments, private)
        │
        ▼
Control plane: organizations → subscriptions → plans → plan_features
               → organization_feature_overrides → entitlements engine
```

There is **one** entitlement engine (`src/lib/services/entitlements.ts` + `src/lib/entitlements/resolve.ts`). Billing is abstracted as `BillingProvider`; the live adapter is `ManualBillingProvider`. Razorpay webhook exists as a signed stub, not a full payment lifecycle.

## What is live vs local-only

Live `supabase_migrations` ends at `phase12_gap_fill` (20260817203546).

| Artifact | Repo | Live DB |
|---|---|---|
| Tenancy, RBAC, plans, subscriptions, usage_* | Yes | Yes |
| EHS modules through Phase 12 schema | Yes | Yes (RLS on every public table) |
| `20260326000040` executive analytics (Phase 13) | Untracked local file | **Not applied** (no `ai_*` / analytics summary tables) |
| `20260326000050` AI copilot (Phase 14) | Untracked local file | **Not applied** |
| `20260326000060` webhook idempotency | Added this pass | **Not applied** (approval required) |

## Request path (customer app)

1. `src/middleware.ts` → session refresh + `x-request-id`
2. `requireUser` / `requireOrgContext` (React `cache`, membership — never URL org id)
3. `listEnabledFeatures` / `getUserPermissions` / `requireFeature` on writes
4. Service queries always `.eq("organization_id", …)` plus RLS

## Known structural duplicates (do not add a third)

| Concern | Copies |
|---|---|
| Entitlements | One engine. Keep it. |
| Notifications | `notifications` (used) and empty `in_app_notifications` |
| Attachments | `attachments`, `ehs_event_attachments`, `permit_attachments` |
| Checklists | Template engine + permit checklist tables |
| Compliance catalogs | `compliance_domains` / `compliance_obligations` (global) vs org-scoped legal register |

## Security snapshot

- Storage bucket `ehs-attachments` is **private**; downloads use signed URLs; path prefix is org UUID.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only (`src/lib/supabase/admin.ts`). No `NEXT_PUBLIC_` service role.
- All public tables have RLS enabled.
- `next_event_number` checks `is_org_member` / platform admin.
- Anon could `EXECUTE` trigger function `prevent_contractor_doc_self_verify` (grant revoke in `00060`, pending live apply).

## Performance snapshot (nav / upload)

Observed in code, not timed in a logged-in browser (measurement **BLOCKED**):

- Every `/app` navigation re-ran the full server layout: auth, memberships, sites, projects, roles, entitlements, permissions, branding, unread count, **and a 12-row notification list**.
- Sidebar `Link` prefetch defaulted **on**, so viewport links competed with the click.
- Field/report uploads sent `File` bytes through Next.js server actions (`bodySizeLimit` was 24 MB) instead of browser → signed PUT → metadata.

## Explicit non-claims

Do not treat this product as SOC 2, ISO 27001, GDPR, HIPAA, or SLA certified. Plan names in seed data are catalog examples, not hard-coded entitlement logic.
