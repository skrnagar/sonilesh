# RBAC Architecture

## Model

Configurable Role-Based Access Control stored in PostgreSQL:

```
permissions (code, module, action)
roles (organization_id nullable for system roles, code, name)
role_permissions (role_id, permission_id)
member_roles (member_id, role_id, site_id nullable, scope)
```

## Seeded system roles

Super Admin (platform), Tenant Admin, EHS Admin, EHS Manager, EHS Officer,
Site Manager, Department Head, Supervisor, Employee, Contractor, Auditor,
Investigator, Viewer

## Permission codes

Pattern: `{module}.{action}` e.g. `incidents.create`, `incidents.approve`, `capa.verify`, `admin.manage_users`

## Scope

| Scope | Meaning |
|---|---|
| `platform` | SaaS Super Admin only |
| `organization` | All sites in the org |
| `site` | Limited to assigned site_id |
| `department` | Limited to department |
| `own` | Own / assigned records |

## Enforcement

- Server-side helpers: `requirePermission(orgId, permission, opts?)`
- RLS helpers: `has_org_permission(org_id, permission_code)`
- UI hides actions but **never** is the sole control
