# Management of Change engine (Phase 11)

Extends `moc_requests`. Lifecycle:

`requested → risk_review → approval → implementation → post_change_verification → closed` (or `cancelled`).

- Risk: existing `risk_assessments` in the **same organization** only (`validateMocLinkedRisk` + DB trigger).
- Actions: CAPA (`source_module = moc`).
- Documents: `document_links` (`source_type = moc`).
- Training: optional `training_course_id` / assignment when Phase 9 tables exist.

## Surfaces

| Route | Role |
|---|---|
| `/app/moc` | Dashboard + register |
| `/app/moc/new` | Create |
| `/app/moc/[id]` | Lifecycle, impact, risk, CAPA, docs |

Feature: `moc`. Permissions: `moc.view/manage/create/approve/implement/verify`.
