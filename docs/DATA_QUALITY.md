# Analytics data quality

The Control Tower and analytics pages surface gaps instead of filling them with invented numbers.

| Flag | Behaviour |
|---|---|
| Missing workforce hours | Counts still display. Rates (LTIFR/TRIR-style) are withheld. |
| No CAPA `verified_at` | “No effectiveness data available.” |
| Site-scoped training | Overdue training omitted so person-scoped rows are not treated as site totals |
| No inspections in scope | Completion card shows “—” / “No inspections” |
| Contractor scores | Average uses recorded scores only; missing scores are skipped |
| Empty site access | Aggregates are empty, not org-wide |

Enter hours at `/app/settings/analytics/targets`. Metric catalog: `/app/settings/analytics/metrics`.

Do not backfill hours, effectiveness, or industry benchmarks from marketing copy or demo assumptions.
