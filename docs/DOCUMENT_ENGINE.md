# Document control engine (Phase 11)

One controlled-document engine on `controlled_documents` + `document_versions`. Files live in the private `ehs-attachments` bucket and the generic `attachments` table. Other modules link with `document_links` (`source_type` + `source_id`) — including contractor documents — instead of a second file table.

**Not in scope:** public SDS/document URLs, per-module storage buckets, inventing extracted document text.

## Lifecycle

`draft → in_review → approved → published → distributed` plus `expired` / `obsolete`.

Published and superseded versions are immutable (trigger + service). Change means a new version.

## Surfaces

| Route | Role |
|---|---|
| `/app/documents` | Dashboard + register |
| `/app/documents/new` | Create draft |
| `/app/documents/[id]` | Versions, approval, ack, distribution, links |

## Entitlements

Feature `document_control` (metric alias `documents`). Permissions: `documents.view/manage/create/update/approve/acknowledge/configure`.
