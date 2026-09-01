# North Star / Axiomi Reference — Competitive & UX Benchmark

**Purpose:** Capture positioning, capability breadth, and UX patterns from Northstar Safety Systemz (consulting + culture) and Axiomi (platform) as inspiration for SONIL EHS360 — **without copying branding, copy, or proprietary claims.**

**Sources reviewed:**  
- Marketing: https://www.northstar-ehs.com/ (fetched Sep 2026)  
- App signup/login: https://app.northstar-ehs.com/signup (fetched Sep 2026)  
- EHS360: `src/app/(marketing)/page.tsx`, `src/app/signup/page.tsx`, `src/lib/navigation/launchpad.ts`, `src/lib/navigation/modules.ts`, `docs/EHS360_MODULE_MAP.md`

**Production:** https://sonilesh.vercel.app

---

## 1. North Star / Axiomi positioning summary

### Northstar Safety Systemz (culture + consulting)

Northstar positions as a **17+ year EHS consultancy** that develops **safety culture** — not just audits — for heavy industry globally (500+ organisations, 26 countries). Their narrative separates **compliance (table stakes)** from **culture (differentiator)**: behaviours, leadership signals, and the gap between policy and practice.

**Three commercial lanes:**

| Lane | Positioning |
|------|-------------|
| **Safety culture** | Maturity assessment, leadership engagement, behaviour-based programmes |
| **Sustainability & environment** | ESG strategy, environmental audits, emissions/water/waste, legal counsel |
| **Intelligence & automation** | Axiomi platform — AI risk foresight, automated PTW, sustainability reporting |

**Methodology (4-step loop):** Assess → Engage → Embed → Sustain (Axiomi sustains measurement post-engagement).

**Trust signals:** ISO 45001/14001 certification, OSHA-accredited specialists, landmark client engagements (oil & gas, metros, ports, defence, retail scale audits), sector fluency (mining, chemicals, power, logistics).

**Go-to-market:** High-touch — complimentary consultation, specialist callback forms, culture maturity quiz, WhatsApp, demo requests. **No self-serve product signup on the marketing site.**

### Axiomi (platform)

Axiomi is framed as a **bespoke enterprise operating system** built by practitioners across **11 pillars** and **90+ modules**: EHS, ESG, Energy, Security, Quality, TPRM, BCMS.

**Core promise:** *One record, many outcomes* — capture an incident once; root cause, CAPA, retraining, audit finding, and ESG disclosure stay linked.

**Differentiators claimed:**

| Theme | Claim |
|-------|-------|
| **Confidence-first** | Safety-posture index + “attention now” shortlist answers “are we okay?” in seconds |
| **Deep, not shallow** | Process safety (HAZOP, QRA, arc-flash) and ESG assurance (BRSR) — beyond checklist apps |
| **Intelligent** | AI copilot (“Ask Northstar”) + live digital twin for foresight |
| **Engineered to last** | Multi-tenant PWA, offline-capable, WCAG-AA, country packs, SSO/SCIM, immutable audit trail |

**Platform pillars (Axiomi signup page):**

1. Safety — incidents, HIRA, HAZOP, QRA, arc-flash, PTW/SIMOPS, LOTO, confined space  
2. Health & hygiene — medical surveillance, IH/OEL, ergonomics (RULA/REBA)  
3. Environment — aspects/impacts, air/water/waste, chemicals/GHS/SDS  
4. Energy — ISO 50001, EnPI, M&V, net-zero  
5. Culture — BBS, felt leadership, stop-work, maturity ladder  
6. ESG & governance — BRSR/GRI/TCFD/ESRS/SASB, legal register, MOC, audits  
7. Security — physical, personnel, OT-cyber (ISO 27001-aligned)  
8. Disaster & continuity — emergency response, BCM (ISO 22301), DR  

**Auth model:** Sign-in only; **access is contact-for-access** (email team to provision accounts). Marketing + product pages sell depth before login.

### SONIL EHS360 (current positioning)

EHS360 is an **India-first, multi-tenant SaaS** from SONIL Buildcon’s execution context — civil/EPC, transmission, renewables, contractor-heavy sites. Honest marketing: no invented certifications, logos, or injury-rate claims.

**Positioning contrast:**

