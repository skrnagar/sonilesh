# GAP Audit — EHS360 vs RAKSHA/KEC Reference

**Audit date:** 2026-09-01  
**Repo:** `SONIL ESH` (branch `main`, **1 commit ahead** of `origin/main`)  
**Reference sources:** RAKSHA/KEC screenshots, `docs/EHS360_MODULE_MAP.md`, `docs/WORKFLOW_ENGINE_STATUS.md`, `src/lib/navigation/*`, `src/lib/services/*`, `src/app/app/**`

**Verification run:**

| Command | Result |
|---------|--------|
| `npm run typecheck` | **PASS** |
| `npm test` | **PASS** — 46 files, 265 tests |

**Git status:** Clean working tree except untracked `.cursor/`. Unpushed commit: `7600568 fix: link site visit list rows to detail workflow page.`

---

## Executive summary

| Metric | Value |
|--------|-------|
| **Overall RAKSHA parity (functional)** | **~58%** |
| Modules ✅ done | 0 / 15 (none fully match RAKSHA PDF depth end-to-end) |
| Modules ⚠️ partial | 12 / 15 |
| Modules ❌ missing | 3 / 15 (NC, Utilities, Raksha-style operational reports/BI hub) |
| **Deploy-ready for pilot** | Shell, auth/RBAC, launchpad, incidents, permits, LMRA, site visits, MIS, scorecard, analytics, field capture |

The codebase has moved significantly past the stale rows in `EHS360_MODULE_MAP.md` (HSV/RSV/TSV, MIS, EHS Scorecard, LMRA app routes now exist). Remaining gaps are **workflow UI completeness**, **dedicated modules** (NC, Utilities, BBS), and **reporting/BI depth**.

---

## Module × Status matrix

