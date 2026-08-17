# Expiry aggregator (Phase 11)

`/app/compliance/expiry` unions upcoming/expired dates from:

- controlled documents (`expires_on` / `review_due_on`)
- current SDS (`chemical_sds.expires_on`)
- issued PPE (`ppe_issuances.expires_on`)
- contractor document metadata (`contractor_documents.expires_on`) — files stay on the contractor engine
- training assignments (`expires_at`) when present

Warning window is `organization_settings.expiry_warning_days` (default 30, range 1–365). It is **not** a hard-coded product rule of 30 days.
