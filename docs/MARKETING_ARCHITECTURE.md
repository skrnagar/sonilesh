# Marketing architecture (M0)

Public site for **SONIL EHS360**: India-first **EHS + ESG + regulatory compliance** on one multi-tenant platform. Self-hosting is an enterprise option, not the default SKU.

This document describes routes that exist in the repo. It does not invent customers, logos, certifications, SOC 2/ISO, statistics, case studies, or regulatory mandates.

## Surfaces (do not confuse)

| Surface | Path | Audience |
|---|---|---|
| Marketing | `src/app/(marketing)/**` | Public buyers |
| Workspace | `/app` | Customer EHS/ESG/compliance users |
| Field | `/field` | Signed-in crews |
| Platform admin | `/admin` | SONIL operators |
| Auth | `/login`, `/signup`, `/onboarding` | Account + org setup |

Marketing must not rebuild `/app`, `/admin`, or `/field`.

## Canonical public routes

| Path | Status |
|---|---|
| `/` | Homepage |
| `/product` | Product hub + Identify→Analyze map |
| `/product/[slug]` | Module pages (see product routes) |
| `/solutions` | Industry hub (canonical five) |
| `/solutions/manufacturing` | Canonical |
| `/solutions/construction-epc` | Canonical |
| `/solutions/renewable-energy` | Canonical |
| `/solutions/oil-gas-chemicals` | Canonical |
| `/solutions/logistics-warehousing` | Canonical |
| `/pricing` | Packaging; Contact Sales; no fake prices |
| `/self-hosting` | Cloud vs privately operated instance |
| `/security` | Controls we run; no fake certs |
| `/resources` | Guides + glossary + tools |
| `/resources/brsr-applicability` | Thin checker on `src/lib/compliance/applicability.ts` |
| `/resources/glossary/[term]` | Glossary |
| `/book-a-demo` | Demo form (front-end placeholder until CRM) |
| `/contact` | Sales contact + same placeholder form |
| `/about` | SONIL Buildcon public facts |
| `/customers` | Honest empty state — no invented logos |
| `/login` | Sign in |
| `/signup` | Create account → onboarding (not a billed “free forever” trial) |
| `/compare/vs-rakhsha` | Draft; `indexed: false`; robots disallow `/compare/` |
| `/compare/vs-complinity` | Draft; same |

Legacy marketing paths may still exist (`/modules/*`, extra `/solutions/*`, `/field-experience`). Prefer `/product/*` and canonical `/solutions/*` in nav. Dead aliases redirect:

- `/enterprise` → `/self-hosting`
- `/platform`, `/features`, `/modules` → `/product`
- `/modules/[slug]` → matching `/product/...` when known
- `/request-demo` → `/book-a-demo`
- `/solutions/construction` and `/solutions/epc` → `/solutions/construction-epc`
- `/solutions/logistics` → `/solutions/logistics-warehousing`
- `/solutions/oil-gas` → `/solutions/oil-gas-chemicals`

## Product module pages

Defined in `src/lib/marketing/product-routes.ts`:

- incident-management, permit-to-work, risk-assessment-jsa
- inspections-audits, capa-tracking, training-competency
- contractor-management
- compliance-tracking, esg-brsr-reporting

## Unpublished / partial claims (do not oversell)

| Claim | Reality in product |
|---|---|
| **Contractor management** | Company register (name, status, safety score, insurance date) plus contractor names on permits. Not a full induction / document-pack / gate-pass OS. Marketing copy says this. |
| **Training & competency** | Workspace module exists; Phase 9 work may still be landing. Do not claim a complete LMS. |
| **Start Free** | `/signup` creates an account and onboarding org. Live self-serve billing / public free-forever trial is **not** claimed. |
| **Demo / contact forms** | Front-end placeholders until inbox/CRM is connected. Phone/email on `/contact` are public SONIL Buildcon facts. |
| **Compare pages** | Kept as unpublished drafts. No competitor feature matrix until every cell is production-true. |
| **Customers** | No named logos or case studies. |
| **Certifications** | No SOC 2, ISO, GDPR badges. |
| **BRSR checker** | Same sample obligation rules as the app engine. Orientation, not legal advice, not SEBI filing. |
| **Self-hosting** | Commercial conversation. No public one-click installer. |
| **AI** | “AI-ready” structured data only — not autonomous EHS. |

## IA / nav

Primary nav: Product, Solutions, Resources, Pricing. CTAs: Book a Demo, Sign in. Footer includes Start Free → `/signup`.

## Content sources

- Copy constants: `src/lib/marketing/content.ts`
- SEO map: `content/seo-map.json` → `src/lib/marketing/seo.ts`
- Sitemap: indexed SEO pages + glossary + MDX resources
- Robots: allow marketing; disallow `/app/`, `/admin/`, `/field/`, `/onboarding/`, `/api/`, `/compare/`
