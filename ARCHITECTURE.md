# EHS360 Architecture

## Product

EHS360 is a production-grade multi-tenant Environment, Health & Safety SaaS platform serving independent organizations across EPC, construction, infrastructure, T&D, power, renewables, manufacturing, oil & gas, mining, logistics, facilities, and general enterprise EHS.

## Experiences

| Experience | Route | Audience |
|---|---|---|
| Marketing / Landing | `/` | Anonymous visitors |
| Auth | `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email` | All users |
| Onboarding | `/onboarding` | New organization owners |
| SaaS Administration | `/admin` | Platform Super Admin only |
| Customer EHS Workspace | `/app` | Tenant users |
| Field Experience | `/field` (responsive `/app` + mobile routes) | Field reporters |

## Stack

- **Frontend:** Next.js App Router, TypeScript, React, Tailwind CSS, shadcn/ui, Lucide, Recharts
- **Backend:** Supabase (PostgreSQL, Auth, Storage, RLS, Realtime)
- **Auth:** Supabase Auth (email/password; SSO-ready abstraction)
- **Authorization:** Database-driven RBAC + entitlement engine (never frontend-only)

## Layering

```
UI (App Router pages/components)
  → Server Actions / Route Handlers
    → Service layer (business rules, entitlements, RBAC)
      → Supabase client (user-scoped) or service role (platform admin audited paths)
        → PostgreSQL + RLS
```

## Core engines (shared, not duplicated per module)

1. **Tenancy** — `organization_id` on every tenant-owned row; RLS isolation
2. **RBAC** — roles, permissions, member_roles with org/site scope
3. **Entitlements** — plans → features/limits → org overrides → usage checks
4. **Workflow** — configurable state machines per record type
5. **CAPA** — polymorphic source linkage from any module
6. **Notifications** — event-driven in-app + email
7. **Audit** — append-only audit_logs for mutations and admin actions
8. **Reporting events** — shared engine for Incident / Near Miss / UA / UC / Hazard

## Design principles

- Never trust frontend filtering for security
- Never hard-code tenant logic, plan names, or permissions in business rules
- Soft-delete transactional data; deactivate master data
- UTC timestamps; site-local display
- Professional enterprise UX: high density, strong tables/filters, minimal decorative cards

## Phase map

1. Supabase foundation + auth + onboarding  
2. SaaS Administration  
3. Subscription + entitlement engine  
4. Customer EHS workspace shell + dashboard  
5. Incident / Near Miss / Hazard reporting engine  