| Module | Status | Routes (list / detail / forms) | Workflow vs RAKSHA PDF | RBAC | UI (tile / nav) | Reporting / BI | Tests |
|--------|--------|--------------------------------|------------------------|------|-----------------|----------------|-------|
| **UA / UC / WSN** | ⚠️ Partial | List `/app/observations`; create `/app/reports/new`, `/field/*`; detail **redirects** `/app/observations/[id]` → `/app/hazards/[id]` → `/app/incidents/[id]` | Service: 8-step UA/UC profile in `workflow.ts` + `allocateUaucEvent` / `beginUaucActionProgress` / `assigneeCloseUauc` / `finalCloseUauc` in `events.ts`. **List-only** `UaucWorkflowBar` on observations page; **no detail workflow UI**. WSN = `safety_observation` type on same list, no separate WSN program. | `hazards.allocate`, `hazards.close_assigned`, `hazards.final_close` seeded in migration `20260901000001` | Tile + nav ✅ | UA/UC count in `analytics/metrics.ts`; safety analytics page; no dedicated closure-rate dashboard | `workflow.test.ts`, `events.test.ts` (unit only) |
| **Incidents** | ⚠️ Partial | `/app/incidents`, `/new`, `/[id]`, `/[id]/investigation` | Generic `TRANSITIONS` in `events.ts` (draft→submitted→triage→investigation→capa→verification→approval→closed). **Not** RAKSHA incident-specific stages on UI (manual status dropdown). | `incidents.*` permissions | Tile + nav ✅ | Incident trend/severity charts in analytics | `events.test.ts`, `incident-classification.test.ts` |
| **HSV / RSV / TSV (site visits)** | ⚠️ Partial | List + create `/app/site-visits`; detail `/app/site-visits/[id]` | Service: `draft→submitted→allocated→closed→final_closed` + RBAC gates. **Detail** has `SiteVisitWorkflowBar` (allocate / close / final-close). | `visits.hsv/rsv/tsv.create`, `visits.view`, `visits.allocate`, `visits.final_close` | Tile + nav ✅ | No dedicated visit analytics; included indirectly in scorecard | `site-visits.test.ts` (transitions only) |
| **LMRA** | ⚠️ Partial | List `/app/lmra`; detail `/app/lmra/[id]`; field `/field/lmra` | `draft→submitted→approved\|rejected`; approve on detail with `lmra.approve`, blocks self-approval | `lmra.create`, `lmra.view`, `lmra.approve` | Tile + nav ✅ | Feeds EHS scorecard planning dimension | Documented rule only in `site-visits.test.ts`; **no `lmra.test.ts`** |
| **Work permits (PTW)** | ⚠️ Partial | `/app/permits`, `/new`, `/[id]`, `/active`, `/closeout`, field permits | Full `PERMIT_TRANSITIONS` + multi-step approvals (`decidePermitApproval`, checklist gate, extensions, closeout). **Sign-off wired** in service + permit detail UI | `permits.view`, `permits.approve`, etc. | Tile + nav ✅ | `/app/analytics/permits`; export route | `permits.test.ts` (13 tests) |
| **EHS MIS** | ⚠️ Partial | `/app/mis` (list, create form, approve/reject) | `draft→submitted→approved\|rejected`; period gating via `ensureMisPeriod` | `mis.create`, `mis.view`, `mis.approve`, etc. | Tile + nav ✅ | Scope filters on page; **no MIS charts / roll-up BI** | **No dedicated tests** |
| **EHS Scorecard** | ⚠️ Partial | `/app/ehs-score` | Calculated from live ops data (events, CAPA, LMRA, inspections, training); `insufficient_data` below 5 records | `score.view` | Tile + nav ✅ | Dimensional breakdown on page; scope filters | `ehs-score.test.ts` |
| **BBS** | ⚠️ Partial | No dedicated module; `safety_observation` on `/app/observations` and field hazard/report | No BBS-specific workflow (positive/negative polarity field only); no culture/maturity scoring | Uses `hazards.*` | **No BBS tile** (grouped under UA/UC) | Partial via observation counts | Via `reporting/types.test.ts` |
| **Checklists** | ⚠️ Partial | Templates `/app/settings/ehs/checklists`; execution via `/app/inspections`, `/app/audits`, field | Checklist engine + findings → CAPA | `inspections.view`, `audits.view` | Via Inspections/Audits nav | Inspection metrics (open/completed/overdue) on inspections page | `checklists.test.ts` |
| **NC (non-conformance)** | ❌ Missing | No `/app/nc` or equivalent | N/A — only "Nonconformity notes" prompt in default audit template | N/A | Not in launchpad | N/A | None |
| **Training** | ⚠️ Partial | `/app/training`, `/field/training` | Course create + assign; basic status tracking | `training.view` (feature-gated) | Tile + nav ✅ | Workforce analytics page | None dedicated |
| **Utilities** | ❌ Missing | No routes or services | N/A | N/A | Not in launchpad | N/A | None |
| **Report Hub / BI analytics** | ⚠️ Partial | Hub `/app/reports/hub` (link catalog); analytics `/app/analytics/*` | N/A | `reports.view`, `analytics.view` | Tiles ✅ | Analytics: filters, KPI grids, incident charts, open/closed via metrics. Hub = **navigation index**, not embedded BI. `/app/reports` = force-closed event list only | `analytics.test.ts` |
| **Action items** | ⚠️ Partial | `/app/action-items` (list only); `/field/actions` | CAPA service exists; **no detail page**, assign/complete/evidence UI on web | `actions.view` / `capa.view` | Tile + nav ✅ | CAPA analytics page | `capa.test.ts` (service) |
| **Raksha Reports** | ❌ Missing | No branded export pack / scheduled Raksha report types | N/A | N/A | Report Hub links to registers, not Raksha PDF layouts | Export routes sparse (permits, contractors, BRSR marked coming soon) | None |

**Legend:** ✅ done · ⚠️ partial · ❌ missing

---

## Workflow deep-dive vs RAKSHA PDF expectations

| Workflow | RAKSHA expectation | Current implementation | Gap |
|----------|-------------------|------------------------|-----|
| **UA/UC (8-step)** | Report → Allocate (SO) → Assignee action → Assignee close → Final closure (SO) | Backend complete; step resolver + permission gates in `workflow.ts` / `events.ts`; UI on **list page only** | Detail page missing; observation detail redirects to incident generic UI; no stepper on detail |
| **Site visit** | Allocate → Close → Final close | Service + detail `SiteVisitWorkflowBar` ✅ | Findings/checklist attachment, action item spawn from visit |
| **MIS approval** | Submit → Management approve | `reviewMisSubmission` + MIS page forms ✅ | Multi-level approval, MIS period admin UI, regional consolidation reports |
| **Permit sign-off** | Multi-role PTW approval chain | `decidePermitApproval`, approval rules, checklist gate ✅ | SIMOPS/LOTO depth; org-configurable workflow definitions |
| **LMRA approve** | ESHO review | `reviewLmraAssessment` + detail UI ✅ | Web create form on list page minimal; risk/control matrix UI |

