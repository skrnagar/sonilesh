# Permit to Work Engine (Phase 6)

Phase 6 delivers a **configurable Permit to Work (PTW) engine** that authorizes defined high-risk work for a defined period and location.

**Out of scope:** Inspections & Audits, duplicating Risk/JSA/JHA scoring, claiming PDF legal validity.

## Design principles

| Principle | Implementation |
|-----------|----------------|
| One engine | `permits` + related tables; types from `permit_types` |
| No risk math in PTW | Links `risk_assessment_id` / `jsa_id` / `jha_id` → Risk Engine |
| Configurable types | System seeds + org create/edit/deactivate |
| Server authority | Expiry, activation, checklist gates, cross-tenant FKs |
| Historical integrity | `permit_history`, extensions, suspensions, approvals immutable |

## Lifecycle (default transitions)

```
Draft → Requested → Under Review → Risk Review → Pre-Work Checklist
  → Approval Required → Approved → Active ⇄ Suspended
  → Extension Pending → Close-Out → Closed
```

Also: Rejected, Cancelled, Expired.

Transitions live in `PERMIT_TRANSITIONS` (`src/lib/services/permits.ts`) as **safe defaults** until the generic workflow engine replaces them. Do not treat the map as immutable org policy.

## Core tables

Migration `20260326000010_permits.sql` (base) + `20260326000026_ptw_engine_phase6.sql` (Phase 6).

- `permit_types`, `permit_type_fields`, `permit_templates`, `permit_checklist_templates`
- `permits`, `permit_workers`, `permit_approvals`, `permit_approval_rules`
- `permit_checklists`, `permit_checklist_items`
- `permit_isolations`, `permit_extensions`, `permit_suspensions`, `permit_closeouts`
- `permit_attachments`, `permit_comments`, `permit_history`

## Risk integration

Before approval/activation (when type requires it):

1. Linked RA/JSA/JHA exists in the **same organization**
2. Not retired/cancelled
3. Approved/active if `requires_approved_risk`
4. Site/project match if `match_risk_site`

Cross-tenant linkage is blocked by trigger `assert_permit_same_org` and service `validateLinkedRisk`.

## Surfaces

| Route | Purpose |
|-------|---------|
| `/app/permits` | Register + metrics |
| `/app/permits/new` | Create / save draft |
| `/app/permits/[id]` | Detail tabs |
| `/app/permits/[id]/closeout` | Close-out |
| `/app/permits/active` | Live board |
| `/app/settings/ehs/permit-types` | Type configuration view |
| `/field/permits` | Field list |
| `/field/permits/[permitNumber]` | Field detail (QR target) |

## Entitlements & permissions

- Feature: `permit_to_work`
- Permissions: `permits.view/create/update/submit/assign/review/approve/reject/activate/suspend/resume/extend/close/cancel/export/configure`

## Related docs

- [PTW_WORKFLOWS.md](./PTW_WORKFLOWS.md)
- [PTW_CONFIGURATION.md](./PTW_CONFIGURATION.md)
- [PTW_SECURITY.md](./PTW_SECURITY.md)
