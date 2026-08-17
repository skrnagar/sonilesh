# SEO strategy

India-first positioning: **EHS software + ESG/BRSR + regulatory compliance** on one platform. Do not keyword-stuff. Do not invent mandates.

## Source of truth

`content/seo-map.json` drives titles, descriptions, H1s, keywords, and `indexed`. `metadataForPath()` applies canonical URLs. `src/app/sitemap.ts` emits indexed pages plus glossary and MDX posts. `src/app/robots.ts` keeps `/app`, `/admin`, `/field`, `/onboarding`, `/api`, and `/compare` out of the index.

## Primary intents (homepage + product)

- EHS software India
- EHS management software
- ESG compliance software / ESG reporting software India
- Regulatory compliance software India
- BRSR software / BRSR reporting

Industry and module pages keep distinct H1s (enforced in `src/lib/marketing/seo.test.ts`: unique title, description, H1; titles ≤ 60; descriptions ≤ 160).

## Compare drafts

`/compare/vs-rakhsha` and `/compare/vs-complinity` stay `indexed: false` until every claim is production-true.

## Content that may rank without stuffing

- Glossary terms (BRSR, EPR, CBAM, CCTS, CAPA, TRIR, …)
- `/resources/brsr-applicability` — tool page, same engine as the app
- Industry pages for the canonical five verticals only as they are written

## Claims we will not SEO

SOC 2, ISO, customer counts, injury-rate statistics, “free forever”, competitor matrices, and “we file BRSR/SEBI/CPCB for you”.
