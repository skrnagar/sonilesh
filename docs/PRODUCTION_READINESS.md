# EHS360 production readiness

**Audit date:** 18 August 2026  
**Verdict:** **NOT PRODUCTION READY**  
**Why:** Live billing is a manual stub; webhook idempotency table is not applied on production; Phase 13/14 are in-flight and **not** on the live database; navigation/upload timing could not be measured in a logged-in production browser. P0 code fixes landed in the repo. Do not ship a “sell subscriptions / AI copilot / control tower” story until the P0s below are closed.

Phases 13 (analytics), 14 (AI copilot), 12 gap-fill, and the marketing rich-UI pack were **in flight and were not rewritten**.

This document is an engineering audit. It is not a SOC 2, ISO, GDPR, HIPAA, or SLA claim.

---

## 1. Executive summary

The control plane from Phase 2/3 exists and is the only plan engine: orgs, plans, subscriptions, entitlements, usage tables, `/admin`. Customer EHS modules (incidents through legal/ESG schema) exist with RLS. Gaps that block “commercial SaaS production” are live payments, enterprise identity, observability beyond request ids, unapplied 13/14, and unmeasured field/nav performance in production.

## 2. Production status

| Surface | Status |
|---|---|
| Auth + RLS tenant isolation | IMPLEMENTED (unit-tested contract; live two-org RLS not E2E’d) |
| Entitlements backend `requireFeature` | IMPLEMENTED |
| `/admin` control plane | IMPLEMENTED (not `/platform`) |
| Billing capture / invoices | PARTIAL — `ManualBillingProvider` only |
| `/api/health` `/api/ready` | IMPLEMENTED this pass |
| Signed private storage | IMPLEMENTED; direct signed upload added this pass |
| Phase 13 analytics | PARTIALLY_IMPLEMENTED / NOT_TESTABLE (local SQL, not live) |
| Phase 14 AI copilot | PARTIALLY_IMPLEMENTED / NOT_TESTABLE (local SQL, not live) |
| Marketing homepage/cmdk/charts | IN FLIGHT — not audited as a rewrite target |

## 3. Architecture

See `docs/PRODUCTION_ARCHITECTURE.md`. Next.js 15 App Router + Supabase. Four shells: marketing, `/app`, `/field`, `/contractor`, `/admin`.

## 4. Multi-tenancy and RLS

**Evidence:** Live `pg_tables` — every `public` table has `rowsecurity = true`. Storage policies require `is_org_member(split_part(name,'/',1)::uuid)`. App access uses `authorizeOrganizationAccess` / membership cookies (`src/lib/auth/org-context.ts`, `src/lib/auth/access.ts`). URL/form `organization_id` is not sufficient.

**This pass:** `createEventAction` and `uploadAttachmentAction` now use session org from `requireOrgContext`, not the client-supplied org id.

**Gap:** No automated two-JWT Org A vs Org B test against live PostgREST. Unit tests encode the contract only.

## 5. Authentication and sessions

Supabase Auth via `@supabase/ssr`. Middleware `getUser()` on protected routes. Separate login rewrites for admin/field/contractor. JWT `user_metadata` is not used for authorization (good).

**Gap:** Leaked-password protection disabled (Supabase advisor). Session revocation on user delete not custom-enforced.

## 6. Authorization, privilege, IDOR

Writes go through services that `requirePermission` / `requireFeature` and `.eq("organization_id")`. Detail pages (`getEventBundle`) scope by org + id and `notFound()` if missing (RLS + query). Platform `/admin` gated by `is_platform_admin` in middleware **and** `requirePlatformAdmin`.

**Remaining P1:** Some actions still take entity ids only (rely on RLS). `seed_org_report_categories` is SECURITY DEFINER and executable by `authenticated`.

## 7. Entitlements

Single engine: `hasFeature` / `requireFeature` / `checkLimit` in `src/lib/services/entitlements.ts`. Frontend `FeatureGate` is UX only. Self-host can restrict via `SELF_HOST_FEATURE_CODES`. Plan names are database rows.

Do **not** build a second plan engine.

## 8. Billing

`BillingProvider` + `ManualBillingProvider` (`src/lib/billing/provider.ts`). `getBillingProvider()` always returns manual. Razorpay webhook verifies HMAC and updates `subscriptions`. Invoices table exists, empty, unused. No silent billing. No fake invoices generated for customers.

