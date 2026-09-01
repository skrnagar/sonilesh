# EHS360 Module Map — Enterprise Information Architecture

**Purpose:** Map the target enterprise sidebar / home IA to existing routes, services, and database tables.  
**Legend:** ✅ Implemented · ⚠️ Partial · ❌ Missing · 🔄 Wrong model (marketplace-first / flat nav)

---

## Target top-level navigation

| Nav group | User intent | Target home |
|-----------|-------------|-------------|
| **Home** | Role-based launch + KPIs | `/app/home` (new) |
| **Dashboard** | Operational KPIs | `/app/dashboard` |
| **Safety Operations** | Daily reporting & visits | UA/UC, Incidents, LMRA, Visits |
| **Risk & Control** | Proactive risk | Permits, Risk, JSA/JHA |
| **Assurance** | Verification | Checklists, Inspections, Audits, CAPA |
| **People** | Workforce | Training, Contractors, Toolbox |
| **Analytics** | Trends & drill-down | `/app/analytics/*` |
| **Reports** | Registers & exports | Report Hub |
| **AI Copilot** | Assistive intelligence | `/app/ai` |
| **Admin** | Config & hierarchy | Settings, org structure, RBAC |

Marketplace moves to **Admin → Integrations & templates** (not top-level).

---

## Home & Dashboard

| Module | Status | Routes | Services | Tables |
|--------|--------|--------|----------|--------|
| Persona home (tile launchpad) | ✅ | `/app/home` | `launchpad.ts`, RBAC filter | `dashboard_definitions` (Phase 13, when applied) |
| Operations dashboard | ⚠️ | `/app/dashboard` | `dashboard.ts`, `analytics/*` | `ehs_events`, `capa_items`, aggregates |
| Executive control tower | ⚠️ | `/app/executive`, `/app/executive/*` | `dashboard.ts` | Phase 13 analytics tables |
| Notifications | ✅ | `/app/notifications` | `notifications.ts` | `notifications` |

**Current state:** Phase 20 launchpad live with My Dashboard, EHS Operations grid, Reports, and AI Copilot sections.

---

## Safety Operations

| Module | Status | Routes | Services | Tables |
|--------|--------|--------|----------|--------|
| **UA/UC reporting** | ⚠️ | `/app/observations`, `/app/reports/new` (types), `/field/report` | `events.ts` | `ehs_events` (`unsafe_act`, `unsafe_condition` via `event_types`) |
| **Incidents** | ⚠️ | `/app/incidents`, `/app/incidents/new`, `/app/incidents/[id]`, `/app/incidents/[id]/investigation` | `events.ts` | `ehs_events`, `investigations`, `ehs_event_injuries` |
| **Near miss** | ⚠️ | `/app/near-misses`, `/field/near-miss` | `events.ts` | `ehs_events` |
| **Hazards** | ⚠️ | `/app/hazards`, `/field/hazard` | `events.ts` | `ehs_events` |
| **Safety observations (BBS/WSN)** | ⚠️ | `/app/observations` (`safety_observation`) | `events.ts` | `ehs_events` |
| **LMRA** | ⚠️ | `/field/lmra` only | `field.ts` → `events.ts` | Uses `ehs_events` or ad-hoc — **no dedicated LMRA table** |
| **HSV (Head Safety Visit)** | ❌ | — | — | — |
| **RSV (Regional Safety Visit)** | ❌ | — | — | — |
| **TSV (Team Safety Visit)** | ❌ | — | — | — |
| Reporting queue | ⚠️ | `/app/reporting/queue` | `events.ts` | `ehs_events` |
| New report wizard | ✅ | `/app/reports/new` | `events.ts`, `reporting/types.ts` | `ehs_events` |

### UA/UC reference workflow gap

Reference (User Guide UA & UC): **Report → Allocate (Safety Officer) → Close (assignee) → Final closure (Safety Officer)**.  
Current: generic event status machine (`draft` → `submitted` → `triage` → …) without allocate/final-closure actions.

---

## Risk & Control

