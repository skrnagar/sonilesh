# AI tools

Tools wrap existing services. They never bypass workflow engines.

## Read (auth inside the wrapped service + extra AI gates)

| Tool | Engine |
|---|---|
| `query_incidents` / `get_incident` | `src/lib/events/queries.ts` |
| `query_risks` | `src/lib/services/risk.ts` |
| `query_permits` | `src/lib/services/permits.ts` |
| `query_inspections` / `query_audits` / `query_findings` | checklist assignments / findings |
| `query_capa` | `capa_items` |
| `query_training` / `query_certifications` | `training_assignments` |
| `query_contractors` | `contractor_companies` |
| `query_compliance` | `src/lib/services/compliance.ts` |
| `query_documents` | `src/lib/services/documents.ts` (current versions only) |
| `query_sds` | `src/lib/services/chemicals.ts` — no invented emergency procedures |
| `query_ppe` | PPE issuances / items |
| `query_moc` | `moc_requests` |
| `analytics_query` | `getDashboardSnapshot` (Phase 13 services if present) |
| `search_knowledge` | hybrid retrieval |

## Write (draft only)

`draft_capa`, `draft_action`, `draft_incident_summary`, `draft_investigation_notes`, `draft_risk_note`, `draft_document_summary`

Each inserts `ai_suggestions` with `AI_GENERATED`. Human approval at `/app/ai/actions` may then call `createCapa` / `createActionItem` / event comments.

## Never registered

`approve_permit`, `close_incident`, `close_capa`, `change_risk_rating`, `suspend_worker`, `suspend_contractor`, `approve_compliance`, `publish_policy`, `approve_moc`, `change_certification_validity`, `approve_suggestion`.
