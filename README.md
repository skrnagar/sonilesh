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

## Vercel environment variables

Set these in the Vercel project (Settings → Environment Variables) for Production, Preview, and Development. The app also accepts the official Supabase aliases shown in `.env.example`.

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Project URL. Alias: `SUPABASE_URL`. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes* | Legacy anon / publishable key. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes* | Newer publishable key. Alias: `SUPABASE_PUBLISHABLE_KEY`. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (server) | Service role. Alias: `SUPABASE_SECRET_KEY`. Never expose as `NEXT_PUBLIC_*`. |
| `NEXT_PUBLIC_APP_URL` | Yes in production | Public site origin (your Vercel URL, no trailing slash). Used for auth redirects. |

\*Provide **either** `NEXT_PUBLIC_SUPABASE_ANON_KEY` **or** a publishable key (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_PUBLISHABLE_KEY`).

Optional: `NEXT_PUBLIC_APP_NAME`, `SUPABASE_JWKS_URL`, `SUPABASE_PROJECT_REF`.

After changing env vars, redeploy so the Next.js build picks up `NEXT_PUBLIC_*` values.

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
