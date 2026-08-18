# Analytics architecture

Phase 13 adds an **executive analytics layer** on top of existing EHS modules. It does **not** copy incidents, CAPA, permits, or filings into a second facts database.

## Query path

1. `buildAnalyticsContext` loads organization timezone, fiscal-year start month, member scopes, and accessible sites.
2. Centralized services compute KPIs:
   - `getIncidentMetrics`
   - `getRiskMetrics`
   - `getPermitMetrics`
   - `getInspectionMetrics`
   - `getAuditMetrics`
   - `getCAPAMetrics`
   - `getTrainingMetrics`
   - `getContractorMetrics`
   - `getComplianceMetrics` (same overdue-filing definition as `/app/executive/compliance`)
   - `getWorkforceReadinessMetrics`
3. `collectControlTower` composes those services for `/app/executive` and `/app/analytics/*`.

Every dashboard that shows these KPIs must call the functions above. Do not re-count `ehs_events` in a page.

## Config tables (not facts)

| Table | Role |
|---|---|
| `metric_definitions` | Catalog + formula notes (leading/lagging) |
| `metric_targets` | Optional targets |
| `dashboard_definitions` / `dashboard_widgets` / `dashboard_layouts` | Role defaults + ordered widgets |
| `saved_views` | Named filter sets |
| `analytics_snapshots` | Optional cache payload |
| `benchmark_definitions` | Internal targets only — never marketed as industry rates |
| `report_schedules` | Cadence metadata (delivery not implemented) |
| `analytics_alerts` | Dedup key `(organization_id, source_type, source_id, alert_type)` |
| `workforce_hours` | Entered denominator |

## Time

Periods are civil days in `organizations.timezone` (default Asia/Kolkata). Fiscal year uses `organization_settings.fiscal_year_start_month` (default 4). UTC is only the storage instant.

## Cache

If you add caching, keys must include `organizationId`, `userId`, range, and accessible site ids (`analyticsCacheKey`). Never share a snapshot across tenants.

## Entitlements

- `advanced_analytics` — module analytics
- `executive_analytics` — Control Tower (plan grants copied from `advanced_analytics`, not from hard-coded plan names)
- `scheduled_reports` — already in the catalog; schedules persist even though email dispatch is not built

Writes go through `requireModuleAccess` / `analytics.manage`. Frontend gates are UX only.

## Deferred

- Full drag-drop custom dashboards (Tableau-style)
- Email/WhatsApp delivery of `report_schedules`
- Phase 14 AI Copilot (do not add generative summaries)
