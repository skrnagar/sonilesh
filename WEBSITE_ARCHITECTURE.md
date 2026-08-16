# SONIL EHS360 Marketing Website Architecture

## Goals

Ship a polished enterprise SaaS marketing site for SONIL EHS360 that converts to demos without touching product surfaces (`/app`, `/admin`, `/field`, auth, APIs).

## Tech stack

- Next.js 15 App Router + TypeScript
- Tailwind CSS v4 + existing CSS variables
- shadcn/ui primitives (`Button`, `Badge`, `Card`, `Input`, `Label`, `Textarea`)
- Lucide icons
- Framer Motion (marketing motion only, reduced-motion aware)

## Route organization

```
src/app/(marketing)/
  layout.tsx          # Navbar + Footer + marketing chrome
  page.tsx            # /
  platform/
  solutions/…
  features/
  modules/…
  field-experience/   # marketing Field page (see conflicts)
  enterprise/
  security/
  pricing/
  resources/
  about/
  contact/
  request-demo/
src/components/marketing/   # reusable marketing UI
src/lib/marketing/          # nav, content, SEO helpers
```

Marketing pages live in the `(marketing)` route group so they share chrome without affecting product layouts.

## Shared layout boundaries

| Area | Layout owner | Notes |
|---|---|---|
| Marketing | `(marketing)/layout.tsx` | Sticky nav, footer, light canvas |
| Auth | existing pages | No marketing chrome |
| `/app` | `app/layout.tsx` | Untouched |
| `/admin` | `admin/layout.tsx` | Untouched |
| `/field` | `field/layout.tsx` | Untouched product UI |

## Navigation IA

**Header:** Platform · Solutions · Modules · Enterprise · Resources · Pricing | Sign In | Request Demo

Mega menus:

- **Platform** — overview, field experience, analytics, security, AI-ready
- **Solutions** — industry verticals
- **Modules** — core EHS modules
- **Enterprise** — multi-tenant, RBAC, configuration
- **Resources** — guides/placeholders

## SEO & discoverability

- Per-page `metadata` (title template `… | SONIL EHS360`)
- Open Graph + Twitter cards
- `sitemap.ts`, `robots.ts`
- Semantic headings, descriptive link text

## Data / content strategy

Static TypeScript content modules in `src/lib/marketing/` (industries, modules, nav). No CMS. Demo form is client-validated placeholder (no fake backend claims).

## Conflicts & non-goals

- **`/field` reserved** for product field app → marketing Field page at `/field-experience`
- Do not rewrite Supabase migrations, workspace modules, or admin
- No fake prices, logos, certs, or customer quotes

## Performance notes

- Server Components by default; client only for nav menus, motion, demo form
- Prefer CSS compositions over heavy images
- Keep marketing JS isolated from product bundles via route-level code splitting
