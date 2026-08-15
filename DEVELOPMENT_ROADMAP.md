# Development Roadmap

| Phase | Focus | Status |
|---|---|---|
| 0 | Architecture docs | Done |
| 1 | Supabase foundation, auth, onboarding, RBAC | In progress |
| 2 | SaaS Administration | Queued |
| 3 | Subscription + entitlements | Queued |
| 4 | Customer workspace + dashboard | Queued |
| 5 | Incident / Near Miss / Hazard engine | Queued |
| 6+ | Remaining EHS modules, integrations, hardening | Future |

## Local run

```bash
cp .env.example .env.local
# Fill Supabase keys
npm install
npm run dev
# Apply migrations in Supabase SQL editor or via CLI
npm run typecheck
npm run lint
npm test
```
