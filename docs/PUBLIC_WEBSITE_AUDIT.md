# Public Website Audit — Phase 16A

**Date:** 2026-08-18  
**Repository:** `skrnagar/sonilesh`  
**Scope:** Public marketing site + resources hub + auth entry routes

---

## Final status

### **PUBLIC WEBSITE READY** (codebase)

Build, typecheck, and unit tests pass. Critical resource availability, 404, SEO gaps, and navigation performance fixes are in place.

**Post-deploy verification still required** (Section 23): confirm live URLs on production after the next deploy.

---

## Routes tested

### Core marketing (static, `revalidate = 300`)

| Route | Build | Notes |
|-------|-------|-------|
| `/` | ✓ SSG | Homepage — resources section corrected; heavy previews lazy-loaded |
| `/resources` | ✓ SSG | Resource hub with Checkers, Tools, Guides categories |
| `/resources/brsr-applicability` | ✓ SSG | BRSR checker — client-side rules engine, no API |
| `/resources/glossary/[term]` | ✓ SSG | 16 glossary terms |
| `/pricing` | ✓ SSG | No fake price tags; Contact Sales CTA |
| `/about` | ✓ SSG | |
| `/contact` | ✓ SSG | Demo form — client validation only, no backend |
| `/book-a-demo` | ✓ SSG | |
| `/customers` | ✓ SSG | Explicitly no invented logos/quotes |
| `/security` | ✓ SSG | No fake SOC 2 / ISO badges |
| `/self-hosting` | ✓ SSG | |
| `/product` + 9 slugs | ✓ SSG | Match `product-routes.ts` |
| `/solutions` + industry slugs | ✓ SSG | Includes infrastructure, mining, power-energy |
| `/field-experience` | ✓ SSG | Added to seo-map |

### Auth entry (public, no marketing layout)

| Route | Build | Notes |
|-------|-------|-------|
| `/login` | ✓ | Server actions; middleware redirect when authenticated |
| `/signup` | ✓ | |
| `/forgot-password` | ✓ | |
| `/reset-password` | ✓ | |
| `/verify-email` | ✓ | |

### Redirects (301)

| From | To |
|------|-----|
| `/platform`, `/features` | `/product` |
| `/enterprise` | `/self-hosting` |
| `/request-demo` | `/book-a-demo` |
| `/modules` | `/product` |
| Legacy solution slugs | Canonical solution slugs |

### Blocked from indexing

| Route | Reason |
|-------|--------|
| `/compare/*` | Draft comparisons — `indexed: false` + robots disallow |
| `/resources/[slug]` | No published MDX posts — returns 404 for unknown slugs |

### 404 behavior

- **Global:** `src/app/not-found.tsx` — Return to EHS360, Explore Resources, Go to Login
- **Marketing segment:** `src/app/(marketing)/not-found.tsx` — same content within marketing chrome
- **Programmatic:** Invalid glossary term or draft MDX slug → `notFound()`

---

## Broken links fixed

| Issue | Fix |
|-------|-----|
| Homepage resource cards showed all items as “Coming soon” | Corrected `marketingResources` in `content.ts` |
| BRSR checker not listed as Available on homepage | Added with CTA “Open checker” → `/resources/brsr-applicability` |
| Nav/footer links | Verified via `command-pages.test.ts` — all command palette destinations exist in nav/footer |

No internal 404s found in nav, footer, or resource cards after this pass.

---

## Coming Soon audit

| Resource | Route | Implemented? | Status |
|----------|-------|--------------|--------|
| Implementation overview | `/resources/implementation-overview` | **Yes** (MDX) | **Available** |
| Field adoption guide | `/resources/field-adoption` | **Yes** (MDX) | **Available** |
| Closed-loop CAPA playbook | `/resources/closed-loop-capa-playbook` | **Yes** (MDX) | **Available** |
| Analytics for HSE leadership | `/resources/analytics-for-hse-leadership` | **Yes** (MDX) | **Available** |
| BRSR Applicability Checker | `/resources/brsr-applicability` | **Yes** | **Available** |
| EHS & ESG glossary | `/resources#glossary` | **Yes** (16 terms) | **Available** |
| Platform / field / security docs | `/product`, `/field-experience`, `/security` | **Yes** | **Available** |
| Enterprise API documentation | — | No public API docs yet (Phase 16B) | Coming soon |

**Rule applied:** REAL CONTENT → Available; NO CONTENT → Coming soon. BRSR checker must never show Coming soon while the page ships.

---

## Available resources

1. **Guides (4)** — MDX under `content/resources/`
2. **BRSR Applicability Checker** — `/resources/brsr-applicability`
3. **Glossary** — `/resources#glossary` + `/resources/glossary/[term]`
4. **Product documentation** — `/product`, `/field-experience`, `/security`

Roadmap: `docs/EHS360_ROADMAP.md`. Phase 18 AI reserved in `docs/PHASE_18_ADVANCED_AI.md` (spec only).

---

## Components changed

| File | Change |
|------|--------|
| `src/components/marketing/resource-card.tsx` | **New** — AVAILABLE / COMING_SOON states |
| `src/lib/marketing/content.ts` | `marketingResources` with category, availability, CTA |
| `src/app/(marketing)/page.tsx` | Resource section rewrite + lazy previews |
| `src/app/(marketing)/resources/page.tsx` | Category hub using ResourceCard |
| `src/components/marketing/lazy-previews.tsx` | **New** — dynamic import DashboardPreview, WorkflowDiagram, PricingBoard |
| `src/components/marketing/not-found-content.tsx` | **New** — shared 404 UI |
| `src/app/not-found.tsx` | **New** — global 404 |
| `src/app/(marketing)/not-found.tsx` | **New** — marketing 404 |
| `src/components/marketing/brsr-applicability-form.tsx` | Start over reset |
| `src/app/robots.ts` | Disallow `/platform/`, `/contractor/` |
| `content/seo-map.json` | Added field-experience + 3 solution pages |

