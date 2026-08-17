# Applicability Engine

`src/lib/compliance/applicability.ts` evaluates **JSON configuration** against an organization (or site) profile.

## Contracts

- **Marketing / sample:** `SAMPLE_OBLIGATIONS` — used by `/resources/brsr-applicability`. Do not break this set.
- **App:** `compliance_obligations.applicability_rules` (and snapshots on legal-register rows). Tenant data, not the sample library.

Empty rules still mean “baseline / universal in this library.”

## Configured predicates (not statute switches)

Shorthand keys (kept for existing sample + seed rows): `is_listed`, band minimums, `sector_in` / `industry_in`, `waste_stream_in`, `exports_to_eu`, `ccts_sector`.

Jurisdiction-aware keys stored in the same JSON: `country_in`, `jurisdiction_in`, `site_type_in`, `state_in`.

Generic `conditions[]`: `{ field, op, value }` with ops `eq`, `neq`, `in`, `contains_any`, `gte_band`, `gte`, `lte`, `truthy`, `falsy`.

The evaluator does not contain an India-only branch. A rule with `country_in: ["IN"]` is data. A profile without that country does not match.

## History

`applicability_snapshots` records each evaluation. Completed `compliance_assessments` keep `rules_snapshot` and `profile_snapshot` and are not updated when live rules change.

This is not legal advice. Matching a rule is not a determination that a statute applies in court or before a regulator.
