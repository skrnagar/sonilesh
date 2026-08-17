# Compliance Engine (Phase 12)

Statutory tracking is **configuration-driven**. Obligation rows and JSON applicability rules live in the database. Application code evaluates those rules; it does not encode Indian (or any) statutes as a switch.

This product does **not** provide legal advice and does not decide that a law applies unless a configured rule matches a tenant profile.

## What already existed

- Catalog: `compliance_domains`, `compliance_obligations` (JSON `applicability_rules`)
- Tenant: `org_compliance_profile`, `org_applicable_compliances`, `compliance_task_instances`, `compliance_evidence`
- Services: `src/lib/compliance/applicability.ts`, `src/lib/services/compliance.ts`
- UI: `/app/compliance/dashboard`, `/calendar`, `/tasks/[id]`, applicability profile

## What Phase 12 added

- Jurisdictions, regulations catalog, legal register, requirements, assessments (checklist-backed), regulatory licenses (not PTW), change-review workflow, applicability snapshots
- Entitlements: `regulatory_compliance` (existing), `legal_register`
- Assessments freeze `rules_snapshot` / `profile_snapshot`. Re-running applicability does not rewrite those rows.

## Engines reused (not duplicated)

- Checklists (Phase 7) for assessments (`checklist_type = compliance`)
- Findings → existing `checklist_findings`
- CAPA from findings (`source_module = compliance`)
- Evidence: `compliance_evidence` (optional `controlled_document_id`); expiry flags evidence, and only auto-marks non-compliant if `org_compliance_profile.auto_noncompliant_on_expired_evidence` is true (default false)

## Isolation

Every tenant query filters `organization_id` from the session org. URL org ids are not authorization. Site-assigned register rows are hidden from other sites unless org-wide (`site_id` null).

## Marketing

`SAMPLE_OBLIGATIONS` remains the public BRSR checker contract. The app evaluates tenant/catalog rules from the database.
