# ESG Engine

ESG holds **tenant-recorded** metrics, GHG rows, materiality, committee, and EPR. The product does not invent scores or fabricate metric values.

## Tables

Existing: `esg_metrics`, `ghg_emissions`, `materiality_assessment`, `esg_committee`, `epr_registrations`.

Added: `esg_metric_definitions` (catalog + org), `esg_metric_values` (append-only history), `esg_reporting_periods`.

Saving a metric upserts the current `esg_metrics` row **and** inserts a history row. Old period values are not rewritten by later definition changes.

## Dashboard

`/app/esg/dashboard` lists only metrics with a non-null recorded value. Missing catalog indicators stay blank.

## Entitlements

- `esg_reporting` (existing writes)
- `esg` (workspace / dashboard)

Permissions: `esg.view`, `esg.manage`, `esg.comment`.

Employee health & safety is computed from `ehs_events` when synced. It is an incident count unless hours-worked exist — not a generated TRIR.