**Workflow engine:** Generic engine is a **stub** (`workflow.ts` returns `reporting_builtin_v1`). All enforcement is module-specific (documented in `WORKFLOW_ENGINE_STATUS.md`).

---

## Permissions / RBAC

| Area | Status |
|------|--------|
| Enterprise permissions (UA/UC, LMRA, visits, MIS, score) | ✅ Seeded in `20260901000001_enterprise_regions_rbac_lmra.sql` |
| Role bundles (ehs_officer, ehs_manager, supervisor, etc.) | ✅ Migration assigns permission sets |
| Runtime enforcement | ✅ `requirePermission` in services; `requireModuleAccess` on routes |
| UI action visibility | ⚠️ UA/UC actions only on list; incidents use generic transitions |
| RLS / DB triggers | ✅ Site visits, LMRA, MIS migrations include transition guards |

---

## UI / launchpad / shell

| Item | Status |
|------|--------|
| RAKSHA-style launchpad tiles | ✅ `HomeLaunchpad` with `variant="raksha"` CSS |
| Sidebar nav (`ENTERPRISE_NAV`) | ✅ All target modules linked |
| Sign-out instant feedback | ✅ `SignOutButton` with `useTransition` → "Signing out…" |
| Tab / route progress | ✅ `NavigationProgress` in app layout |
| Module detail consistency | ⚠️ Observations/hazards redirect to incidents; fragmented UX |

---

## P0 blockers — "every feature works fully"

1. **UA/UC detail workflow UI** — Implement type-aware detail at `/app/observations/[id]` with full 8-step stepper + actions (stop redirecting to incidents).
2. **Non-conformance (NC) module** — Dedicated register, workflow, and linkage to CAPA/audits (RAKSHA has explicit NC).
3. **Utilities module** — Admin/ops utilities present in RAKSHA screenshots; no routes or services exist.
4. **BBS program** — Separate BBS tile, positive observation workflows, and reporting (not just `safety_observation` mixed into UA/UC).
5. **Action items detail workflow** — Assign, evidence upload, complete, escalate; web parity with field actions.
6. **Report Hub as real BI** — Filters, charts, open/closed breakdowns, CSV/PDF export per register (hub is currently a link index).
7. **Raksha Reports / export pack** — Scheduled/printable report layouts matching KEC reference.
8. **MIS analytics & period management** — Admin UI for periods, regional roll-ups, trend charts (submit/approve only today).
9. **Site visit findings capture** — Checklist/findings/actions on visit detail (workflow transitions exist; content shallow).
10. **Integration/E2E tests** — No Supabase integration tests for LMRA, MIS, UA/UC transitions, or site visit service (unit tests only).

---

## P1 polish (speed, UI responsiveness)

1. Reduce duplicate fetches on module pages (partially addressed in `f7d9e5d`).
2. Add optimistic UI / toast feedback on workflow actions (allocate, approve, final-close).
3. Unify event detail component across incidents, hazards, observations (single type-aware shell).
4. Site visit list → detail navigation (fixed in unpushed `7600568`; push to remote).
5. LMRA web create form on `/app/lmra` (currently field-first empty state).
6. Analytics: dedicated UA/UC closure-rate and visit completion dashboards.
7. Action items: link rows to detail; filter by assignee/status.
8. Training: certificate upload, expiry alerts integration with notifications.
9. Mobile field tab parity for new enterprise modules — **site visits added**; MIS/scorecard admin web-only.
10. Update `EHS360_MODULE_MAP.md` to reflect Phase 21+ implementations (doc drift).

---

## Estimated implementation order (phases)

### Phase 1 — Workflow UI completion (2–3 weeks)
- UA/UC detail page + stepper; wire `UaucWorkflowBar` on detail
- Action items detail + complete/evidence flow
- Site visit findings/checklist section on detail
- Push unpushed site-visit link fix; add LMRA/MIS service unit tests

### Phase 2 — Missing RAKSHA modules (2–3 weeks)
- NC register (reuse checklist findings engine or new `nc_reports` table)
- BBS module (tile, routes, positive observation analytics)
- Utilities admin (org settings, bulk tools, reference data — scope from KEC screenshots)

### Phase 3 — Reporting & BI (2–4 weeks)
- Report Hub: embedded charts, filters, open/closed breakdown per module
- Raksha report templates / export pipeline
- MIS period admin + consolidated MIS dashboard
- UA/UC closure KPIs on analytics safety page

