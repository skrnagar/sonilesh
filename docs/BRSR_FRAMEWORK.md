# BRSR framework

BRSR in EHS360 is a **reporting overlay** on tenant data. It is not SEBI filing, not XBRL, not assurance, and not legal advice.

## Catalog, not TypeScript questions

Framework structure lives in:

- `reporting_frameworks` (code `brsr`, versioned)
- `reporting_framework_sections`
- `reporting_framework_indicators`

Seed rows are **orientation metadata**. They are not official circular text and are not evaluated as hard-coded applicability.

The public BRSR checker still uses `SAMPLE_OBLIGATIONS` in `applicability.ts`. The in-app builder loads the database catalog.

## Coverage vs completeness

`computeIndicatorCoverage` / `brsrDataCoverage` count indicators that have a recorded value. The label states this is **not** legal completeness or a filing status. Missing values are not filled in.

## Entitlement

Feature `brsr`. Permissions `brsr.view` / `brsr.manage`. Existing ESG writes remain on `esg_reporting`.
