# Contractor engine (Phase 10)

Workforce compliance for host organizations: register companies, prequalify via the **existing checklist engine**, assign access **per site/project**, and track documents, induction, and readiness.

This is not a second LMS, CAPA, risk, or document-control stack.

## Entitlement

Feature key: `contractor_management` (existing entitlement engine). URL `organization_id` is not authorization.

Permissions: `contractor.*`, `contractor_worker.*`, `contractor_document.*`, `contractor_access.*` (legacy `contractors.view` / `contractors.manage` still granted).

## Tables

Extends `contractor_companies`, `contractor_workers`, `contractor_documents` (00013). Adds contacts, categories, settings, invites, prequalification (+ versions), contracts, site/project assignments, worker assignments, inductions/records, assessments (FK to `checklist_assignments`), performance, status history, blacklist.

Storage: `ehs-attachments` at `{orgId}/contractors/{companyId}/...`.

## Surfaces

| Route | Role |
| --- | --- |
| `/app/contractors` | Register |
| `/app/contractors/new` | Wizard |
| `/app/contractors/[id]` | Tabs (workers, docs, prequal, contracts, assignments, …) |
| `/app/contractors/{dashboard,prequalification,contracts,assignments,inductions,assessments,performance,readiness}` | Registers |
| `/app/settings/contractors/categories` | Example categories + thresholds |
| `/contractor` | External portal shell |

## Rules

- Site A approval does not grant Site B.
- Requesters cannot self-approve access; document uploaders cannot self-verify.
- Prequal pass/conditional thresholds are org-configured — not hard-coded 80/60.
- PTW shows eligibility; blocking only if `ptw_enforce_readiness` is on.

Migration: `20260326000032_contractor_engine_phase10.sql`
