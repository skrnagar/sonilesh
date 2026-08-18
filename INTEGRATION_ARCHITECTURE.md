# Integration architecture (Phase 16)

Provider-independent integration hub. Domain services (incidents, CAPA, risk) never import vendor SDKs.

## Tables

All org-scoped tables include `organization_id` and RLS (`is_org_member` / `has_org_permission`).

- `integrations` — platform catalog (nullable org for custom connectors)
- `integration_connections`
- `integration_credentials` — `secret_ref` + `encrypted_payload` (AES-256-GCM). Ciphertext is revoked from `anon`/`authenticated` SELECT.
- `integration_mappings`
- `integration_sync_jobs` / `integration_sync_records` (dedupe unique on `organization_id, external_system, external_id`)
- `integration_events`
- `integration_webhooks` / `integration_webhook_deliveries`
- `integration_errors`
- `integration_inbound_receipts`

Credentials require `INTEGRATION_ENCRYPTION_KEY`. Secrets are never returned to the browser.

## Connector maturity

| Code | Maturity | Notes |
| --- | --- | --- |
| `csv_manual` | **real** | First-party CSV/mapping pipeline. No vendor SDK. |
| `hrms_workday`, `hrms_successfactors`, `hrms_bamboohr` | **sandbox** | Not tested against live HRMS tenants. |
| `erp_sap`, `dms_sharepoint`, `notify_slack`, `notify_teams`, `calendar_google` | **sandbox** | Architecture adapters only. |
| `idp_oidc` | **architecture** | SSO stub. Use existing auth. |
| `iot_meters` | **architecture** | Does **not** emit live or fake meter data. |

Do not claim a vendor connector is production-ready until it has been tested against that provider.

## Hub UI

- `/app/integrations` — Available / Connected / Needs Attention / Failed
- `/app/integrations/monitoring` — jobs, error queue, webhook deliveries

Entitlement: `integrations` (copied from existing `hrms_integration` plan grants). Permission: `integrations.view` / `integrations.manage`.

## Custom domains

Architecture/docs only. Tenant branding applies inside `/app` via sanitized CSS variables. Marketing stays SONIL-branded.
