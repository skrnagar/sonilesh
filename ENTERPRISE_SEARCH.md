# Enterprise search

Route: `/app/search`

Entitlement: `enterprise_search`. Permission: `search.use`.

## Security

Organization (and optional site) filters run **before** keyword matching. Rows from other tenants never reach the client.

Keyword + structured queries against existing tables:

- `ehs_events`
- `capa_items`
- `sites`
- `controlled_documents`

## Semantic / pgvector

Optional. Phase 14 embeddings (`ai_document_chunks`) are used by the copilot retrieval path when present. This search UI does not fail if embeddings are missing.

Do not dump unbounded result sets: queries are limited (25 per source, 50 total).
