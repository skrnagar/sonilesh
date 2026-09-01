# EHS360 Enterprise Architecture Assessment

**Date:** 1 September 2026  
**Branch assessed:** `main` @ `f8f266d` (enterprise phases 1–24)  
**Production:** https://sonilesh.vercel.app  
**Purpose:** Enterprise EHS operating system — inspired by large EPC safety platform **operating models** (UA/UC, incidents, LMRA, permits, visits, MIS, scorecards) without copying proprietary branding or marketplace-first navigation.

---

## 1. Vision

### Current state (evidence)

EHS360 is a mature **multi-tenant Supabase + Next.js** platform with:

- Marketing site at `src/app/(marketing)/`
- Customer workspace at `/app` (50+ sidebar entries via `APP_MODULES` in `src/lib/navigation/modules.ts`)
- Field shell at `/field` (incident, near-miss, hazard, LMRA, permits, inspection, toolbox)
- Contractor portal at `/contractor`
- SaaS control plane at `/admin`
- Marketplace page at `/app/marketplace` — **demoted to Administration → Templates** (not launchpad)
- Subscription/feature gating via `plans`, `features`, `organization_feature_overrides`

The product roadmap (`docs/EHS360_ROADMAP.md`) sequences **Phase 19 operating model → Phase 20 launchpad → Phase 21+ core workflows**. Marketplace is deprecated as a primary product direction.

### Target state

An **Enterprise EHS Operating System** where:

1. **Operations-first IA** — `/app/home` module launchpad (My Dashboard | EHS Operations | Reports | AI Copilot) + grouped sidebar.
2. **Hierarchy-native** — Organization → Business Unit → **Region** → Site → Project → Department → Location, with scoped RBAC.
3. **Workflow engines** — Configurable state machines for UA/UC, incidents, LMRA, permits, visits, MIS, CAPA — not hardcoded transitions only in `events.ts`.
4. **Assurance layer** — Checklists, audits, inspections, scorecards, MIS roll-ups, report hub.
5. **AI as assistive layer** — Copilot reads tenant FACT data; never autonomous closure (per `docs/PHASE_18_ADVANCED_AI.md`).
6. **Marketplace demoted** — Templates/connectors become **admin configuration**, not the primary app entry metaphor.

### Operating model (experience layer)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  /app/home — Enterprise Launchpad                                        │
│  ┌─────────────┐  ┌──────────────────────────────┐  ┌─────────────────┐ │
│  │ My Dashboard│  │ EHS Operations (module grid) │  │ Reports shortcut│ │
│  │ KPI tiles   │  │ UA/UC · Incident · LMRA · PTW│  │ MIS · Scorecard │ │
│  └─────────────┘  │ Visits · CAPA · Training · … │  └─────────────────┘ │
│                   └──────────────────────────────┘  ┌─────────────────┐ │
│                                                     │ AI Copilot entry│ │
│                                                     └─────────────────┘ │
├──────────────────────────────────────────────────────────────────────────┤
│  Grouped sidebar: Home · Dashboard · Safety Ops · Risk & Control ·     │
│  Assurance · People · Analytics · Reports · AI Copilot · Administration  │
│  (Templates under Admin — not marketplace launchpad)                     │
├──────────────────────────────────────────────────────────────────────────┤
│  Role experiences: Worker · Supervisor · Safety Officer · PM ·           │
│  Regional EHS · Corporate EHS                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

### Architectural layers

```
┌─────────────────────────────────────────────────────────────────┐
│  Experience Layer                                               │
│  Marketing │ App Shell │ Field │ Contractor │ Executive │ Admin   │
├─────────────────────────────────────────────────────────────────┤
│  Application Layer (Next.js App Router + Server Actions)        │
│  actions/* │ services/* │ lib/reporting │ lib/analytics │ lib/ai │
├─────────────────────────────────────────────────────────────────┤
│  Domain Engines                                                 │
│  Reporting (ehs_events) │ CAPA │ PTW │ Checklist │ Workflow*    │
│  Notification │ Entitlement │ Contractor │ Compliance │ ESG     │
├─────────────────────────────────────────────────────────────────┤
│  Data + Security (Supabase)                                     │
│  Postgres + RLS │ Auth │ Storage (ehs-attachments) │ Realtime   │
└─────────────────────────────────────────────────────────────────┘
* Workflow engine: stub today (`src/lib/services/workflow.ts` → reporting_builtin_v1)
```

---

## 2. What changes from current architecture

