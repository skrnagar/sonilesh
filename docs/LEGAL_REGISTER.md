# Legal Register

The legal register is **organization-specific**. It is not a dump of national statutes and is not legal advice.

## Model

- `legal_register_entries` — assigned to an org, optionally a **site**
- `compliance_requirements` — actions under an entry, also site-scoped
- Catalog `regulations` / `jurisdictions` are metadata links, not engines

## Site isolation

Site A entries do not appear as Site B actions. Filtering uses `filterRegisterForSite`: a row is visible for a site if `site_id` is null (org-wide) or equals that site.

## Workflow

1. Add a register entry (catalog regulation optional).
2. Add requirements (optional checklist template).
3. Open an assessment (checklist engine).
4. Findings and CAPA stay on the existing engines.

## Entitlement

Feature `legal_register`. Permissions `legal_register.view` / `legal_register.manage`.
