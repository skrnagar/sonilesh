# Role dashboards

Roles are the existing system roles. Phase 13 does not invent new ones.

| Roles | Default dashboard code | Surface |
|---|---|---|
| `tenant_admin`, `ehs_admin`, `ehs_manager`, `super_admin` | `executive_control_tower` | `/app/executive` and `/app/analytics/dashboards` |
| `site_manager`, `supervisor`, `department_head`, `ehs_officer`, `investigator` | `site_operations` | Site-scoped KPIs |
| `auditor`, `viewer`, `compliance_officer`, `company_secretary`, `esg_officer` | `assurance` | Findings, CAPA, residual risk, filings |
| `employee`, `contractor`, `contractor_contact` | `field_queue` | Personal work on `/field` (actions, permits, training). Field-only personas stay on `/field` and are not redirected into org totals. |

Widget types in this release: `kpi`, `trend`, `bar`, `table`, `heatmap`, `summary`, `health_score`. Layouts are ordered lists. **Drag-drop custom dashboards are deferred.**

`saved_views` stores named filters per user. Shared views are visible to other org members when `is_shared` is true.