| Area | Today | Enterprise target |
|------|-------|-------------------|
| **Primary navigation** | Flat `APP_MODULES` sidebar (operations/assurance/compliance/ESG/system) | Persona home + grouped Safety Operations IA (see `EHS360_MODULE_MAP.md`) |
| **Marketplace** | `/app/marketplace` + Phase 19 forward roadmap | Settings → Integrations/Templates; no launchpad metaphor |
| **Tenant hierarchy** | Org → BU → Site → Project → Dept → Location (`business_units`, `sites`, `projects`) | Add **Region** between BU and Site; member scope on region/project |
| **UA/UC** | Report types `unsafe_act`, `unsafe_condition` on `ehs_events`; list at `/app/observations` | Dedicated UA/UC module with allocate → close → **final closure** (Safety Officer) per reference workflow |
| **LMRA** | Field quick capture only (`/field/lmra`, mode `lmra` in `QuickCaptureForm`) | First-class LMRA records with ESHO approve/reject, linked to activity/site |
| **Site visits** | Not modeled (HSV/RSV/TSV) | `site_visits` entity with role-gated create (Regional PM, Section Incharge, etc.) |
| **MIS / Scorecard** | Analytics dashboards partial; no MIS submission workflow | Periodic MIS periods + EHS Score dimensions with BU/Region roll-up |
| **Workflow** | Status transitions in `events.ts` TRANSITIONS map; CAPA in `capa.ts` | Generic `workflow_definitions` + `workflow_instances` per module |
| **RBAC** | System roles in seed + `member_roles.scope` (org/site/project/dept/self) | Map enterprise roles (PM, Regional Manager, BU EHS Head) + action-level matrix |
| **Roadmap priority** | Phase 19 marketplace spec prominent | Phases 1–4: shell, hierarchy, RBAC, core ops workflows |

---

## 3. Tenant hierarchy (target)

```
Organization (organizations)
 └── Business Unit (business_units)          ← exists
      └── Region (regions)                   ← NEW
           └── Site (sites)
                └── Project (projects)
                     └── Department (departments)
                          └── Location (locations)
```

**Cookies today:** `ORG_COOKIE`, `SITE_COOKIE`, `PROJECT_COOKIE` (`src/lib/auth/org-context.ts`).  
**Target:** Add `REGION_COOKIE`; context switcher shows BU → Region → Site → Project chain when enabled in `organization_settings.hierarchy_config`.

Member assignment uses `member_roles` with scopes extended in `20260326000023_organization_hierarchy_phase3.sql`: `organization`, `business_unit`, `site`, `project`, `department`, `self`.

---

## 4. Core engines (reuse vs rebuild)

### Reuse (keep, extend)

| Engine | Location | Tables |
|--------|----------|--------|
| Reporting | `src/lib/services/events.ts`, `src/lib/reporting/types.ts` | `ehs_events`, `event_types`, `event_categories`, `investigations` |
| CAPA | `src/lib/services/capa.ts`, `capa-bridge.ts` | `capa_items`, `action_items` |
| PTW | `src/lib/services/permits.ts` | `permits`, `permit_types`, `permit_approvals`, `permit_extensions` |
| Checklists | `src/lib/services/checklists.ts` | `checklist_templates`, `checklist_assignments`, `checklist_findings` |
| Risk | `src/lib/services/risk.ts` | `risk_assessments`, `risk_hazards`, `risk_matrices` |
| Entitlements | `src/lib/services/entitlements.ts` | `features`, `plans`, `subscriptions` |
| RBAC | `src/lib/services/rbac.ts` | `roles`, `permissions`, `role_permissions`, `member_roles` |
| Notifications | `src/lib/services/notifications.ts` | `notifications` (in-app; email dispatcher not built) |
| Analytics | `src/lib/analytics/*`, `src/lib/services/dashboard.ts` | Phase 13 tables when applied |
| AI Copilot | `src/lib/ai/*`, `src/app/app/ai/` | Phase 14 `ai_*` tables when applied |
| Contractor | `src/lib/services/contractors.ts` | `contractor_companies`, `contractor_workers`, etc. |

### Redesign

| Component | Why |
|-----------|-----|
| App shell / sidebar | 50+ flat links; no persona home or module tiles |
| Navigation groups | Mixes ESG/compliance/marketplace with daily ops |
| Dashboard entry | Generic `/app/dashboard` vs role-specific control surfaces |
| Marketplace UX | Wrong mental model for enterprise operators |

### Build new

| Component | Why |
|-----------|-----|
| Region entity + admin UI | Reference orgs use Regional Manager roll-ups |
| LMRA module (not just field mode) | Two-step entry + ESHO approval in reference guides |
| Site visit module (HSV/RSV/TSV) | Distinct from inspections; role-gated creation |
| MIS reporting module | Online MIS with approval chain (BU EHS Head) |
| EHS Score module | Scorecard create/edit by EHS roles |
| Generic workflow engine tables | Blueprint + reference both require configurable transitions |
| Report Hub | Central export/scheduled reports (beyond `/app/reports` shell) |
| Action-level permission matrix UI | Map xlsx matrix to configurable grants |

---

## 5. Request path (unchanged foundation)

1. `src/middleware.ts` — Supabase session refresh
2. `requireOrgContext()` — org/site/project from cookies; RLS-bound Supabase client
3. `requireModuleAccess({ featureCode, permission })` — entitlement + RBAC gate
4. Service layer — always `.eq("organization_id", organizationId)`
5. RLS policies — `20260326000006_rls_policies.sql` + module patches

Field and contractor paths use persona redirects in `src/app/app/layout.tsx` (`isFieldOnlyRoles`, `isContractorPortalOnly`).

---

## 6. AI layer (assistive, not autonomous)

