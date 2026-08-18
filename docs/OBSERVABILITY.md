# Observability

## Current

- `x-request-id` on middleware responses and JSON API helpers (`src/lib/http/api-response.ts`).
- `X-Content-Type-Options: nosniff` and CSP in `next.config.ts`.
- API errors: `{ ok: false, error: { code, message } }` — no stacks.
- Server actions still return `{ ok, error }` strings; they do not all emit request ids.
- `/api/health` and `/api/ready`.
- No in-app APM, OpenTelemetry, or PagerDuty.

## Target

1. Continue request ids; log `{ request_id, org_id, route, duration_ms, error_code }` on the server **without** payloads or secrets.
2. Send logs to the Vercel log drain you actually configure (do not invent a vendor here).
3. Alert on `/api/ready` 503 and webhook 401 spikes.
4. Do not log authorization headers, cookies, or file bytes.
