# Multi-App Architecture

SONIL EHS360 runs as **one Next.js deployment** with **six independent product surfaces**. Each surface has its own layout shell, navigation config, loading/error boundaries, and code-split bundle — while sharing auth, tenant context, and Supabase data layer.

## App map

| App | URL prefix | Route group / folder | Who accesses |
|-----|------------|----------------------|--------------|
| **Marketing** | `/`, `/product`, `/solutions`, … | `src/app/(marketing)/` | Public, unauthenticated |
| **Platform Admin** | `/admin` | `src/app/admin/` | Platform staff (`requirePlatformAdmin`) |
| **Org Admin** | `/org-admin` | `src/app/org-admin/` | `tenant_admin`, platform staff |
| **EHS Workspace** | `/app/*` (except files paths) | `src/app/app/` | Org members with EHS roles |
| **Files & Data** | `/app/files`, `/app/documents`, `/app/import` | `src/app/app/files/` + shared pages | Users with `documents.view` / import perms |
| **Field** | `/field` | `src/app/field/` | Field-only roles, mobile capture |
| **Contractor** | `/contractor` | `src/app/contractor/` | Contractor portal roles |

### Route map (key paths)

```
/                          → Marketing (public)
/admin                     → Platform Admin dashboard
/admin/organizations       → Tenant control plane
/org-admin                 → Org Admin (redirects to /org-admin/general)
/org-admin/general         → Company profile, slug, domain
/org-admin/branding        → Colors, logo, terminology
/org-admin/team            → Team overview → links to /app/settings/users
/org-admin/plan            → Subscription & entitlements
/org-admin/data            → File policy, data export
/app/home                  → EHS Workspace home
/app/dashboard             → Operational dashboard
/app/incidents, /app/permits, … → EHS modules (workspace nav)
/app/files                 → Files & Data hub
/app/documents             → Document control (files shell)
/app/import                → Bulk import (files shell)
/app/settings/*            → EHS configuration (workspace shell)
/field                     → Field home (mobile shell)
```

Legacy redirects:

- `/app/settings/organization` → `/org-admin`

## Boundaries & access control

| Layer | Shared | Per-app |
|-------|--------|---------|
| Auth session | Supabase SSR, middleware cookie refresh | Login entry (`/login`, `/admin/login`, `/field/login`) |
| Tenant context | `requireOrgContext()`, org switcher | — |
| Authorization | RBAC permissions, entitlements | App-specific guards (`requirePlatformAdmin`, `requireOrgAdminAccess`, `requireModuleAccess`) |
| UI shell | `WorkspaceShell`, branding CSS vars | Sidebar nav config, title, loading skeleton |
| Data | `@/lib/services/*`, `@/app/actions/*` | Page composition only |

**Org Admin** is intentionally separate from **EHS Workspace settings** (`/app/settings/sites`, EHS config, etc.). Tenant branding/plan/domain live under `/org-admin`; operational EHS configuration stays in the workspace.

## Folder layout

```
src/
  app/
    (marketing)/          # Public site — no auth
    admin/                # Platform Admin
    org-admin/            # Org Admin portal
    app/
      layout.tsx          # Shell router (workspace vs files)
      files/              # Files hub + loading/error
      documents/          # Document control pages
      settings/           # EHS workspace settings
      …                   # EHS operational modules
    field/                # Field app
    contractor/           # Contractor portal
  components/
    layout/
      app-workspace-loader.tsx
      files-workspace-loader.tsx
      org-admin-workspace-loader.tsx
      app-sidebar.tsx
      files-sidebar.tsx
      org-admin-sidebar.tsx
      admin-sidebar.tsx
  lib/
    navigation/
      app-surfaces.ts     # Path → app detection
      platform-admin.ts   # /admin nav only
      org-admin.ts        # /org-admin nav only
      workspace.ts        # EHS workspace nav only
      files.ts            # Files app nav only
      launchpad.ts        # Launchpad tiles (workspace)
    auth/
      org-admin.ts        # requireOrgAdminAccess
      session.ts          # requirePlatformAdmin
      org-context.ts      # requireOrgContext
```

## Shell routing (performance)

