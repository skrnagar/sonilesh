# Workflow engine — current implementation status

**Last audited:** production hardening pass (P0/P1)

## Summary

EHS360 does **not** yet have a generic DB-driven workflow engine. Operational modules use **module-specific transition tables and services**.

| Layer | Status | Location |
|-------|--------|----------|
| Generic workflow API | **Stub** | `src/lib/services/workflow.ts` — returns `reporting_builtin_v1` |
| EHS events (incidents, UA/UC, etc.) | **Hardcoded** | `src/lib/services/events.ts` — `TRANSITIONS` map |
| UA/UC profile | **Partial** | `src/lib/services/workflow.ts` — step resolution + action gates |
| LMRA | **Dedicated service** | `src/lib/services/lmra.ts` + RLS/triggers |
| Site visits | **Dedicated service** | `src/lib/services/site-visits.ts` + RLS/triggers |
| MIS | **Dedicated service** | `src/lib/services/mis.ts` + RLS/triggers |
| CAPA | **Dedicated service** | `src/lib/services/capa.ts` |
| Permits | **Dedicated service** | `src/lib/services/permits.ts` |

## Hardcoded transitions (do not assume generic engine)

- `events.ts` — `TRANSITIONS: Record<EhsEventStatus, EhsEventStatus[]>`
- `site-visits.ts` — `SITE_VISIT_TRANSITIONS`
- LMRA — `draft → submitted → approved|rejected` (service + DB trigger)
- MIS — `draft → submitted → approved|rejected` (service + DB trigger)

## Future generic engine (NOT in scope for hardening pass)

1. `workflow_definitions` + `workflow_transitions` tables (org-scoped)
2. Permission + role gates per transition
3. Shared audit + notification hooks
4. Module adapters (UA/UC, incident, LMRA, visit, MIS, CAPA, permit)

Until then, **always enforce transitions in both service layer and RLS/DB triggers** for new modules.
