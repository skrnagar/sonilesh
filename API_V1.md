# Public API v1

Base path: `/api/v1`

OpenAPI: `GET /api/v1/openapi`

## Auth

1. Session cookie (existing Supabase SSR session), or
2. Organization API key: `Authorization: Bearer ehs_live_…`

Keys are stored as SHA-256 hashes (`organization_api_keys.key_hash`). Prefix only is visible in the UI. Plaintext is shown once at creation.

Client-supplied `organization_id` query/body values are **ignored**. Tenant comes from the key or the session membership.

Entitlement: `public_api` (copied from `api_access`). Permission to mint keys: `api.manage`.

## Resources (GET list + GET by id)

- `/incidents` — `ehs_events`
- `/capa` — `capa_items`
- `/sites`
- `/projects`
- `/permits`
- `/training` — `training_assignments`

Query: `page`, `pageSize` (max 100), `sort` (allowlisted), `order`, `status`, `site_id`, `q`.

Cross-tenant IDs return **404**. Missing scope returns **403**.

Idempotency: `api_idempotency_keys` is ready for POST writes. This slice is read-heavy; inbound webhooks use delivery id dedupe instead.

Rate limit: in-process hook per organization per hour (`checkApiRateLimit`). Pair with existing `max_api_calls` entitlement for commercial limits.

Manage keys at `/app/settings/api`.
