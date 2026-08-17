# Risk Management Engine (Phase 5)

Phase 5 delivers a **shared, configurable Risk Management Engine**. Risk Assessment, JSA, and JHA are **assessment types** on one stack — not three CRUD subsystems.

**Out of scope for this phase:** Permit to Work, full CAPA engine, AI risk prediction.

## Design principle: one engine, many types

| Concern | Implementation |
|--------|----------------|
| Storage | `public.risk_assessments` |
| Type discriminator | `risk_assessment_types.code` → `risk_assessment` / `jsa` / `jha` |
| Matrix | `risk_matrices` (org-configurable bands; never hard-coded in scoring) |
| Hazards | `risk_hazards` (inherent + residual L×C) |
| Controls | `risk_controls` (`existing` / `additional` + hierarchy of controls) |
| Steps | `risk_assessment_steps` (JSA/JHA task breakdown) |
| Team | `risk_assessment_team` |
| Timeline | `risk_assessment_activity` |
| Register | Query over `risk_hazards` joined to assessments (`getRiskRegister`) |
| Report bridge | `source_event_id` → `ehs_events` |

```
Activity → Task → Hazard ID → Existing controls → Inherent risk
       → Additional controls → Residual risk → Approval → Active → Review → Retire
```

## Lifecycle statuses

`draft` → `team_assigned` → `in_progress` → `review` → `approval` → `active` → `periodic_review` → `retired` (or `cancelled`).

Transitions are enforced in `canTransitionRisk` / `transitionRiskAssessment`. Approval and activation require `risk.approve`.

## Hierarchy of controls

`elimination` → `substitution` → `engineering` → `administrative` → `ppe` (`HIERARCHY_OF_CONTROLS`).

Optional CAPA stub via `addControlAndOptionalCapa` (`source_module = risk_assessment`) — not the full CAPA product.

## Application surfaces

| Route | Purpose |
|-------|---------|
| `/app/risk-assessments` | RA list + create |
| `/app/risk-assessments/[id]` | Shared detail (hazards, controls, steps, team, workflow) |
| `/app/jsa` / `/app/jha` | Type-filtered create/list (same detail route) |
| `/app/risk-register` | Cross-assessment residual-sorted hazards |
| `/app/settings/ehs/risk-matrix` | Matrix size / name |
| Incident detail | “Create risk assessment” from report |

Services: `src/lib/services/risk.ts`. Actions: `src/app/actions/risk.ts`.

## Entitlements & permissions

| Feature | Permission |
|---------|------------|
| `risk_assessment` | `risk.view` / `risk.create` / `risk.update` / `risk.approve` |
| `jsa` | same risk permissions |
| `jha` | same risk permissions |

Tenant isolation: RLS + same-org trigger on site/project/`source_event_id` (migration `20260326000025_risk_engine_phase5.sql`).

## Migrations

1. `20260326000009_risk_assessments.sql` — core tables + matrix seed  
2. `20260326000025_risk_engine_phase5.sql` — review fields, steps, activity, source event, integrity trigger  

Apply `00025` on live Supabase before using Phase 5 UI in production.

## Future consumers

Permit to Work, inspections, and CAPA will **consume** this engine (link assessments, residual bands, controls) rather than re-implement scoring or matrices.
