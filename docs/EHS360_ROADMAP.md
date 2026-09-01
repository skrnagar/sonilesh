# EHS360 product roadmap

Canonical sequence for SONIL EHS360 after the core platform (Phases 1–15 in `docs/DEVELOPMENT_ROADMAP.md` and enterprise architecture work through Phase 24 on `main`).

**Differentiator:** Enterprise EHS operating model (UA/UC, incidents, LMRA, permits, visits, MIS, scorecards) + industry workflows + integrations + explainable AI + field-first capture — without copying proprietary branding or marketplace-first navigation.

## Sequence (forward)

| Phase | Focus | Status | Notes |
|---|---|---|---|
| **16A** | Public website + resources | **Done** | Marketing site, honest resource availability, SEO |
| **16B** | Enterprise API | Next | Documented public API, auth, rate limits — see `docs/SAAS_CONTROL_PLANE.md` |
| **17** | Industry packs | Later | Configurable packs for manufacturing, construction/EPC, renewables, oil & gas |
| **18** | Advanced AI intelligence | Later | Spec only — see `docs/PHASE_18_ADVANCED_AI.md` |
| **19** | RAKSHA-inspired EHS operating model | **NOW (docs)** | IA, workflows, roles, module map — see `docs/EHS360_ARCHITECTURE.md` |
| **20** | Enterprise launchpad + navigation | **NOW (code)** | `/app/home` module tiles, grouped nav, marketplace demoted to admin/templates |
| **21** | UA/UC + Incident + Near Miss | Next | Full allocate → close → verification workflow |
| **22** | LMRA + Risk Assessment | Planned | ESHO approval, risk register depth |
| **23** | Work Permit + LOTO | Planned | Multi-party sign-off, extension, close-out |
| **24** | Checklist + Inspection + Audit | Planned | Mobile execution, findings → CAPA |
| **25** | TSV + HSV/RSV + BBS | Planned | Site visit roles, behavioral safety |
| **26** | CAPA + Action Management | Planned | Overdue escalation, verify-by-other |
| **27** | EHS Score Card | Planned | Dimensional scoring, regional roll-up |
| **28** | EHS MIS | Planned | Periodic MIS with approval chain |
| **29** | Reports Hub | Planned | Scheduled PDF/Excel, register exports |
| **30** | Analytics & Benchmarking | Planned | Site → region → corporate drill-down |
| **31** | Training & competency | Later | Assignments, expiry, compliance % |
| **32** | Contractor readiness | Later | Prequalification, induction, performance |
| **33** | Compliance & legal register | Later | Secondary nav; not primary field ops |
| **34** | AI Copilot (production) | Later | Grounded assist on ops modules |
| **35** | AI Agents | Later | Triage, classification, anomaly flags |
| **36** | Mobile / field hardening | Later | Offline-first field workflows |
| **37** | Admin & hierarchy | Later | Region scope admin, action matrix UI |
| **38** | Multi-tenant federation | Later | Enterprise org patterns |
| **39** | Integrations | Later | Phase 16B API + connectors |
| **40** | Hardening & global platform | Later | Localization, performance, SLA |

## Phase 19 exit criteria (operating model docs)

- `docs/EHS360_ARCHITECTURE.md` reflects enterprise OS vision and phase 19–40 sequence
- `docs/EHS360_MODULE_MAP.md` maps modules to routes, services, tables
- `docs/EHS360_WORKFLOWS.md` documents UA/UC, incident, LMRA, permit target states
- Marketplace demoted: no launchpad prominence; admin/templates only

## Phase 20 exit criteria (launchpad + navigation)

- `/app/home` shows **My Dashboard**, **EHS Operations** (20+ module tiles), **Reports**, **AI Copilot**
- Sidebar uses grouped `ENTERPRISE_NAV` (Home, Dashboard, Safety Operations, Risk & Control, Assurance, People, Analytics, Reports, AI Copilot, Administration)
- Role-aware tile visibility via entitlements + RBAC
- `/app/marketplace` renamed/described as **Templates** under Administration
- Modern enterprise UI (white canvas, navy typography, blue actions) — not legacy tile branding

## Explicit non-goals

- Marketplace-first navigation or partner ecosystem as primary product metaphor
- Copying reference platform branding, logos, or 2020-era blue tile UI
- Rewriting working incident/LTI/UA/UC/photo fixes during shell work

## Related docs

- `docs/EHS360_ARCHITECTURE.md` — target architecture and operating model diagram
- `docs/EHS360_MODULE_MAP.md` — IA → routes → tables
- `docs/EHS360_WORKFLOWS.md` — state machines
- `docs/EHS360_RBAC.md` — roles and permissions
- `docs/EHS360_UI_SYSTEM.md` — design system
- `docs/PHASE_18_ADVANCED_AI.md` — advanced AI specification
- `docs/PHASE_19_MARKETPLACE.md` — **deprecated** marketplace spec (superseded by Phase 19 operating model)
- `docs/DEVELOPMENT_ROADMAP.md` — earlier engineering phases
