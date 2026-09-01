# Organization Admin Portal

Tenant-level administration for EHS360 customers. Distinct from the **platform** SaaS control plane at `/admin` (staff-only).

## Route decision

| Portal | Path | Audience |
| --- | --- | --- |
| **Organization admin** (this doc) | `/org-admin/*` (aliases under `/app/settings/organization/*`) | `tenant_admin`, platform staff |
| Platform SaaS admin | `/admin/*` | `platform_admin` / `super_admin` |
| EHS configuration | `/app/settings/*` (other routes) | `settings.manage` (e.g. `ehs_admin`) |

Organization admin lives at `/org-admin` with a dedicated workspace shell (`OrgAdminWorkspaceLoader`). Legacy paths under `/app/settings/organization/{general,branding,...}` redirect to the canonical routes.

## What exists today (foundation)

### Routes

| Section | Path | Description |
| --- | --- | --- |
| General | `/general` | Name, slug, legal profile, contact, custom domain + DNS instructions |
| Branding | `/branding` | Logo URL, primary/secondary colors, terminology labels |
| Team | `/team` | Member list, invite, role/scope changes, deactivate |
| Team invite | `/team/invite` | Token-based invitation flow |
| Access | `/access` | System roles and permission matrix (read-only) |
| Plan | `/plan` | Current plan, entitlements, usage bars, upgrade placeholders |
| Data | `/data` | Export request placeholder, file upload policy |
| Advanced config | `/configure` | Regional, hierarchy, EHS, notifications, security (`settings.manage`) |
| Structure | `/structure` | Visual hierarchy tree (`settings.manage`) |

Shell: `OrgAdminSidebar` + `WorkspaceShell` — responsive sidebar (General, Branding, Team, Access, Plan, Data).

### Auth

- `requireOrgAdminAccess()` in `src/lib/auth/org-admin.ts`
- Permits: `profiles.is_platform_admin` **or** active membership with `tenant_admin` role
- Layout: `src/app/org-admin/layout.tsx` → `OrgAdminWorkspaceLoader`

### Server actions

`src/app/actions/org-admin.ts`:

- `updateOrgGeneralAction` — profile + slug + `custom_domain`
- `updateOrgBrandingAction` — branding JSON + `logo_url`
- `updateFilePolicyAction` — `organization_settings.settings.file_policy`
- `requestDataExportAction` — audit log + redirect (export pipeline TBD)

Existing team actions remain in `src/app/actions/hierarchy.ts` (`inviteUserAction`, `assignMemberScopeAction`, `updateMemberStatusAction`).

### Schema

Migration `20260902000002_org_admin_portal.sql`:

- `organizations.custom_domain` (unique, nullable)
- File policy stored in `organization_settings.settings` JSON:

```json
{
  "file_policy": {
    "upload_roles": ["tenant_admin", "ehs_manager", "ehs_officer"],
    "retention_note": "..."
  }
}
```

Pre-existing columns used:

- `organizations`: `name`, `slug`, `logo_url`, `legal_name`, `industry`, `company_size`, address fields
- `organization_settings.branding` JSON: `primaryColor`, `secondaryColor`, `logoUrl`, `terminology`

## What existed before this phase

| Area | Status |
| --- | --- |
| Monolithic org settings page | Replaced by portal sections + `/configure` |
| Users at `/app/settings/users` | Still available; team section duplicates for org admins |
| Subscription at `/app/settings/subscription` | Still available; plan section summarizes for admins |
| Billing at `/app/settings/billing` | Plan upgrade CTA links here |
| RBAC / RLS | Full system roles in `roles` + `permissions`; tenant isolation via RLS |
| Entitlements engine | `src/lib/entitlements/engine.ts` — used on Plan page |
| Billing provider | `src/lib/billing/provider.ts` — `ManualBillingProvider` only |
| Platform admin | `/admin/organizations`, `/admin/plans`, `/admin/entitlements`, etc. |

## Gaps / future phases

1. **Custom domain routing** — store domain only; edge middleware + SSL provisioning not implemented
2. **Logo upload** — URL field only; Supabase Storage direct upload not wired
3. **Data export** — audit event only; no background job or download bundle
4. **File policy enforcement** — stored in settings; API upload guards should read `file_policy`
5. **Billing checkout** — Razorpay route stub exists; live payment + webhooks incomplete
6. **Per-org custom roles** — only system roles (`organization_id is null`) shown
7. **SSO / SCIM** — enterprise integration tables exist; no org-admin UI
8. **Custom workflows / white-label** — entitlements include `custom_branding`; full white-label TBD

## Related docs

- [SAAS_CONTROL_PLANE.md](./SAAS_CONTROL_PLANE.md) — platform `/admin`
- [EHS360_RBAC.md](./EHS360_RBAC.md) — permissions model
- [BILLING_ARCHITECTURE.md](./BILLING_ARCHITECTURE.md) — billing abstraction