| Dimension | North Star / Axiomi | SONIL EHS360 |
|-----------|-------------------|--------------|
| **Origin story** | Global consultancy + platform | EPC subcontractor operator building software for field reality |
| **Primary buyer** | Enterprise HSE + board (culture transformation) | HSE leads, EPC package managers, compliance/ESG owners in India |
| **GTM** | Consultation → bespoke deployment | Self-serve signup + book demo + contact sales tiers |
| **Breadth claim** | 90+ modules, 11 pillars | ~35 launchpad modules, 3 domains (EHS ops, ESG/BRSR, regulatory) |
| **AI stance** | Hero feature (copilot, digital twin, predictive risk) | Assistive, grounded — “AI-ready foundation” without overclaim |
| **Proof** | Scale credentials (500 orgs, landmark audits) | Product facts + parent company execution credibility |

---

## 2. Feature / pillar mapping

**Legend:** ✅ Implemented · ⚠️ Partial (routes/UI exist, workflow or depth gaps) · 📋 Planned (roadmap) · ⛔ Out of scope (consulting / not target)

| North Star / Axiomi capability | EHS360 status | Notes |
|--------------------------------|---------------|-------|
| **Safety culture maturity assessment** | 📋 Planned | Roadmap Phase 25 (BBS); no maturity ladder/score quiz on marketing yet |
| **BBS / safety observations** | ⚠️ Partial | `/app/observations`; UA/UC workflow incomplete vs reference allocate→close |
| **Incident management** | ⚠️ Partial | Full incident routes; investigation/CAPA bridge in progress (Phase 21) |
| **Near miss reporting** | ⚠️ Partial | Module + field capture |
| **Hazard register / HIRA** | ⚠️ Partial | Hazards + risk assessments; no dedicated HIRA engine |
| **HAZOP / QRA / process safety studies** | ⛔ Out of scope | Consulting-grade studies; not product modules today |
| **Arc-flash / hazardous area** | ⛔ Out of scope | Specialist engineering domain |
| **Permit to work (hot work, etc.)** | ⚠️ Partial | PTW module exists; SIMOPS/LOTO depth on roadmap (Phase 23) |
| **LOTO / confined space** | 📋 Planned | Phase 23 |
| **LMRA / last-minute risk** | ⚠️ Partial | Field LMRA; dedicated ops workflow Phase 22 |
| **Site visits (HSV/RSV/TSV)** | ⚠️ Partial | Launchpad tile + in-progress detail workflow (`site-visits/`) |
| **Inspections & audits** | ⚠️ Partial | Checklist engine; mobile execution hardening Phase 24 |
| **CAPA / corrective actions** | ⚠️ Partial | CAPA + action items; verify-by-other escalation Phase 26 |
| **Training & L&D (50+ programmes)** | ⚠️ Partial | Training module; not a course marketplace like Northstar’s L&D bench |
| **Toolbox talks** | ⚠️ Partial | Module + field |
| **Industrial hygiene / medical surveillance** | ⛔ Out of scope | Not in launchpad IA |
| **Fire & electrical assurance** | ⛔ Out of scope | Audit service line for Northstar; not EHS360 modules |
| **Environmental audits / legal counsel** | ⛔ Out of scope | Consulting; compliance register is software scope |
| **Aspects & impacts / emissions** | ⚠️ Partial | ESG dashboard; not full EMS breadth |
| **Chemicals / GHS / SDS** | ⚠️ Partial | Chemicals module + SDS engine docs |
| **Energy / ISO 50001 / EnPI** | ⛔ Out of scope | Not a current pillar |
| **ESG reporting (BRSR, GRI, TCFD, etc.)** | ⚠️ Partial | BRSR-oriented ESG; multi-framework depth partial |
| **Legal register / statutory tracking** | ⚠️ Partial | Compliance dashboard; legal register on roadmap Phase 33 |
| **MOC** | ⚠️ Partial | MOC module |
| **Management systems (ISO 45001/14001/22301)** | 📋 Planned | Implementation support is consulting for Northstar; EHS360 tracks evidence not certification consulting |
| **Security / OT-cyber** | ⛔ Out of scope | Axiomi pillar; not EHS360 |
| **BCM / disaster continuity** | ⛔ Out of scope | Not in module map |
| **Contractor management** | ⚠️ Partial | Register today; full contractor OS Phase 32 |
| **PPE management** | ⚠️ Partial | PPE module + field |
| **Document control** | ⚠️ Partial | Documents module |
| **Executive dashboards / control tower** | ⚠️ Partial | `/app/executive`, Control Tower tile |
| **Safety posture index / “attention now”** | 📋 Planned | EHS Scorecard Phase 27; alerts partial |
| **Predictive risk / incident intelligence** | 📋 Planned | AI agents Phase 35; framed as assistive not autonomous |
| **AI copilot** | ⚠️ Partial | EHS Copilot tile; production hardening Phase 34 |
| **Digital twin of operations** | ⛔ Out of scope | Axiomi-specific metaphor; EHS360 uses operational dashboards |
| **Mobile / offline PWA field capture** | ⚠️ Partial | Field routes exist; offline hardening Phase 36 |
| **Multi-channel alerts (email, SMS, WhatsApp, push)** | ⚠️ Partial | Notifications module; channel breadth TBD |
| **ERP / M365 / Teams integrations** | 📋 Planned | Integrations Phase 39 |
| **SSO / SCIM / granular RBAC** | ⚠️ Partial | RBAC + tenant isolation; enterprise SSO later |
| **Report hub / MIS / scheduled exports** | 📋 Planned | Phases 28–29 |
| **Culture quiz / lead magnet** | 📋 Planned | BRSR applicability checker exists; no safety-culture assessment |
| **Global country packs** | ⚠️ Partial | India-first statutory/BRSR; not 26-country packs |

