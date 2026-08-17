# Development

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Apply `supabase/migrations` to the linked Supabase project (SQL editor, CLI, or `node scripts/apply-migrations.mjs`).

Required env: `NEXT_PUBLIC_SUPABASE_URL`, anon/publishable key, `SUPABASE_SERVICE_ROLE_KEY` (server), `NEXT_PUBLIC_APP_URL`.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Next.js (Turbopack) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest |
| `npm run build` | Production build |
| `npm run seed:demo` | Create DEMO Auth users + tenant click-through rows |

## Demo accounts (internal test data — not customers)

These tenants exist so every major EHS module can be clicked through. They are **not** paying customers, **not** marketing social proof, and must not be described as SOC 2 / ISO / production MRR.

**Password (demo-only, local/test):** `Demo@12345`  
Override with env `DEMO_PASSWORD` if needed. Do not use this password in production.

**How to seed**

1. Apply migrations (includes `supabase/migrations/20260326000031_demo_seed.sql`).
2. In `.env.local` set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
3. Run `npm run seed:demo` (or `node scripts/seed-demo.mjs`). Idempotent.

Auth users cannot be created from SQL; the script uses the Supabase Admin API, then calls `seed_demo_content()`.

| Org | Email | Name | Role | App |
|---|---|---|---|---|
| SONIL POWER | `harish@demo.sonilpower.local` | Harish Sharma | EHS Manager (owner) | `/app` |
| SONIL POWER | `abhishek@demo.sonilpower.local` | Abhishek Patel | Site Supervisor | `/app` |
| SONIL POWER | `sunil@demo.sonilpower.local` | Sunil Verma | Permit Issuer | `/app` |
| SONIL POWER | `vikram@demo.sonilpower.local` | Vikram Singh | Field Technician | `/field` |
| Kavach Solar EPC (DEMO) | `priya@demo.kavachsolar.local` | Priya Iyer | EHS Manager (owner) | `/app` |
| Kavach Solar EPC (DEMO) | `anjali@demo.kavachsolar.local` | Anjali Rao | Site Supervisor | `/app` |
| Narmada ChemLog (DEMO) | `rohit@demo.narmadachemlog.local` | Rohit Menon | EHS Manager (owner) | `/app` |
| Narmada ChemLog (DEMO) | `meera@demo.narmadachemlog.local` | Meera Joshi | Field Technician | `/field` |

Login: `http://localhost:3000/login` (workspace) or `/field-login` (field). Each person belongs to **one** org — use Priya vs Harish to confirm tenant isolation.

**Sample rows (SONIL POWER is the full walkthrough tenant)**

Sites Pithampur + Indore, projects, incidents / near miss / hazard / observation, risk assessment + JSA, hot-work permit, inspection + audit, CAPA, notifications, training stub, contractor, toolbox talk, MoC, PPE, chemical, controlled document, compliance task, ESG metrics / GHG / BRSR draft. Kavach and Narmada have a thinner isolated set (site + event + permit or chemical).

A legacy single-user bootstrap remains at `scripts/bootstrap-demo.mjs` (`demo@ehs360.local`). Prefer `npm run seed:demo` for feature walkthroughs.

## Phases

See `docs/DEVELOPMENT_ROADMAP.md` (architecture → production, 12 phases). Current work is Phase 8–10. Do not start Phase 11 (AI) until reports and module CRUD are operational.

## Conventions

- App Router, TypeScript strict
- Domain logic in `src/lib/services`
- Auth helpers in `src/lib/auth/access.ts`
- No fake production data in UI — empty states until the database returns rows
- Seed data is for development/demo only

Promote a platform admin:

```sql
update public.profiles set is_platform_admin = true where email = 'you@example.com';
```
