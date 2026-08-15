# Tenancy Architecture

## Model

True multi-tenant SaaS: one platform instance, many independent organizations.

- A user (`auth.users` + `profiles`) may belong to **multiple** organizations.
- Membership is via `organization_members`.
- Roles are assigned per membership (`member_roles`), optionally scoped to a site.
- All tenant data is keyed by `organization_id`.

## Hierarchy (configurable depth)

```
Organization
  └── Business Unit (optional)
        └── Site
              └── Department
                    └── Location
              └── Project (can span departments)
```

Industry/terminology is organization-configurable via `organization_settings` — never hard-coded to one company.

## Isolation rules

1. RLS on every tenant table using `auth.uid()` → membership check
2. Service role used only for platform admin / system jobs with explicit audit
3. Storage paths include `organization_id`; policies enforce same isolation
4. Exports, search, realtime, and reports must filter by organization server-side
5. Cross-tenant reads are impossible through user-scoped clients

## Organization lifecycle

`pending` → `trial` → `active` → (`suspended` | `cancelled` | `churned`)

SaaS Admin may activate, suspend, extend trial, change plan — all audited.
