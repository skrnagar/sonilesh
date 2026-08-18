# Marketplace (no payments)

Route: `/app/marketplace`

Catalog tables: `marketplace_catalog_items`, `marketplace_installs`.

Kinds: `template` | `connector` | `app`.

**Install** attaches a catalog item to the organization (entitlement/template metadata). There is no checkout, invoice, or payment provider.

Entitlement: `marketplace`. Permissions: `marketplace.view` / `marketplace.install`.

Install still checks the item's `feature_code` against the existing entitlement engine. Plan names are not hard-coded.
