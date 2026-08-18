# KPI definitions

Source of truth: `metric_definitions.formula_notes` and `src/lib/analytics/metrics.ts`. Pages must not invent a second formula.

| Code | Class | Definition |
|---|---|---|
| `incident_count` | Lagging | `ehs_events` of type incident with `occurred_at` in the org-timezone period |
| `open_incidents` | Lagging | Those incidents still in workflow (`submitted`…`reopened`) |
| `critical_incidents` | Lagging | Severity rank ≥ 4 or code `critical` |
| `lost_time_injuries` | Lagging | `ehs_event_injuries.lost_time = true` on accessible incidents. **Count, not a rate** |
| `near_miss_count` | Leading | Near-miss events in period (reporting volume, not harm) |
| `uauc_count` | Leading | Unsafe act + unsafe condition events |
| `high_residual_risk` | Leading | Hazards with high/extreme/critical residual band, or L×C ≥ 15 |
| `open_capa` | Lagging | CAPA in `open`, `in_progress`, `pending_verification` |
| `overdue_capa` | Lagging | Open CAPA with `due_date` before org-local today (derived, not a status) |
| `capa_effectiveness` | Lagging | Verified share of closed-loop CAPA. If no `verified_at`: **No effectiveness data available.** |
| `inspection_completion` | Leading | Shared `inspectionCompletion` helper; cancelled excluded |
| `open_findings` | Lagging | Findings in `open` or `capa_linked` |
| `active_permits` | Leading | PTW in `active`, `authorization`, `approval_required` |
| `training_overdue` | Leading | Expired or past-due assignments. **Omitted from site-scoped totals** (person-scoped rows) |
| `contractor_score` | Lagging | Average of recorded `safety_score` values only |
| `compliance_overdue` | Lagging | Same as executive compliance: tasks due before today still open/in progress/overdue |
| `expired_licenses` | Lagging | `regulatory_permits` past `expires_on` |
| `workforce_hours` | Denominator | Sum of entered `workforce_hours`. Never estimated |

## Rates

LTIFR/TRIR-style rates require `workforce_hours` overlapping the period and scope. If hours are missing, show counts and the message that a rate was not calculated.

## Percent vs prior period

`percentChange(current, previous)`: if previous is 0 and current > 0, trend is `null` (no invented %). Summaries say “no prior-period baseline.”

## Composite EHS Health

Optional weighted 0–100 from overdue CAPA, critical incidents, training overdue, high residual risk, inspection completion, overdue filings. Missing components are omitted, not scored as zero. UI must include **How is this calculated?** Weights live in `organization_settings.analytics_health_config`. This score is never the only truth.
