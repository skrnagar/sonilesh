# Field Microservices Architecture

The field app (`/field`) is a **single Next.js route tree** composed of **independent module services**. Each service owns its routes, permissions, data loaders, and UI entry points — similar to microservices inside the monorepo.

## Principles

1. **One module = one service** — aligned with RAKSHA launchpad tiles (except shared `actions` tab).
2. **Shared platform layer** — auth (`requireOrgContext`), RBAC (`canFieldAction`), and Supabase clients stay in `@/lib/auth` and `@/lib/services`.
3. **No cross-service imports in pages** — field pages import from `@/lib/field/services/<module>` or the registry, not from sibling module internals.
4. **Code splitting** — heavy client panels load via `dynamic()` wrappers under `@/components/field/*-lazy.tsx`.
5. **Route-level loading** — every field route has `loading.tsx` using `FieldPageSkeleton`.

## Service registry

| Service key | Label | Routes | Field action |
|-------------|-------|--------|--------------|
| `home` | MY ZONE | `/field`, `/field/home` | `my_zone` |
| `reports` | Report | `/field/reports` | `raksha_reports` |
| `uauc` | UA/UC/WSN | `/field/ualist`, `/field/ua-uc` | `report_hazard` |
| `incident` | INCIDENT | `/field/incident`, `/field/near-miss` | `report_incident` |
| `site-visits` | Site Visits | `/field/site-visits` | `site_visit` |
| `utilities` | UTILITIES | `/field/utilities` | `utilities` |
| `training` | TRAINING | `/field/training` | `training` |
| `ehs-mis` | EHS MIS REPORT | `/field/mis` | `ehs_mis` |
| `ehs-score` | EHS SCORE CARD | `/field/ehs-score` | `ehs_score` |
| `checklist` | CHECKLIST | `/field/inspection`, `/field/checklist`, `/field/nc` | `inspection` |
| `lmra` | LMRA | `/field/lmra` | `lmra` |
| `permits` | WORK PERMIT | `/field/permits` | `my_permits` |
| `bbs` | BBS | `/field/bbs` | `bbs` |
| `actions` | Actions | `/field/actions` | `my_actions` |

Registry: `src/lib/field/services/registry.ts`

```ts
import { resolveFieldService, uaucService } from "@/lib/field/services";

const service = resolveFieldService("/field/ualist"); // → uaucService
```

## Folder layout

```
src/
  app/field/                    # Route tree (one URL prefix)
    layout.tsx                  # Shared shell — header, tab bar, Suspense
    page.tsx                    # home service entry
    reports/                    # reports service
    ualist/                     # uauc service
    actions/                    # actions service
    …
  lib/field/
    services/                   # Microservice boundaries (this doc)
      registry.ts
      home.ts
      reports.ts
      uauc.ts
      …
    demo-fallback.ts            # Demo tenant preview rows
    nav.ts                      # Tab bar only (5 items)
  components/field/
    field-ui.tsx                # Design tokens + primitives
    *-lazy.tsx                  # dynamic() wrappers for heavy panels
  lib/navigation/
    raksha-launchpad.ts         # 17 launchpad tiles (field + web)
```

## Adding a new field module

1. Create `src/lib/field/services/<key>.ts` with `FieldServiceModule` metadata.
2. Register in `registry.ts`.
3. Add route under `src/app/field/<path>/` with `page.tsx` + `loading.tsx`.
4. Add launchpad tile in `raksha-launchpad.ts` if user-facing.
5. Guard with `canFieldAction(role, service.fieldAction)`.
6. Document in this file.

## Performance checklist

- [ ] Page uses `Promise.all` for independent server fetches
- [ ] Heavy client component behind `dynamic()` lazy wrapper
- [ ] `loading.tsx` present on the route
- [ ] List panels use `React.memo` for row components when >50 rows possible
- [ ] Demo fallback only when `isDemoOrg(slug)` and live data is empty

## Related docs

- `docs/MULTI_APP_ARCHITECTURE.md` — field app in the six-surface map
- `docs/FIELD_EXPERIENCE.md` — field UX and Raksha parity
- `DEVELOPMENT.md` — demo accounts (`vikram@demo.sonilpower.local`)
