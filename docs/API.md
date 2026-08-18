# HTTP API

EHS360 is primarily Server Components + Server Actions. There is **no** public `/api/v1` product API in this pass.

## Routes

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/health` | none | Liveness. `{ ok, data: { status } }`. No secrets. |
| GET | `/api/ready` | none | Config + cheap DB probe. 503 if not ready. |
| POST | `/api/billing/razorpay` | HMAC `x-razorpay-signature` | Updates subscription. Idempotent when `billing_webhook_events` exists. |
| POST | `/api/internal/compliance-tick` | `Authorization: Bearer $CRON_SECRET` | Applicability + reminders. |

All JSON errors from the helper use codes: `AUTH`, `FORBIDDEN`, `ENTITLEMENT_REQUIRED`, `VALIDATION`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMIT`, `NOT_CONFIGURED`, `INTERNAL`. Header `x-request-id` is echoed.

## Future `/api/v1`

If added later: session or org-scoped API keys, entitlement `api_access`, rate limits, never service_role in the browser.
