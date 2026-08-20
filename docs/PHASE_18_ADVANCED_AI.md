# Phase 18 — Advanced AI Intelligence (SPEC ONLY)

**Status:** Specification reserved for Phase 18.  
**Do not implement product code under this document during Phase 16A–17 unless the roadmap is explicitly advanced.**

This file exists so Phase 18 intent is not lost while Phase **16A Website → 16B Enterprise API → 17 Industry Packs** ship first.

## Positioning

SONIL EHS360 remains a **system of record** for EHS, ESG, and compliance. AI is **assistive and explainable**, never autonomous EHS control.

Differentiator vs generic copilots:

- Grounded in tenant EHS workflows (incidents, CAPA, contractors, workforce, field)
- Industry-pack aware (Phase 17)
- Integration-ready via Enterprise API (Phase 16B)
- Field-first prompts and offline-tolerant design constraints
- Explicit **FACT vs INFERENCE** language in every user-visible score or narrative

## Terminology (mandatory)

| Term | Meaning | UI rule |
|---|---|---|
| **FACT** | Data taken from tenant records (counts, statuses, timestamps, entitled module fields) | May be shown as operational truth with record links |
| **INFERENCE** | Model-derived judgement, ranking, or narrative | Must be labelled Inference; never presented as audited fact |
| **Human approval** | Required gate before any write that changes operational state | Default for CAPA edits, severity changes, notifications to leadership, external messages |

No feature may blur FACT and INFERENCE in a single unlabeled sentence.

## Capability areas

### 1. Risk signals

- Aggregate leading/lagging signals already present in analytics (open incidents, overdue CAPA, permit expiry, LMRA gaps).
- Produce **risk signals** as INFERENCE overlays with cited FACT inputs.
- Never invent TRIR/LTIFR improvements or external benchmarks without tenant data.

### 2. Explainable scores

- Any “health”, “readiness”, or “risk” score must expose:
  - Inputs (FACT)
  - Weights / rules version
  - Top drivers (why the score moved)
  - Confidence / data-completeness caveats
- Scores are decision support, not compliance certificates.

### 3. Incident intelligence

- Suggest classification, similar past incidents, and investigation checklists (INFERENCE).
- Draft narratives for human edit; do not auto-close incidents.
- Link suggestions to retrieved tenant records where retrieval is enabled.

### 4. CAPA intelligence

- Suggest corrective/preventive action wording and owners from similar closed loops (INFERENCE).
- Flag soft-close risk when verification is missing (FACT-based rule + optional INFERENCE narrative).
- Writes require **human approval**.

### 5. Contractor intelligence

- Use the contractor register and related incidents/permits as FACT.
- Infer concentration risk or recurring themes only with explanations.
- Do not claim a full contractor OS if the product only has register-level depth.

### 6. Workforce intelligence

- Training/competency gaps only from entitled workforce data (FACT).
- Fatigue or behaviour claims are out of scope unless explicitly designed with HR/legal review.
- No biometric surveillance features in this phase spec.

### 7. Field AI

- Short, task-scoped assistance inside `/field` (LMRA prompts, hazard wording, photo OCR later).
- Optimised for gloves, glare, intermittent connectivity.
- Default to on-device or low-latency patterns; degrade gracefully offline (queue, no silent failure).
- Never block permit or stop-work decisions on model availability.

### 8. Executive AI

- Board/HSE leadership summaries from the leadership analytics pack.
- Every bullet tagged FACT or INFERENCE.
- Optional “what changed this week” digest with drill-down links — no vanity scores without explainability.

## Human approval & guardrails

- **Read** assistance may stream with clear Inference labels.
- **Write** tools (create CAPA, change severity, send alerts, update ESG metrics) require explicit human confirmation.
- Redact secrets and personal data per existing AI guardrail modules before model calls.
- Respect tenant entitlements and RBAC; no cross-tenant retrieval.
- Log model version, prompt template id, and approver id for audit-oriented trails.
- Cost controls and rate limits follow `docs/AI_COST_CONTROL.md` when implemented.

## Non-goals (Phase 18)

- Autonomous EHS or auto-filed BRSR/SEBI submissions
- Fake certifications or “AI-powered compliance guaranteed” marketing
- Unlabeled chat that silently edits production records
- Training models on customer data without contractual and technical isolation design

## Dependencies

- Phase **16B** Enterprise API (integration and partner automation surfaces)
- Phase **17** Industry packs (context packs for prompts and checklists)
- Stable analytics and CAPA verify-by-other behaviour from earlier phases
- Existing AI foundations under `src/lib/ai/**` (guardrails, retrieval stubs) — extend, do not bypass

## Acceptance themes (when Phase 18 is scheduled)

1. FACT vs INFERENCE visible in UI copy and API payloads  
2. Explainable scores with driver lists  
3. Field AI and Executive AI both ship with human approval on writes  
4. Incident/CAPA/contractor/workforce assistants cite sources  
5. Marketing claims stay within “assistive / AI-ready / explainable” language  

## Related

- `docs/EHS360_ROADMAP.md` — phase sequence  
- `docs/AI_COST_CONTROL.md` — cost and quota posture  
- Marketing rule: do not advertise Phase 18 capabilities as live until this spec is implemented and entitled  
---