Webhook idempotency: code + migration `20260326000060` — **live table not applied**.

## 9. Storage and files

Bucket `ehs-attachments`, `public=false`, 15 MB limit. Signed download URLs. This pass: signed **upload** tickets so the browser PUTs to Storage; metadata is recorded after. Path must start with `{organizationId}/`.

## 10. API security

Almost no public `/api` surface. Existing: `/api/billing/razorpay`, `/api/internal/compliance-tick`, plus `/api/health` and `/api/ready`. Cron no longer falls back to the service role as the bearer secret (requires `CRON_SECRET`). Responses use structured codes (`AUTH`, `FORBIDDEN`, `ENTITLEMENT_REQUIRED`, …) without stacks. No `/api/v1`.

## 11. Secrets and environment

`.env` / `.env*.local` gitignored. `.env.example` placeholders only. No `NEXT_PUBLIC_` service role. `assertRequiredServerEnv` requires URL + anon always; service role in `VERCEL_ENV=production`. AI/billing keys optional. `instrumentation.ts` warns locally, throws in Vercel production if required keys missing.

## 12. Observability

`x-request-id` on middleware and JSON APIs. No centralized log drain, tracing, or error tracker. Structured error **codes** only on API routes, not all server actions.

## 13. Health and readiness

- `GET /api/health` — liveness, no diagnostics
- `GET /api/ready` — config + cheap `organizations` select via service role

## 14. Jobs and cron

`POST /api/internal/compliance-tick` evaluates applicability. `vercel.json` has **no crons**. `expire_overdue_permits` exists in DB but is not scheduled from the app.

## 15. Rate limiting

AI rate-limit table is in unapplied Phase 14 SQL. No general API rate limit / WAF rules in-repo. Vercel platform DDoS is not a substitute we claim.

## 16. Feature flags

Plan features + org overrides **are** the flag system. No separate LaunchDarkly-style table.

## 17. Data export / offboarding

No tenant data-export or account-deletion workflow beyond org `cancelled` / `archived` statuses.

## 18. Onboarding

`organization_onboarding_progress` + `/onboarding` wizard. Layout redirects incomplete orgs. Documented in `docs/ONBOARDING.md`.

## 19. MFA and SSO

`organization_settings.security.require_mfa_admins` is a **policy flag only** — not enforced in middleware. Feature catalog includes `sso` but there is no SAML/OIDC tenant SSO implementation.

## 20. Duplicate engines

See architecture doc. Do not add another checklist, CAPA, document, or entitlement engine.

## 21. Performance (navigation and upload)

**Root cause (code):** Full `/app` layout RSC on every click (~auth + memberships + sites/projects + roles + entitlement matrix + permissions + branding + notifications). Default Next.js link prefetch multiplied that. Uploads were `File` → Server Action → Supabase (double hop; 24 MB body). Dashboard previously selected up to 1500+800+… rows per load (live data is small today: 27 events).

**This pass:** `prefetch={false}` on sidebar; layout drops notification list (count + lazy dropdown); list pages cap at 80; dashboard caps reduced; signed direct upload; server action body 4 MB.

**Measurement:** BLOCKED — no authenticated production browser session in this audit. Query-count evidence only.

## 22. Mobile / field UX

`/field` is a separate shell, offline string queue (files are **not** queued — photos dropped when offline). Direct upload when online. Tab bar already used selective prefetch.

## 23. Testing

Vitest unit tests exist for tenancy helpers, entitlements merge, RBAC matrix, many services. New Phase 15 files lint clean (`next lint` exit 0). No Playwright/Cypress in repo. No GitHub Actions workflow. Live RLS two-org test **not run**. E2E 1–10: **BLOCKED** (no suite).

## 24. Migrations and drift

Repo files use `20260326*` names; live history uses `20260817*` MCP-applied names. Same logical phases through 12 gap-fill. 13/14/60 not on live. Do not drop production tables to “align names”.

## 25. Deployment, DR, remaining risk

Vercel Git integration assumed; `vercel.json` is framework-only. No documented backup restore drill. RPO/RTO **must not** be invented. Remaining production risks: unapplied 00060, manual billing, no MFA enforcement, 13/14 incomplete, unmeasured nav, cron unscheduled, advisor “leaked password protection disabled”.
