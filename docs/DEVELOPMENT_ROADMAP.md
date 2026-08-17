# EHS360 development phases

This is the product sequence. Status is based on what exists in the repository today — not on marketing claims.

| Phase | Focus | Status | Notes |
|---|---|---|---|
| **1** | Product architecture | **Done** | `ARCHITECTURE.md`, tenancy/RBAC/subscription docs under `docs/` |
| **2** | Supabase + authentication | **Done** | Migrations, Auth, RLS, login/signup/reset/verify, session middleware |
| **3** | SaaS admin + multi-tenancy | **Done** | `/admin` orgs, plans, features, subscriptions, usage, audit; org cookie switcher |
| **4** | Plans + subscription + feature engine | **Mostly done** | DB-driven `hasFeature` / `requireFeature`; Razorpay webhook stub; grace period; self-serve billing UI. Live payment not verified |
| **5** | Corporate website | **Done** | Marketing shell + module/solution pages |
| **6** | Customer EHS workspace | **Done** | `/app` shell, dashboard, sidebar, site/project context |
| **7** | Field experience | **Done** | Separate `/field` shell, report/actions/permits/training |
| **8** | EHS modules | **In progress** | Incidents / near-miss / LMRA / risk / PTW / inspections / CAPA have list+service. Training, contractors, PPE, docs, MOC, toolbox are list-thin |
| **9** | Workflow + CAPA + notifications | **Partial** | Status machines in services (not a generic engine table). CAPA verify-by-other. `notifications` table. No email dispatcher |
| **10** | Reports + analytics | **Partial** | Dashboard charts are real. `/app/reports` and `/app/analytics` were shells — analytics now reuses the dashboard query layer |
| **11** | AI | **Not started** | Do not add until 8–10 are operational. No model keys in the app |
| **12** | Security + testing + production | **In progress** | RLS + Vitest + lint/typecheck/build. No SOC2/ISO claims. Live E2E still manual |

## Rules

- Do not skip isolation (Phase 2–3) when adding a module.
- Do not hard-code plans or permissions in UI.
- Do not invent certificates, SLA numbers, or competitor assets.
- Phase 11 is optional add-on, not a substitute for workflow.

## Local quality gate (every phase)

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Apply new SQL in `supabase/migrations/` to the live project before expecting new tables.
