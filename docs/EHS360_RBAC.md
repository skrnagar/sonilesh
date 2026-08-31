# EHS360 Enterprise RBAC

**Purpose:** Map reference permission matrix and blueprint roles to EHS360 RBAC tables.  
**Sources:** `20260326000007_seed_data.sql`, `SafetyApp-Permission-Matrix...xlsx`, blueprint Section 9.

---

## Current model

| Table | Purpose |
|-------|---------|
| `permissions` | Global codes (`code`, `module`, `action`) |
| `roles` | System roles + org-specific |
| `role_permissions` | Role ↔ permission |
| `member_roles` | Scoped assignment (`organization`, `business_unit`, `site`, `project`, `department`, `self`) |

**Runtime:** `src/lib/services/rbac.ts`, `requireModuleAccess()` in `org-context.ts`.

---

## System roles (seed)

`super_admin`, `tenant_admin`, `ehs_admin`, `ehs_manager`, `ehs_officer`, `site_manager`, `department_head`, `supervisor`, `employee` (default), `contractor`, `auditor`, `investigator`, `viewer`.

Plus: `compliance_officer`, `esg_officer`, `contractor_contact` from later migrations.

---

## Reference roles → EHS360 mapping

| Reference role | EHS360 equivalent |
|----------------|-------------------|
| Safety Officer | `ehs_officer` |
| User | `employee` |
| Site Engineer | `supervisor` or `site_engineer` (custom) |
| Section Incharge | `department_head` |
| Project Manager | `project_manager` (custom) |
| Regional Manager | `regional_manager` (custom) |
| BU EHS Head | `ehs_admin` / `ehs_manager` |
| Admin | `tenant_admin` |

---

## Module × Action (reference extract)

### UA/UC

| Action | Safety Officer | Employee | Others |
|--------|----------------|----------|--------|
| Create | Yes | Yes | Yes |
| Delete/Cancel | Yes | No | No |
| Action Allocate | Yes | No | No |
| Action Close | Yes | Yes (field roles) | Yes |
| Final Closure | Yes | No | No |

**EHS360 today:** `hazards.create/view/update` only.

### Incident (IR)

Safety Officer: create, delete, allocate, final closure. PM: delete. All field roles: create, close.

**EHS360 today:** `incidents.create/view/update/investigate/approve/export`.

### MIS

Safety Officer: create/edit/delete. BU EHS Head + Regional Manager EHS: approve.

**EHS360 today:** missing module and permissions.

### Scorecard

Safety Officer + Admin: create/edit/delete.

**EHS360 today:** missing.

### HSV / RSV / TSV

Create permissions vary by role level (Regional PM, Section Incharge, etc.).

**EHS360 today:** missing module.

---

## Proposed new permissions

- `hazards.allocate`, `hazards.close_assigned`, `hazards.final_close`, `hazards.cancel`
- `incidents.allocate`, `incidents.final_close`, `incidents.delete`
- `lmra.create`, `lmra.approve`
- `visits.hsv.create`, `visits.rsv.create`, `visits.tsv.create`, `visits.allocate`, `visits.final_close`
- `mis.create`, `mis.edit`, `mis.delete`, `mis.approve`
- `score.create`, `score.edit`, `score.delete`, `score.view`

---

## Visibility rules

- Employees: own + assigned
- Supervisors/dept: department scope
- Site/EHS manager: site scope
- EHS admin: organization
- Cross-site below manager: off by default

**Gap:** no region scope; assignee visibility not universal.

---

## Phase 2 deliverables

1. Forward migration with new permissions
2. Map to `ehs_officer`, `ehs_manager`, `employee`
3. Scope admin UI at `/app/settings/users`
4. Action gates on UA/UC, LMRA, MIS pages

See `docs/EHS360_ARCHITECTURE.md` Phase 2.
