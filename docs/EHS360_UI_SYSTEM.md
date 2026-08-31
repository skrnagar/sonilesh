# EHS360 Enterprise UI System

**Build on:** commit `aafb99e` (UI modernization).  
**Tokens:** `src/app/globals.css`, `docs/DESIGN_SYSTEM.md` (navy/teal SONIL brand).

---

## Problem

- 58 flat sidebar entries in `APP_MODULES` (`src/lib/navigation/modules.ts`)
- No persona tile home (reference platforms use module launchpad pattern)
- `/app/marketplace` visible — wrong metaphor for enterprise ops
- Role dashboards documented in `docs/ROLE_DASHBOARDS.md` but not routed

---

## Target shell

Reuse `WorkspaceShell`, `AppSidebar`, `ModuleShell` from `aafb99e`.

**New:** `/app/home` persona tile grid; grouped nav (Safety Operations first); region in context switcher; marketplace demoted to settings.

---

## Persona homes

| Persona | Route | Tiles |
|---------|-------|-------|
| Worker | `/field/home` or `/app/home` | Report UA/UC, incident, near miss, LMRA, my actions |
| Safety Officer | `/app/home` | UA/UC queue, LMRA approvals, reporting queue, allocate, CAPA overdue |
| PM / Site Manager | `/app/home` | Incidents, permits, visits, project CAPA |
| Corporate / BU EHS | `/app/executive` | MIS approval, scorecard, regional rollup |
| Executive | `/app/executive` | Control tower, trends, AI brief (INFERENCE labeled) |
| Auditor | `/app/home` | Registers, findings, evidence search |

---

## Nav groups (max ~12 visible)

1. Home  
2. Safety Operations (UA/UC, incidents, LMRA, visits, queue)  
3. Risk and Control  
4. Assurance  
5. People  
6. Analytics  
7. Reports  
8. AI Copilot  
9. Admin (collapsed; compliance/ESG as flyout)

Remove marketplace from primary nav.

---

## Phase 1 checklist

- [ ] `/app/home` tile grid by role
- [ ] Refactor `APP_MODULES` to `ENTERPRISE_NAV`
- [ ] Redirect default app entry to persona home
- [ ] Collapse compliance/ESG secondary nav
- [ ] UA/UC list with workflow action bar (allocate/final close)
- [ ] Context switcher UI for region (until Phase 2 migration)

**Exit:** Safety Officer reaches UA/UC queue in 2 clicks; sidebar not overwhelming.

---

## Components

| Reuse | New |
|-------|-----|
| `WorkspaceShell`, `KpiCard`, `ModuleShell`, `state-panels` | `ops-tile-grid`, `workflow-action-bar`, `status-badge` |

---

## Do not

- Copy reference platform branding or naming
- Use marketplace as home
- Show fake KPIs or customer logos

See `docs/EHS360_MODULE_MAP.md` for route mapping.
