# SONIL EHS360

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

## Vercel production URL (platform 404)

A successful `next build` is **not** the same as a public hostname being assigned.

If the browser shows Vercel’s gray page:

```
404: NOT_FOUND
Code: NOT_FOUND
ID: bom1::…
```

that is **platform `DEPLOYMENT_NOT_FOUND`**, not the Next.js app 404. The request never reached `/`. Confirm with response header `x-vercel-error: NOT_FOUND` and `content-type: text/plain`.

GitHub (commit `df9549c`) reports the ready deployment as:

- Dashboard: [vercel.com/skrnagars-projects/sonilesh](https://vercel.com/skrnagars-projects/sonilesh)
- Hashed URL: `https://sonilesh-ghf8cq30g-skrnagars-projects.vercel.app`
- Project alias: `https://sonilesh-skrnagars-projects.vercel.app`
- Branch alias: `https://sonilesh-git-main-skrnagars-projects.vercel.app`

Those three hostnames **exist** (they 302 to Vercel SSO when Deployment Protection is on). **`https://sonilesh.vercel.app` is not assigned** and returns the platform 404.

### What to click in the Vercel dashboard

1. Open **[sonilesh → Deployments](https://vercel.com/skrnagars-projects/sonilesh)** and open the **Ready** production deployment for `main` / `df9549c`.
2. Copy **Visit** / the unique `*.vercel.app` URL from that deployment (not a guessed `sonilesh.vercel.app`).
3. **Settings → Domains**: add / assign **`sonilesh.vercel.app`** (and any custom domain) to this project, Production. If the name is on another empty Vercel project, remove it there first.
4. **Settings → General → Build & Development Settings**: Framework Preset **Next.js**, Root Directory **`.`** (empty / repo root). Do **not** set Output Directory to `.next` or `out`.
5. **Settings → Deployment Protection**: for a public marketing site, set Production to **None** (Standard Protection on Preview is fine). Until you do this, even the correct URL asks for Vercel login instead of serving `/` as HTTP 200.
6. On the Ready deployment, use **⋯ → Promote to Production** if Production still points at an older/failed deploy.

Set `NEXT_PUBLIC_APP_URL` to the hostname you actually assigned (no trailing slash), then Redeploy.

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