---

## 3. Website UX patterns worth adopting (original wording)

Patterns observed on Northstar’s marketing site that EHS360 can adapt **with original copy and honest claims**:

### Hero & above-the-fold

| Pattern | Northstar approach | EHS360 adoption idea |
|---------|-------------------|----------------------|
| **Dual headline structure** | Eyebrow (Safety Culture · Sustainability · Environment) + bold outcome headline | Keep eyebrow (“The modern EHS + ESG platform”); sharpen outcome line around *field-to-filing* not generic “one platform” |
| **Dual primary CTA** | “Request consultation” + “Begin assessment” | Already has “Book a Demo” + “Start Free” — consider a **third low-friction CTA** (e.g. BRSR checker or culture/readiness self-assessment) |
| **Credibility strip** | ISO badges + advisor club rank | EHS360 correctly avoids fake badges — use **verifiable facts** (parent EPC sectors, module count, India-first) |
| **Live product preview** | Axiomi UI cards (risk trend, permit, sustainability report) | Product screenshot + mobile preview exist — add **annotated micro-cards** on hero (open CAPA, overdue permit, BRSR line item) |

### Narrative structure

| Pattern | Worth adopting |
|---------|----------------|
| **Problem → method → platform** | Northstar: culture gap → Assess/Engage/Embed/Sustain → Axiomi sustains. EHS360 already has problem + 7-step loop — add a **4-beat “how teams adopt”** section (Capture → Own → Verify → Report) in plain language |
| **Sector fluency grid** | Chip row of industries (mining, power, ports…). EHS360 has industry cards — add **horizontal scroll chips** on mobile for faster scanning |
| **Services filter tabs** | “All / Safety Culture / Sustainability / Intelligence”. Mirror on product page: **EHS Ops / Compliance / ESG** filter on module bento |
| **Numbered methodology** | 01–04 steps with short titles. Map to EHS360’s execution pillars or incident→CAPA loop visually |
| **Platform proof panel** | Animated/status cards showing AI flag, permit routing, auto report. **Status vignettes** on `/product` without implying live customer data |
| **Integration logo row** | ERP, M365, Teams, WhatsApp. Add **“Connects with”** section when integrations ship; until then omit (honesty > filler) |
| **Landmark engagements** | Large numbered mandates. EHS360 policy: **no invented logos** — substitute “Built with package managers who run…” persona quotes or anonymised use patterns |
| **Global reach map** | 26 countries. EHS360: **India operating states map** (already in company content) — stronger local fit |
| **Lead magnet quiz** | “How mature is your safety culture?” 5 questions → score. Candidate: **“How audit-ready is your EHS data?”** or extend BRSR checker |
| **Testimonials** | Named enterprises + star ratings. EHS360: defer until real customers; use **role-based vignettes** (“Safety officer on a 220 kV package”) |
| **Insights / blog** | Three article cards + newsletter. Align with `resources` — surface **2–3 flagship guides** on homepage |
| **Persistent WhatsApp / callback** | Floating WhatsApp + consultation. Optional **click-to-call** using real `company.phone` |
| **Sticky specialist form** | “Speak with a specialist” inline form. `/book-a-demo` exists — test **inline callback** on long pages |

### Tone & trust

- Northstar leans **premium consultancy** (confidence, discretion, “held in strict confidence”).
- EHS360 should lean **operator credibility** (EPC execution, gloves-and-glare field UX, no invented SOC 2).
- **Do not copy** Northstar/Axiomi taglines, step names, or “digital twin” / “Ask Northstar” language.

---

## 4. Signup / auth UX comparison