Existing Phase 14 architecture (`docs/AI_ARCHITECTURE.md`, `docs/PHASE_18_ADVANCED_AI.md`):

- FACT vs INFERENCE labeling mandatory
- Human approval for writes
- Retrieval over tenant records

**Enterprise addition:** AI surfaces on UA/UC triage, incident classification, LMRA risk suggestions, MIS anomaly flags, scorecard driver explanations — all scoped to user's hierarchy visibility.

---

## 7. Implementation roadmap (Phases 19–40)

Aligned with enterprise operating model rebuild. Phases 1–24 on `main` delivered shell, RBAC, regions, UA/UC service methods, LMRA, site visits, MIS, scorecard, and report hub scaffolding. **Phase 20** completes the launchpad experience.

| Phase | Focus | Status | Exit criteria |
|-------|-------|--------|---------------|
| **19** | RAKSHA-inspired operating model (docs) | **Done** | IA, workflows, RBAC map, module map updated |
| **20** | Enterprise launchpad + navigation | **In progress** | `/app/home` sections, grouped nav, templates demoted |
| **21** | UA/UC + Incident + Near Miss | Next | Full CREATE→SUBMITTED→EHS TRIAGE→ASSIGNED→ACTION IN PROGRESS→ACTION COMPLETED→VERIFICATION→CLOSED |
| **22** | LMRA + Risk Assessment | Planned | ESHO approval, risk register depth |
| **23** | Work Permit + LOTO | Planned | Multi-party sign-off, extension, close-out |
| **24** | Checklist + Inspection + Audit | Planned | Mobile execution, findings → CAPA |
| **25** | TSV + HSV/RSV + BBS | Planned | Role-gated visit creation, behavioral safety |
| **26** | CAPA + Action Management | Planned | Overdue escalation, verify-by-other |
| **27** | EHS Score Card | Planned | Dimensional scoring, regional roll-up |
| **28** | EHS MIS | Planned | Periodic MIS with BU EHS Head approval |
| **29** | Reports Hub | Planned | Scheduled PDF/Excel, register exports |
| **30** | Analytics & Benchmarking | Planned | Site → region → corporate drill-down |
| **31** | Training & competency | Later | Assignments, expiry, compliance % |
| **32** | Contractor readiness | Later | Prequalification, induction, performance |
| **33** | Compliance & legal register | Later | Secondary nav group |
| **34** | AI Copilot (production) | Later | Grounded assist on ops modules |
| **35** | AI Agents | Later | Triage, classification, anomaly flags |
| **36** | Mobile / field hardening | Later | Offline-first field workflows |
| **37** | Admin & hierarchy | Later | Region scope admin, action matrix UI |
| **38** | Multi-tenant federation | Later | Enterprise org patterns |
| **39** | Integrations (16B API) | Later | Documented public API + connectors |
| **40** | Hardening & global platform | Later | Localization, performance, SLA |

**Immediate next coding phase:** **Phase 21** (UA/UC + Incident workflow UI parity with target state machine).

### Prior internal phases (1–24, delivered on main)

| Phase | Focus | Status |
|-------|-------|--------|
| 1–4 | Shell, RBAC, regions, UA/UC service | Done |
| 5–9 | LMRA, PTW, checklists, CAPA, site visits | Partial / scaffolded |
| 10–15 | Workflow stub, notifications, MIS, score, report hub | Partial / scaffolded |
| 16–24 | Training, contractor, compliance, AI, API, templates | Partial |

**Deprecated:** Phase 19 marketplace-first direction (`docs/PHASE_19_MARKETPLACE.md`) — superseded by operating model docs.

---

## 8. Reuse estimate

| Layer | Reuse | Notes |
|-------|-------|-------|
| Database core (tenancy, events, CAPA, PTW, checklists) | **~75%** | Add region, LMRA, visits, MIS, score |
| Services / business logic | **~65%** | Workflow, notifications, MIS/score new |
| UI routes (pages exist) | **~55%** | Many list-thin pages; shell/IA wrong |
| Auth / RLS / entitlements | **~85%** | Extend scopes + action matrix |
| Marketing | **~90%** | Keep; reposition as enterprise EHS OS |
| **Overall weighted reuse** | **~65–70%** | Substantial foundation; wrong product shape at IA/workflow layer |

---

## 9. Related documents

- `docs/EHS360_MODULE_MAP.md` — Sidebar IA → routes → tables
- `docs/EHS360_WORKFLOWS.md` — State machines for core modules
- `docs/EHS360_RBAC.md` — Roles and permission matrix mapping
- `docs/EHS360_DATABASE.md` — Schema assessment + proposed entities
- `docs/EHS360_UI_SYSTEM.md` — Enterprise shell redesign
- `_blueprint_extract/` — Parsed reference blueprints (non-proprietary domain patterns)
- Reference permission matrix: `SafetyApp-Permission-Matrix...xlsx` (Downloads)

---

## 10. Non-goals for this rebuild track

- Copying reference platform branding, logos, or proprietary labels
- Inventing customer counts, certifications, or benchmark statistics
- Implementing marketplace-first navigation
- Skipping RLS/tenant isolation for speed
- Autonomous AI closure of incidents or CAPA
