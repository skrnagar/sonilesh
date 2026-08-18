# Executive Control Tower

Route: `/app/executive`  
Feature: `executive_analytics`  
Permission: `analytics.view`

## What it shows

- Filter bar: Today / week / month / quarter / FY / rolling windows / custom, plus site/project/BU/department (accessible sites only)
- Optional EHS Health with “How is this calculated?”
- Top cards from `collectControlTower` (real module counts)
- Deterministic period summaries (“Open CAPA increased 18%…”)
- Deduped alerts
- Data-quality flags
- Link to existing `/app/executive/compliance` (Phase 12 — not replaced)

## Related routes

| Path | Purpose |
|---|---|
| `/app/executive/critical` | Critical-tone KPIs + critical alerts |
| `/app/executive/report` | Print-to-PDF of the same metrics |
| `/app/executive/compliance` | Filings / licenses / assessments (Phase 12) |
| `/app/alerts` | Aggregated alerts |

Drill-through uses existing lists (`/app/capa`, `/app/incidents`, `/app/risk-register`, `/app/inspections`) with the same filter query string.

## Scope

Site-scoped roles never receive org totals that include other sites. Empty accessible-site lists yield empty aggregates.
