# EHS360

Production-oriented multi-tenant Environment, Health & Safety SaaS built with Next.js, TypeScript, Tailwind, shadcn-style UI, and Supabase (Auth, PostgreSQL, RLS).

## Experiences

- `/` — Marketing landing page
- `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email` — Auth
- `/onboarding` — Create org → site → invites → plan → dashboard
- `/admin` — SaaS Super Admin console
- `/app` — Customer EHS workspace

## Quick start

```bash
cp .env.example .env.local
# Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

npm install
npm run dev
```

Apply SQL migrations in `supabase/migrations` (in order) via Supabase SQL editor or CLI.

Promote a platform admin:

```sql
update public.profiles set is_platform_admin = true where email = 'you@example.com';
```

## Scripts

- `npm run dev` — local development
- `npm run build` — production build
- `npm run typecheck` — TypeScript
- `npm run lint` — ESLint
- `npm test` — Vitest

## Architecture docs

See `docs/` for ARCHITECTURE, DATABASE, TENANCY, RBAC, SUBSCRIPTION, MODULE_CATALOG, WORKFLOW, FIELD, SECURITY, and DEVELOPMENT_ROADMAP.