| Module | Status | Routes | Services | Tables |
|--------|--------|--------|----------|--------|
| Risk assessments | ⚠️ | `/app/risk-assessments`, `/app/risk-assessments/[id]` | `risk.ts` | `risk_assessments`, `risk_hazards`, `risk_controls` |
| Risk register | ⚠️ | `/app/risk-register` | `risk.ts` | `risk_assessments` |
| JSA | ⚠️ | `/app/jsa` | `risk.ts` | `risk_assessments` (type) |
| JHA | ⚠️ | `/app/jha` | `risk.ts` | `risk_assessments` (type) |
| **Permit to Work** | ⚠️ | `/app/permits`, `/app/permits/new`, `/app/permits/[id]`, `/app/permits/active`, `/field/permits` | `permits.ts` | `permits`, `permit_types`, `permit_approvals`, `permit_extensions` |
| Chemicals / SDS | ⚠️ | `/app/chemicals/*` | `chemicals.ts` | `chemicals`, `chemical_sds` |
| MOC | ⚠️ | `/app/moc/*` | `moc.ts` | `moc_requests` |

---

## Assurance

| Module | Status | Routes | Services | Tables |
|--------|--------|--------|----------|--------|
| Checklists (templates) | ⚠️ | `/app/settings/ehs/checklists` | `checklists.ts` | `checklist_templates`, `checklist_questions` |
| Inspections | ⚠️ | `/app/inspections`, `/app/inspections/[id]`, `/field/inspection` | `checklists.ts` | `checklist_assignments`, `checklist_responses` |
| Audits | ⚠️ | `/app/audits`, `/app/audits/[id]` | `checklists.ts` | `checklist_assignments` (audit type) |
| Findings | ⚠️ | `/app/findings` | `checklists.ts` | `checklist_findings` |
| CAPA | ⚠️ | `/app/capa` | `capa.ts`, `capa-bridge.ts` | `capa_items` |
| Action items | ⚠️ | `/app/action-items`, `/field/actions` | `capa.ts`, `supporting.ts` | `action_items`, `capa_items` |
| PPE | ⚠️ | `/app/ppe`, `/field/ppe` | `ppe.ts` | `ppe_categories`, `ppe_issuances` |
| Documents | ⚠️ | `/app/documents/*` | `documents.ts` | `controlled_documents`, `document_versions` |

---

## People

| Module | Status | Routes | Services | Tables |
|--------|--------|--------|----------|--------|
| Training | ⚠️ | `/app/training`, `/field/training` | `supporting.ts` | `training_courses`, `training_assignments` |
| Contractors | ⚠️ | `/app/contractors/*`, `/contractor` | `contractors.ts` | `contractor_companies`, `contractor_workers`, Phase 10 extensions |
| Toolbox talks | ⚠️ | `/app/toolbox-talks`, `/field/toolbox` | `supporting.ts` | `toolbox_talks`, `toolbox_attendance` |

---

## Analytics

| Module | Status | Routes | Services | Tables |
|--------|--------|--------|----------|--------|
| Analytics hub | ⚠️ | `/app/analytics` | `analytics/*` | Aggregates from `ehs_events`, `capa_items` |
| Safety analytics | ⚠️ | `/app/analytics/safety` | `analytics/metrics.ts` | — |
| CAPA analytics | ⚠️ | `/app/analytics/capa` | `analytics/*` | `capa_items` |
| Site/project analytics | ⚠️ | `/app/analytics/sites`, `/app/analytics/projects` | `analytics/*` | `sites`, `projects` |
| Data quality | ⚠️ | `/app/analytics/data-quality` | `analytics/health-score.ts` | — |
| **EHS Scorecard** | ❌ | — | — | Proposed: `ehs_score_periods`, `ehs_score_entries` |
| **UA/UC analytics** | ⚠️ | Partial in dashboard charts | `dashboard.ts` | No dedicated UA/UC closure-rate KPIs |

---

## Reports

| Module | Status | Routes | Services | Tables |
|--------|--------|--------|----------|--------|
| Reports shell | ⚠️ | `/app/reports` | — | — |
| **Report Hub** (BI-style) | ❌ | — | `EHS_REPORTING_ENGINE.md` | `report_definitions` (proposed) |
| **EHS MIS (online)** | ❌ | — | — | Proposed: `mis_submissions`, `mis_periods` |
| Export routes | ⚠️ | `/app/permits/export`, `/app/contractors/export`, `/app/esg/brsr-report/export` | various | — |

---

## AI Copilot

| Module | Status | Routes | Services | Tables |
|--------|--------|--------|----------|--------|
| EHS Copilot | ⚠️ | `/app/ai`, `/field/ai` | `lib/ai/*` | Phase 14 `ai_conversations`, `ai_document_chunks` (when applied) |
| AI action approvals | ⚠️ | `/app/ai/actions` | `ai/suggestions.ts` | `ai_suggested_actions` (when applied) |
| Executive copilot | ⚠️ | `/app/executive/copilot` | `ai/agents/copilot.ts` | — |

