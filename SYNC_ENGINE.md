# Sync engine

Pipeline (pure, then persist):

1. **validate** — `external_system`, `external_id`, entity type
2. **transform** — mapping rules (employee/dept/location/project → worker/department/site/project)
3. **dedupe** — `(organization_id, external_system, external_id)`
4. **authorize** — org from session/key, never from payload
5. **write** — `integration_sync_records`
6. **audit** — `audit_logs` + `integration_events` / error queue

Modes: `full` | `incremental` | `manual` | `scheduled`.

Incremental cursor: `updated_at` then `external_id`.

Jobs: `integration_sync_jobs`. Failures: `integration_errors` (open until `resolved_at`).

CSV/manual is the only **real** provider in this phase. Vendor `fetch()` returns empty records plus a sandbox/architecture note.
