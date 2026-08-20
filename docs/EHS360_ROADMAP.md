# EHS360 product roadmap

Canonical sequence for SONIL EHS360 after the core platform (Phases 1–15 in `docs/DEVELOPMENT_ROADMAP.md` and later engine work).

**Differentiator:** Rakhsha-like EHS depth + industry workflows + integrations + explainable AI + field-first capture — without inventing customers, certifications, or autonomous EHS claims.

## Sequence (forward)

| Phase | Focus | Status | Notes |
|---|---|---|---|
| **16A** | Public website + resources | **NOW** | Marketing site, honest resource availability, SEO, BRSR checker, guides |
| **16B** | Enterprise API | Next | Documented public API, auth, rate limits, integration playbooks — no fake partner logos |
| **17** | Industry packs | Later | Configurable packs for manufacturing, construction/EPC, renewables, oil & gas/chemicals, logistics |
| **18** | Advanced AI intelligence | Later | Spec only until ready — see `docs/PHASE_18_ADVANCED_AI.md` |
| **19** | Marketplace + partner ecosystem | Later | Spec only — see `docs/PHASE_19_MARKETPLACE.md` |
| **20** | Global platform | Later | Multi-region ops, localisation, enterprise federation patterns |

## Phase 16A exit criteria

- `sonilesh.vercel.app` (or assigned production host) presents a finished enterprise SaaS marketing surface
- Resources show **Available** only when content or function exists; otherwise **Coming soon**
- No fake customers, logos, certifications, or testimonials
- Sitemap, robots, 404, mobile nav, and login/signup entry points work

## Explicit non-goals for 16A

Do **not** build Phase 16B/17/18/19 product code in the 16A branch. Roadmap and later-phase **spec** documents are allowed so work is not lost.

## Related docs

- `docs/MARKETING_ARCHITECTURE.md` — public route map
- `docs/PUBLIC_WEBSITE_AUDIT.md` — website readiness checklist
- `docs/PHASE_18_ADVANCED_AI.md` — advanced AI specification (no implementation)
- `docs/PHASE_19_MARKETPLACE.md` — marketplace + partner ecosystem specification (no implementation)
- `docs/DEVELOPMENT_ROADMAP.md` — earlier engineering phases

