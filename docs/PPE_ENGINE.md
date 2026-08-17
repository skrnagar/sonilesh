# PPE engine (Phase 11)

Extends `ppe_categories`, `ppe_items`, `ppe_requirements`, `ppe_issuances`. Inspections reuse the checklist engine (`checklist_type = ppe`) via `ppe_inspections.assignment_id`.

Seeded categories are **examples only**, not a regulatory catalogue.

Issue respects member **site scope** (`member_roles.scope/site_id`). Org-wide roles may issue anywhere; site-scoped roles cannot issue another site’s stock.

## Surfaces

| Route | Role |
|---|---|
| `/app/ppe` | Inventory, issue/return, inspection |
| `/field/ppe` | PPE issued to the signed-in user |

Feature: `ppe_management` (alias `ppe`). Permissions: `ppe.view/manage/issue/inspect/return`.
