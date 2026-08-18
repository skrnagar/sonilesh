# EHS360 production remediation

Audit date: 18 August 2026. Phases 13/14/marketing were in flight and were not rewritten.

| ID | Severity | Area | Finding | Evidence | Root cause | Remediation | Status |
|---|---|---|---|---|---|---|---|
| P0-01 | P0 | Nav | Clicking another `/app` URL re-ran a heavy layout (auth, memberships, sites, projects, roles, entitlements, permissions, branding, 12 notifications) | `src/app/app/layout.tsx` | App Router layout is the security/context boundary and was doing inbox I/O on every navigation | Dropped notification list from layout (count + lazy fetch). Sidebar `prefetch={false}` | **Fixed in repo.** Timing in production **BLOCKED** (no logged-in browser) |
| P0-02 | P0 | Upload | Photos/files went through Next server actions (24 MB body) | `src/app/actions/field.ts` `persistMedia`; `next.config.ts` | FormData `File` in Server Actions | Signed upload ticket + browser PUT; metadata only on server; body limit 4 MB | **Fixed in repo** |
| P0-03 | P0 | IDOR | `createEventAction` / `uploadAttachmentAction` trusted form `organizationId` | `src/app/actions/events.ts` | Client field treated as tenant | Session org via `requireOrgContext` | **Fixed in repo** |
| P0-04 | P0 | API | No liveness/readiness | No `src/app/api/health` before this pass | Missing | `/api/health`, `/api/ready` + tests | **Fixed in repo** |
| P0-05 | P0 | Env | Server secrets all optional; production could boot misconfigured | `src/lib/env.ts` | Optional zod | `assertRequiredServerEnv` + `instrumentation.ts` (strict on `VERCEL_ENV=production`) | **Fixed in repo** |
| P0-06 | P0 | Billing | Razorpay webhook not idempotent | `src/app/api/billing/razorpay/route.ts` | No unique event table | `billing_webhook_events` migration `20260326000060` + handler | **Code in repo. Live apply PENDING** (MCP apply not approved) |
| P0-07 | P0 | Cron | Internal tick accepted `SUPABASE_SERVICE_ROLE_KEY` as bearer | `src/app/api/internal/compliance-tick/route.ts` | Fallback secret | Require `CRON_SECRET` only | **Fixed in repo** — set `CRON_SECRET` on Vercel or cron 401s |
| P0-08 | P0 | DB grants | Anon could EXECUTE `prevent_contractor_doc_self_verify` | Supabase security advisor | Trigger function granted to PUBLIC/anon | Revoke in `00060` | **SQL in repo. Live PENDING** |
| P1-01 | P1 | Billing | No live PSP checkout; `ManualBillingProvider` only | `src/lib/billing/provider.ts` | Phase 4 stub | Implement a real `BillingProvider` adapter; do not duplicate plan engine | Open |
| P1-02 | P1 | Identity | MFA flag not enforced; no SAML SSO | `src/app/app/settings/organization/page.tsx` | Policy JSON only | Enforce MFA via Auth AAL; design SSO later | Open |
| P1-03 | P1 | Analytics/AI | Phase 13/14 files untracked; tables missing on live | `list_migrations` ends at phase12_gap_fill | In-flight other agents | Finish 13/14 then apply SQL; do not rewrite here | Open / NOT_TESTABLE |
| P1-04 | P1 | Lists | Widespread `select("*")`; incident lists had no limit | `src/lib/events/queries.ts` and many services | Convenience queries | Cap 80 on event lists; remaining SELECT * is P1 | Partial |
| P1-05 | P1 | Dashboard | Pulled 1500 events + hundreds of CAPA/permits for KPIs | `src/lib/services/dashboard.ts` | Client-side aggregation | Caps reduced to 400/200; SQL aggregates still P1 | Partial |
| P1-06 | P1 | Auth | Leaked password protection disabled | Supabase advisor | Project Auth setting | Enable in Supabase Auth settings | Open |
| P1-07 | P1 | Jobs | No Vercel cron; permits expiry RPC unscheduled | `vercel.json` | Not wired | Add cron + `CRON_SECRET` | Open |
| P1-08 | P1 | Export | No tenant export / offboarding | — | Not built | Design export job | Open |
| P1-09 | P1 | RPC | `seed_org_report_categories` executable by authenticated | Advisor | SECURITY DEFINER in public | Membership check or revoke | Open |
| P1-10 | P1 | CI | No GitHub Actions | No `.github/workflows` | Not added | lint/typecheck/test on PR | Open |
| P1-11 | P1 | Observability | No log drain / tracing | — | Not built | See `docs/OBSERVABILITY.md` | Open |
| P1-12 | P1 | Ready page | No `/platform` readiness score | `/platform` redirects to marketing product | `/admin` exists instead | Optional admin widget later | Open (documented) |
| P2-01 | P2 | Dup tables | `in_app_notifications` empty; multiple attachment tables | Live `list_tables` | Layered phases | Do not add more; consolidate later | Open |
| P2-02 | P2 | API v1 | No public REST versioning | — | Not in scope | Future | Open |
| P2-03 | P2 | Indexes | Many unindexed FKs | Performance advisor (INFO) | Schema growth | Add indexes when EXPLAIN shows need | Open |
| P2-04 | P2 | Field offline | Offline queue stores strings only; photos dropped | `src/lib/field/offline-queue.ts` | localStorage | IndexedDB blobs later | Open |

## Counts

| Severity | Open | Fixed in this pass | Pending live apply |
|---|---|---|---|
| P0 | 0 remaining in **code** if 00060 applied | 8 addressed | P0-06, P0-08 live |
| P1 | 12 | Partial on lists/dashboard | — |
| P2 | 4 | 0 | — |

Until `00060` is applied on `sqybbygfksnjvmatiafm`, treat **P0-06/P0-08 as open P0**.