The `/app` layout does **not** load one monolithic shell. It reads `x-ehs-pathname` (set by middleware) and picks:

```tsx
// src/app/app/layout.tsx
if (isFilesAppPath(pathname)) {
  return <FilesWorkspaceLoader>{children}</FilesWorkspaceLoader>;
}
return <AppWorkspaceLoader>{children}</AppWorkspaceLoader>;
```

**Files app paths** (`src/lib/navigation/app-surfaces.ts`):

- `/app/files`
- `/app/documents` (+ subroutes)
- `/app/import`

This avoids loading the full 40+ module workspace sidebar when viewing documents or imports.

## Navigation code splitting

| Config file | Loaded by | Module count |
|-------------|-----------|--------------|
| `platform-admin.ts` | `/admin` layout only | ~12 items |
| `org-admin.ts` | `/org-admin` layout only | 6 items |
| `workspace.ts` | EHS workspace sidebar | ~45 items |
| `files.ts` | Files sidebar | 4 items |
| `field/nav.ts` | Field layout only | 5 tabs |

Previously, `modules.ts` exported admin + workspace nav together; sidebars now import only their slice. `modules.ts` re-exports for backward compatibility.

## Suspense & white-screen prevention

Each app surface has:

| Surface | Layout fallback | Page fallback | error.tsx |
|---------|-----------------|---------------|-----------|
| Platform Admin | `WorkspaceShellFallback` | `admin/loading.tsx` | `admin/error.tsx` |
| Org Admin | `WorkspaceShellFallback` | `org-admin/loading.tsx` | `org-admin/error.tsx` |
| EHS Workspace | `WorkspaceShellFallback` | `app/loading.tsx` | `app/error.tsx` |
| Files & Data | (via workspace router) | `app/files/loading.tsx` | `app/files/error.tsx` |
| Field | inline skeletons | route `loading.tsx` | `field/error.tsx` |

Pattern: async server layout → `Suspense` → loader fetches auth/context → inner `Suspense` for page content.

## Middleware

`src/middleware.ts` matches protected prefixes and delegates to `updateSession()`:

- `/app/:path*`
- `/admin/:path*`
- `/org-admin/:path*`
- `/field/:path*`
- `/contractor/:path*`
- `/onboarding/:path*`

Unauthenticated requests redirect to the appropriate login (`/admin/login`, `/field/login`, or `/login` for org-admin and workspace).

Platform authorization for `/admin` is enforced in the admin layout (`requirePlatformAdmin`). Org admin authorization is enforced in `OrgAdminWorkspaceLoader` (`requireOrgAdminAccess`).

## Bundle / code-split wins

1. **Split nav configs** — Field, admin, org-admin, and files nav are not imported by unrelated layouts.
2. **Conditional workspace loader** — Files routes skip `AppSidebar` + full `ENTERPRISE_NAV` filter tree.
3. **Dedicated org-admin app** — Tenant admin UI at `/org-admin` does not mount workspace context switchers or notification inbox unless needed.
4. **Admin layout** — Uses `admin/loading.tsx` instead of workspace loading component.
5. **Route-level code splitting** — Next.js automatically splits per-page; isolating apps increases the chance users only download their surface’s JS.

## Shared libraries (do not duplicate)

Keep in `@/lib/`:

- `auth/*` — session, org context, RBAC
- `services/*` — Supabase data access
- `branding/validate.ts` — tenant CSS vars
- `supabase/*` — client/server/middleware

Keep in `@/components/ui/` and `@/components/shared/` — design system primitives.

## Adding a new app surface

1. Create `src/app/<prefix>/layout.tsx` with dedicated loader + sidebar.
2. Add nav config under `src/lib/navigation/<app>.ts`.
3. Add path to middleware matcher + `APP_SURFACES` in `app-surfaces.ts`.
4. Add `loading.tsx` and `error.tsx`.
5. Document access guard in this file.

## Related docs

- `docs/EHS360_ARCHITECTURE.md` — platform overview
- `docs/MARKETING_ARCHITECTURE.md` — public site
- `docs/SAAS_CONTROL_PLANE.md` — platform admin
- `docs/FIELD_EXPERIENCE.md` — field app
- `docs/CONTRACTOR_PORTAL.md` — contractor portal