---

## Performance findings & fixes

### Findings

| Area | Finding |
|------|---------|
| Middleware | Anonymous marketing visitors **skip Supabase** network call (fast path + CDN cache headers) |
| Homepage | Previously imported DashboardPreview, WorkflowDiagram, PricingBoard synchronously — large client JS on every navigation to `/` |
| Marketing pages | No authenticated Supabase/API calls on public routes |
| Navbar | Client component on every page (required for mega menu) — acceptable |
| `router.refresh()` | Not used on marketing routes |

### Fixes applied

- **`lazy-previews.tsx`:** Dynamic `import()` for DashboardPreview, WorkflowDiagram, PricingBoard with skeleton placeholders — reduces initial JS parse on route transitions to homepage
- **Existing:** Charts already lazy via `charts/lazy.tsx` + IntersectionObserver; marketing layout `revalidate = 300`

### Not changed (out of scope / low ROI)

- Navbar `useEffect` exhaustive-deps warnings (non-blocking)
- CommandPaletteHost always mounted (small footprint)

---

## SEO findings

| Item | Status |
|------|--------|
| `metadataForPath()` | Used on indexed marketing pages via `content/seo-map.json` |
| Canonical, OG, Twitter | Generated per page in `seo.ts` |
| Organization JSON-LD | Marketing layout |
| `/sitemap.xml` | `indexedSeoPages()` + glossary + MDX posts |
| `/robots.txt` | Allows `/`; disallows `/app/`, `/admin/`, `/platform/`, `/field/`, `/contractor/`, `/onboarding/`, `/api/`, `/compare/` |
| **Added to seo-map:** | `/field-experience`, `/solutions/infrastructure`, `/solutions/mining`, `/solutions/power-energy` |

Article JSON-LD on published MDX resource posts when content exists (currently 0 posts).

---

## Mobile findings

- Marketing layout uses responsive Tailwind (`md:`, `lg:` breakpoints)
- Navbar has mobile drawer; body scroll locked when open
- Resource cards: `md:grid-cols-2` grid
- BRSR form: stacked on mobile, two-column on `lg:`
- No automated viewport E2E; manual check recommended at 320–1440px

---

## Security findings

| Check | Result |
|-------|--------|
| Marketing pages call authenticated APIs | **None** |
| Fake security certifications | **None displayed** — security page explicitly disclaims SOC 2/ISO badges |
| Robots blocks private app routes | **Yes** |
| Middleware protects `/app`, `/admin`, `/field`, `/contractor` | **Yes** |
| Compare drafts blocked from search | **Yes** |

---

## Product claims audit

| Claim pattern | Action |
|---------------|--------|
| SOC 2 / ISO / GDPR badges | **Not claimed** — explicitly disclaimed on `/security` and homepage trust section |
| Customer logos / case studies | **Not fabricated** — `/customers` states permission-only policy |
| Pricing dollar amounts | **Not shown** — “Contact Sales” only |
| BRSR checker legal filing | **Disclaimed** — “orientation, not legal advice” |
| “AI-powered” on marketing pages | **Not used** as unsupported headline claim |
| Industry-leading / #1 / trusted by | **Not found** on marketing pages |

---

## Pricing page

- Plans: Team, Business, Enterprise — match `pricingTiers` in `content.ts`
- Features align with entitlement modules described in product pages
- **No live billing implied** — Razorpay route exists for app but pricing page directs to Contact Sales
- Comparison table labeled “Illustrative packaging — final entitlements confirmed commercially”

---

## Login / Signup

- Public marketing pages do not expose authenticated tenant data
- Auth uses Supabase server actions; middleware redirects authenticated users away from login/signup
- Forgot password, reset, verify-email routes present

---

## Tests & build

| Command | Result |
|---------|--------|
| `npm run lint` | **Pass** (2 warnings: navbar `useEffect` deps — pre-existing) |
| `npm run typecheck` | **Pass** |
| `npm test` | **Pass** — 238 tests / 40 files |
| `npm run build` | **Pass** — all marketing routes SSG |
| E2E | **Not configured** in repository |

### Lint/build fixes included in this phase

- `src/app/app/search/page.tsx` — unused `row` params
- `src/lib/analytics/metrics.ts` — `prefer-const`
- `src/lib/ai/prompts/system.ts` — unused locale param
- `src/lib/ai/retrieval.test.ts` — updated for `tAi()` signature

---

## Production verification checklist (post-deploy)

- [ ] `GET /` — 200, BRSR card shows **Available**, link works
- [ ] `GET /resources` — 200, Checkers/Tools/Guides sections render
- [ ] `GET /resources/brsr-applicability` — 200, form runs end-to-end
- [ ] `GET /pricing`, `/login`, `/signup` — 200
- [ ] No console errors on marketing navigation
- [ ] `/sitemap.xml` includes new solution + field-experience URLs
- [ ] Unknown URL shows custom 404

---

## Summary

The public website accurately represents **only implemented functionality**. Phase 16A adds four published MDX guides, restructures Resources into Guides / Tools / Glossary / Product Documentation, and reserves Phase 18 AI in docs. Performance on homepage navigation is improved via code-split previews. SEO, sitemap, robots, and 404 are in place. No fabricated customers, certifications, or pricing.

**Deploy and run the production checklist above to close Phase 16A.**

See also: `docs/EHS360_ROADMAP.md`, `docs/PHASE_18_ADVANCED_AI.md`.
