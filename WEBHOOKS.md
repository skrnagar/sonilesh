# Webhooks

## Outbound

Events: `incident.created`, `incident.updated`, `capa.created`, `capa.closed`, `permit.issued`, `training.completed`.

Signing: HMAC-SHA256 over `{timestamp}.{rawBody}`.

Header: `X-EHS-Signature: t=<unix>,v1=<hex>`

Deliveries are stored in `integration_webhook_deliveries` with:

- unique `(organization_id, webhook_id, idempotency_key)`
- retry schedule (`next_attempt_at`, exponential backoff)
- statuses: pending / retrying / delivered / failed / rejected

Worker: `POST /api/internal/integration-tick` (cron secret). Live HTTP delivery to customer URLs is architecture-ready; the tick currently advances retry state without claiming a production send path until a target is verified.

## Inbound

`POST /api/v1/webhooks/inbound/{connector}`

- Requires `X-EHS-Signature` and `X-EHS-Organization-Id`
- Replay window: 300 seconds
- Invalid/missing signature → 401
- Dedup: unique `(organization_id, external_system, external_id)` on `integration_inbound_receipts`
