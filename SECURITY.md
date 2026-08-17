# Security

## Tenant isolation

- RLS on tenant tables; policies use `is_org_member(organization_id)`.
- Never trust `organization_id` from the client without membership checks.
- Service role is limited to platform-admin and webhook/worker paths; those writes go through `audit_logs`.

## Auth

- Supabase Auth (email/password). Sessions via `@supabase/ssr` cookies.
- Middleware protects `/app`, `/admin`, `/field`, `/onboarding`.
- `/admin` requires `is_platform_admin`. Field-only roles cannot use `/app`.

### Leaked password protection (HaveIBeenPwned)

This cannot be enabled in SQL or via the database linter. It is an Auth dashboard setting (Pro plan and above). Until it is toggled on, advisor `auth_leaked_password_protection` will remain.

To enable it on the live **sonilesh** project:

1. Open [Authentication → Providers → Email](https://supabase.com/dashboard/project/sqybbygfksnjvmatiafm/auth/providers?provider=Email).
2. Under **Password** / **Password strength**, enable **Leaked password protection** (HaveIBeenPwned.org Pwned Passwords).
3. Save. New sign-ups and password changes will reject known-compromised passwords.

Do not assume this is on until that toggle is confirmed in the dashboard.

## Authorization

Permission checks belong on the server (`requirePermission`, `requireFeature`, `requireModuleAccess`). Nav hiding is not a control.

## Secrets

- No secrets in source. Use `.env.local` / host env.
- `SUPABASE_SERVICE_ROLE_KEY` must never be `NEXT_PUBLIC_*`.

## Attachments

Store files in Supabase Storage under `{organization_id}/...`. Metadata in `attachments` (tenant-scoped).

See also `docs/SECURITY_ARCHITECTURE.md`.