### Phase 4 — Platform hardening (ongoing)
- Generic workflow engine (definitions table) OR document per-module pattern as permanent
- Integration tests with Supabase test harness
- E2E smoke (Playwright) for critical paths: UA/UC allocate→close, visit final-close, permit approve, MIS approve

---

## Field app parity (mobile / `/field`)

**Audit date:** 2026-09-01 (post site-visit + LMRA fixes)

| Module | Field routes | Status | Notes |
|--------|--------------|--------|-------|
| UA / UC / observations | `/field/hazard`, `/field/report` | ✅ Create + submit | Photo, GPS, offline text queue; RBAC via `report_hazard` |
| Incidents / near miss | `/field/incident`, `/field/near-miss` | ✅ Create + submit | Severity, site, draft/submit; offline queue |
| LMRA | `/field/lmra` | ✅ Fixed | **Bug fixed:** form now sends `mode=lmra` so `createLmraFromFieldEvent` runs |
| Work permits | `/field/permits`, `/field/permits/new`, `/field/permits/[permitNumber]` | ✅ View + approve + request | New quick PTW request form; detail approve/ack/photos |
| Site visits HSV/RSV/TSV | `/field/site-visits`, `/field/site-visits/[id]` | ✅ **Added** | Create, list, allocate/close/final-close workflow on mobile |
| Inspections / checklists | `/field/inspection` | ✅ Execute | Assigned checklist runner + photo evidence |
| Actions / CAPA | `/field/actions` | ✅ Complete | Evidence photo + note; action items mark complete |
| Training / toolbox | `/field/training`, `/field/toolbox` | ✅ Partial | Assignment status; toolbox talk create |
| BBS / safety observation | `/field/hazard?type=safety_observation` | ✅ Create | Positive/negative polarity on submit |
| MIS / EHS Scorecard | — | ❌ Web admin only | Intentionally desktop; not field-operational |
| Offline sync | `src/lib/field/offline-queue.ts` | ⚠️ Partial | Text fields queue; photos require online (documented) |

**Navigation:** Home quick actions + Report tab include site visits and LMRA. `FieldSubmitForm` redirects after successful workflow actions.

**Remaining field gaps (P2):** MIS/scorecard read-only widgets; offline photo queue; UA/UC detail workflow on mobile; permit full create (risk/JSA) — field uses quick request only.

---

## What's deploy-ready today

Safe to deploy/pilot **without** claiming full RAKSHA parity:

- Multi-tenant app shell, onboarding, RBAC, entitlements
- RAKSHA-styled home launchpad and enterprise sidebar
- Incidents (list, detail, investigation, generic workflow)
- Permits (full PTW lifecycle, approvals, field approve)
- LMRA (list, detail, ESHO approve/reject)
- Site visits HSV/RSV/TSV (create, list, detail workflow)
- EHS MIS (create, submit, approve/reject with scope filters)
- EHS Scorecard (live calculated score with insufficient-data guard)
- Analytics hub + safety/CAPA/permits sub-pages with charts
- Report Hub as module index (not full BI)
- Field capture for reports, LMRA, permits, inspections, actions, **site visits**
- CI green: typecheck + 265 unit tests

**Not ready for "full RAKSHA replacement"** until P0 items 1–7 are addressed.

---

## File index (audit touchpoints)

| Concern | Path |
|---------|------|
| Launchpad tiles | `src/lib/navigation/launchpad.ts` |
| Sidebar IA | `src/lib/navigation/modules.ts` |
| UA/UC workflow profile | `src/lib/services/workflow.ts`, `src/lib/services/events.ts` |
| Site visits | `src/lib/services/site-visits.ts`, `src/app/app/site-visits/**` |
| LMRA | `src/lib/services/lmra.ts`, `src/app/app/lmra/**` |
| MIS | `src/lib/services/mis.ts`, `src/app/app/mis/page.tsx` |
| EHS Score | `src/lib/services/ehs-score.ts`, `src/app/app/ehs-score/page.tsx` |
| Permits | `src/lib/services/permits.ts`, `src/app/app/permits/**` |
| RBAC | `src/lib/services/rbac.ts`, `supabase/migrations/20260901000001_*` |
| Workflow status doc | `docs/WORKFLOW_ENGINE_STATUS.md` |
| Module map (partially stale) | `docs/EHS360_MODULE_MAP.md` |