---

## Admin & System

| Module | Status | Routes | Services | Tables |
|--------|--------|--------|----------|--------|
| Org settings | ✅ | `/app/settings/organization` | `organization.ts` | `organizations`, `organization_settings` |
| Business units | ✅ | `/app/settings/business-units` | `hierarchy.ts` | `business_units` |
| **Regions** | ❌ | — | — | Proposed: `regions` |
| Sites | ✅ | `/app/settings/sites` | `hierarchy.ts` | `sites` |
| Projects | ✅ | `/app/settings/projects` | `hierarchy.ts` | `projects` |
| Departments / locations | ✅ | `/app/settings/departments`, `/app/settings/locations` | `hierarchy.ts` | `departments`, `locations` |
| Users & roles | ⚠️ | `/app/settings/users` | `rbac.ts` | `member_roles`, `roles` |
| EHS config | ⚠️ | `/app/settings/ehs/*` | `reporting-config.ts` | `event_types`, `severity_levels`, `report_category_templates` |
| Billing / subscription | ✅ | `/app/settings/billing`, `/app/settings/subscription` | `entitlements.ts` | `subscriptions`, `plans` |
| Integrations | ⚠️ | `/app/integrations` | `integrations/service.ts` | Phase 16 integration tables |
| Import | ⚠️ | `/app/import` | `import/service.ts` | — |
| Marketplace | 🔄 | `/app/marketplace` | `integrations.ts` | `marketplace_catalog_items`, `marketplace_installs` |
| Platform admin | ✅ | `/admin/*` | `admin.ts` | Control plane tables |
| Compliance / ESG | ⚠️ (parallel track) | `/app/compliance/*`, `/app/esg/*` | `compliance.ts`, `esg.ts` | Many Phase 12/20 tables |

---

## Field app mapping

| Field route | Maps to module | Backend |
|-------------|----------------|---------|
| `/field/home` | Field home | — |
| `/field/report`, `/field/incident`, `/field/near-miss`, `/field/hazard` | Safety ops | `submitFieldReportAction` → `events.ts` |
| `/field/lmra` | LMRA (partial) | `QuickCaptureForm` mode `lmra` |
| `/field/permits` | PTW | `permits.ts` |
| `/field/inspection` | Inspections | `checklists.ts` |
| `/field/actions` | CAPA / actions | `capa.ts` |
| `/field/training` | Training | `supporting.ts` |
| `/field/toolbox` | Toolbox | `supporting.ts` |

Field tab bar: `src/components/field/field-tab-bar.tsx`. Roles: `src/lib/auth/field-roles.ts`, `resolveFieldRole()`.

---

## Current vs target sidebar (`APP_MODULES`)

**Today:** 58 entries in `src/lib/navigation/modules.ts` across 7 groups — includes marketplace-adjacent items (integrations, import), full compliance/ESG tree, duplicate permit links.

**Target reduction:**

1. **Home** — 1 entry (new)
2. **Safety Operations** — ~8 entries (UA/UC, Incidents, Near Miss, LMRA, Visits, Queue, New Report)
3. **Risk & Control** — ~6 entries
4. **Assurance** — ~6 entries
5. **People** — ~4 entries
6. **Analytics** — ~4 entries (+ Scorecard when built)
7. **Reports** — ~3 entries (+ MIS when built)
8. **AI Copilot** — 1–2 entries
9. **Admin** — collapsible settings (not 15+ flat links)

Compliance and ESG remain accessible but **collapsed** under optional enterprise add-ons — not mixed into daily safety ops nav for field-facing personas.

---

## File index (key paths)

| Concern | Path |
|---------|------|
| Module registry | `src/lib/navigation/modules.ts` |
| App sidebar | `src/components/layout/app-sidebar.tsx` |
| Workspace shell | `src/components/layout/workspace-shell.tsx` |
| Org context | `src/lib/auth/org-context.ts` |
| Report types | `src/lib/reporting/types.ts` |
| Event service | `src/lib/services/events.ts` |
| Server actions | `src/app/actions/*.ts` (40+ action files) |
| API v1 | `src/app/api/v1/[resource]/route.ts` |
| Migrations | `supabase/migrations/` (44 files) |