| Aspect | Axiomi (`app.northstar-ehs.com/signup`) | SONIL EHS360 (`/signup`) |
|--------|------------------------------------------|---------------------------|
| **Layout** | Split: long product story left, compact sign-in right | Split: `AuthShell` marketing panel left, form right (similar pattern) |
| **Primary action** | Sign in only | **Self-serve signup** (name, email, password) |
| **Account provisioning** | “Contact our team to set up your account” | User creates account → org onboarding |
| **Product education on auth** | 11 pillars listed, standards badges (ISO*), trust/compliance bullets, “90+ modules” | Short enterprise panel: tenant isolation, RBAC, audit-ready workflows |
| **Secondary CTAs** | “View full overview”, “Request a demo” (email) | Link to login; no demo CTA on signup page itself |
| **Password / SSO** | Email + password; SSO mentioned in trust section | Email + password (min 8); SSO not on signup page |
| **Portals** | Single workspace | Multiple entry points: `/login`, `/platform-login`, `/field-login`, `/contractor-login` |
| **Post-signup** | N/A (provisioned) | “Create organization and invite your EHS team” |

### Implications

| Strategy | When it fits |
|----------|--------------|
| **Contact-for-access (Axiomi)** | Enterprise deals, bespoke configuration, services-led GTM |
| **Self-serve signup (EHS360)** | PLG motion, trials, SME teams, faster time-to-value |

**Recommendation:** Keep self-serve for Team/Business tiers but **enrich the auth left panel** with pillar/module breadth (honest counts from launchpad), standards *supported* (not “certified”), and a demo link — without switching to invite-only unless sales motion changes.

---

## 5. Prioritized recommendations (marketing + product)

| # | Recommendation | Rationale | Effort |
|---|----------------|-----------|--------|
| **1** | Add a **low-friction assessment CTA** on marketing homepage (culture/data readiness or BRSR checker) alongside Book Demo / Start Free | Northstar’s quiz drives leads without sales call; EHS360 has checker assets | Low (marketing) |
| **2** | Enrich **signup/auth left panel** with module pillars, honest module count, and “request demo” link | Axiomi educates before login; EHS360 panel is generic today | Low |
| **3** | Ship **product status vignettes** on `/product` (open permit, overdue CAPA, BRSR line) | Mirrors Axiomi proof cards; shows “one record, many outcomes” | Medium (marketing) |
| **4** | Prioritize **UA/UC + incident closed-loop** (Phase 21) | Core gap vs enterprise reference workflows; underpins “confidence-first” narrative | High (product) |
| **5** | Deliver **EHS Scorecard / attention queue** (Phase 27) for executive “are we okay?” | Axiomi’s safety-posture index; EHS360 has Control Tower but not score index | Medium (product) |
| **6** | Complete **site visits workflow** (HSV/RSV/TSV) — in progress | Matches Northstar field assurance pattern; uncommitted work exists | Medium (product) |
| **7** | Add **module filter tabs** on product marketing (Ops / Risk / Assurance / ESG) | Northstar services tabs improve scannability of large catalog | Low (marketing) |
| **8** | Harden **notifications multi-channel** (email first, then SMS/WhatsApp for India field) | Axiomi highlights channel breadth; critical for permit/CAPA overdue | Medium (product) |
| **9** | Publish **2–3 flagship resources** on homepage Insights strip | Northstar blog drives SEO and trust; aligns with `CONTENT_STRATEGY.md` | Low (content) |
| **10** | Maintain **honest differentiation**: India/EPC field-first, self-serve SaaS, no fabricated credentials | Sustainable vs Northstar’s consultancy-scale proof; avoids legal/reputation risk | Ongoing |

---

## 6. Git status note (Sep 2026)

Uncommitted work remains on `main` (branch **ahead of origin/main by 1 commit**):

| Path | Status |
|------|--------|
| `src/app/actions/enterprise.ts` | Modified (not staged) |
| `src/app/app/site-visits/[id]/` | Untracked |
| `src/components/site-visits/` | Untracked |
| `.cursor/` | Untracked (IDE settings — do not commit) |

This aligns with **site visits hardening** called out in recommendation #6.

---

## 7. Related EHS360 docs

- `docs/EHS360_MODULE_MAP.md` — implementation status by module  
- `docs/EHS360_ROADMAP.md` — phased delivery sequence  
- `docs/MARKETING_ARCHITECTURE.md` — public site IA  
- `docs/CONTENT_STRATEGY.md` — honest claims policy  
- `docs/PUBLIC_WEBSITE_AUDIT.md` — prior marketing audit  

---

*This document is for internal product and marketing alignment. Do not reproduce North Star or Axiomi trademarks, copy, or client names in customer-facing SONIL materials.*
