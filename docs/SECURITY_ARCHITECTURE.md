# Security architecture

Not a certification. Describes how isolation is implemented today.

## Trust boundaries

1. Browser — anon/publishable key only.
2. Next.js server — user JWT cookie + optional service role for admin/webhooks/ready.
3. Postgres RLS — the real tenant wall.
4. Storage RLS — object names `{organization_id}/...`.

## AuthN

Supabase Auth. Middleware refreshes the session on protected routes. `requireUser` / `requireOrgContext` re-validate on the server.

## AuthZ

- Customer: `organization_members` + `member_roles` + `permissions`.
- Platform: `profiles.is_platform_admin` + `platform_role` (`src/lib/auth/platform.ts`).
- Entitlements: `requireFeature` on writes. UI gates are not security.

Never authorize from a path parameter alone. Cookie org is intersected with memberships.

## Data

RLS enabled on all `public` tables (live audit). SECURITY DEFINER helpers (`is_org_member`, `next_event_number`) check membership. Do not put authorization in `raw_user_meta_data`.

## Secrets

Service role and webhook/cron secrets are server env vars. `CRON_SECRET` is required for `/api/internal/compliance-tick`. Rotate any key that ever appeared in a client bundle or git history (none found in tracked source this pass).

## Storage

Private bucket, signed download, signed upload tickets. Reject public object URLs in application code.

## Gaps

MFA policy flag is not enforced. SSO feature key is catalog-only. Anon EXECUTE on a trigger function is revoked in migration 00060 (pending live). Enable leaked-password protection in the Supabase Auth dashboard.
