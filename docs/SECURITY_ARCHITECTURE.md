# Security Architecture

## Controls

1. Supabase Auth (session cookies via `@supabase/ssr`)
2. Middleware protects `/app`, `/admin`, `/onboarding`
3. RLS on all tenant tables
4. Platform admin gated by `profiles.is_platform_admin`
5. Signed URLs for private storage
6. Server-side permission + entitlement checks
7. Append-only `audit_logs`
8. Input validation with Zod
9. No secrets in client bundles (service role server-only)

## Threat mitigations

| Threat | Mitigation |
|---|---|
| Cross-tenant data leak | RLS + org_id on every row |
| Privilege escalation | DB-driven permissions; no client trust |
| Broken access via UI hide | Server actions re-check |
| Attachment exfiltration | Private bucket + signed URL + org path |
