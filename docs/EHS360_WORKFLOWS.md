# EHS360 Enterprise Workflows

**Purpose:** Document target state machines for core safety operations, mapped to current implementation and reference workflow patterns.  
**Source:** Repository code (`events.ts`, `capa.ts`, `permits.ts`), `_blueprint_extract/` blueprints, reference user guides (UA/UC, LMRA, MIS).

---

## Workflow engine status

| Capability | Current | Target |
|------------|---------|--------|
| Event status transitions | Hardcoded `TRANSITIONS` in `src/lib/services/events.ts` | DB-driven `workflow_definitions` |
| Workflow service | Stub `reporting_builtin_v1` in `src/lib/services/workflow.ts` | Generic engine with audit + notifications |
| CAPA transitions | Service methods in `capa.ts` | Same engine, CAPA module profile |
| Permit transitions | `permits.ts` status checks | PTW module profile |
| Approval routing | Role permissions only | Role + hierarchy scope + fallback approver |

### Current `EhsEventStatus` (all report types)

From `src/types/database.ts`:

```
draft → submitted → triage → investigation → capa → verification → approval → closed
                                                                              ↘ reopened → triage|investigation|capa
draft|submitted|triage → cancelled
```

Implemented in `canTransition()` / `transitionEhsEvent()` in `events.ts`.

---

## 1. UA/UC (Unsafe Act / Unsafe Condition)

### Reference workflow (4 steps)

Extracted from User Guide for UA and UC Reporting (domain pattern, not proprietary branding):

| Step | Actor | Action |
|------|-------|--------|
| 1 | Any user (employee or contractor) | Report UA/UC |
| 2 | Safety Officer | Allocate to responsible person |
| 3 | Assignee | Close after corrective action |
| 4 | Safety Officer | Final closure after compliance check |

### Current EHS360 mapping

| Step | Status | Implementation |
|------|--------|----------------|
| Report | `draft` → `submitted` | `unsafe_act` / `unsafe_condition` types in `REPORT_TYPE_META`; routes `/app/observations`, field report |
| Triage/allocate | `submitted` → `triage` | Generic transition; no dedicated allocate action |
| Assignee close | `triage` → `capa` or `verification` | Partial via CAPA link |
| Final closure | `approval` → `closed` | Requires `incidents.approve` permission generically |

### Target states

```
reported → allocated → action_in_progress → assignee_closed → final_closed
         ↘ cancelled
```

### Target transitions

| From | To | Actor | Permission |
|------|-----|-------|------------|
| — | reported | Reporter | `hazards.create` |
| reported | allocated | Safety Officer | `hazards.allocate` (new) |
| allocated | action_in_progress | Assignee | `hazards.update` (own/assigned) |
| action_in_progress | assignee_closed | Assignee | `hazards.close_assigned` (new) |
| assignee_closed | final_closed | Safety Officer | `hazards.final_close` (new) |
| * | cancelled | Safety Officer / Admin | `hazards.cancel` |

---

## 2. Incident (IR)

Blueprint workflow aligns with current `EhsEventStatus` — good reuse candidate.

### Current implementation

| Stage | Route / service |
|-------|-----------------|
| Create | `/app/incidents/new`, `/field/incident`, `createEhsEvent()` |
| Investigate | `/app/incidents/[id]/investigation`, `investigations` table |
| Classifications | LTI, Fatal, Unsafe Act, Unsafe Condition (`20260820000001`) |
| CAPA link | `createCAPAFromReport()` via `capa-bridge.ts` |
| Close block | `assertSourceClosable()` in `capa.ts` |

### Gaps vs reference

- No explicit Action Allocate step
- Force-close with justification (blueprint BR-001) not implemented

---

## 3. LMRA (Last Minute Risk Assessment)

### Reference workflow (2 steps)

| Step | Actor | Action |
|------|-------|--------|
| 1 | Site Engineer / Supervisor / Foreman | LMRA entry → submit |
| 2 | ESHO (Safety Officer) | Approve or reject |

### Current

- Field only: `/field/lmra` → `QuickCaptureForm` mode `lmra`
- No approve/reject workflow in app

### Target entity: `lmra_assessments`

```
draft → submitted → approved | rejected
```

---

## 4. Work Permit (PTW)

Blueprint: Request → Risk check → Pre-work checklist → Authorization → Active → Extension → Close-out → Closed.

**Current:** `permits.ts`, tables in `20260326000010`, `20260326000026`.

---

## 5. CAPA

```
Open → In Progress → Pending Verification → Verified/Closed
Overdue (derived) → Escalation
```

**Current:** `capa_items`, verify-by-other, source polymorphism. **Gap:** no overdue scheduler.

---

## 6. Site Visits (HSV / RSV / TSV)

**Not implemented.** Target table `site_visits` with role-gated create per permission matrix.

---

## 7. EHS MIS

**Not implemented.** Target: `mis_submissions` with Safety Officer create, BU EHS Head approve.

---

## 8. EHS Scorecard

**Not implemented.** Target: `ehs_score_periods`, dimensions, values with regional roll-up.

---

## Implementation priority

1. UA/UC allocate/final-close
2. LMRA entity + approval
3. Incident allocate + force-close audit
4. CAPA overdue job
5. Site visits, MIS, Scorecard
6. Generic workflow engine

Transition map location: `src/lib/services/events.ts` lines 16–27.
