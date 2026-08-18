# RAG architecture

Operational rows (incidents, CAPA, permits, …) are **queried**, not blindly embedded.

## Hybrid plan

1. **Structured lookup** — existing module queries with org + permission filters.  
2. **Keyword** — `ilike` / `tsvector` on `ai_document_chunks` for *current* corpus rows.  
3. **Vector** — `ai_document_embeddings` when pgvector is enabled (live project: extension available, enabled in Phase 14 migration).

## Version awareness

- `ai_documents.is_current` must be true to retrieve.  
- Controlled documents are limited to `published` / `distributed` / `approved`.  
- Superseded versions are not returned as current.

## What is indexed

Only document-like sources: controlled documents, current SDS text, explicit uploads. Not every incident row.

## Deferred

Historical embedding backfill of all documents is not in this slice. `ai_index_metadata` records per-org index state for a later job.
