# Analytics security

## Tenant isolation

All new tables have RLS. Select is `is_org_member(organization_id)` (or system rows with `organization_id is null` for catalogs). Mutations require `analytics.manage` except saved views (owner) and layouts (owner).

Services always filter `organization_id` in the query. Unit tests assert foreign-org rows are dropped before aggregation.

## Site / scope isolation

RLS on operational tables is org-member based. **App-layer scope is mandatory** for analytics:

- `getUserScope` + `resolveAccessibleSiteIds`
- Site-scoped members only aggregate rows for those sites
- Requested `siteId` outside access yields an empty set, not a silent org total

## Entitlements

`executive_analytics` and `advanced_analytics` are feature codes resolved through the existing entitlement engine. Plan grants for executive analytics are copied from whatever plans already have advanced analytics — no plan-name list in SQL or UI.

## No arbitrary SQL

There is no endpoint that executes user-supplied SQL. Saved views store JSON filters only.

## No generative AI

Summaries are deterministic string templates. Do not call a model from these routes.

## Cache

Tenant-aware keys only (`organizationId` + `userId` + scope). Snapshots in `analytics_snapshots` are per organization.

## Field chrome

Do not put org-wide Control Tower tiles on `/field`. Field workers keep personal queues (`/field/actions`, permits, training).
