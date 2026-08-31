# EHS360 Database Assessment

**Migrations:** `supabase/migrations/` (44 files). **Do not rewrite history.**

---

## Current hierarchy

```
organizations → business_units → sites → projects → departments → locations
```

**Gap:** no `regions` table.

**Context cookies:** org, site, project (`src/lib/auth/org-context.ts`).

---

## Core tables (reuse)

| Domain | Tables |
|--------|--------|
| Reporting | `ehs_events`, `event_types`, `event_categories`, `severity_levels`, `investigations` |
| CAPA | `capa_items`, `action_items` |
| PTW | `permits`, `permit_types`, `permit_approvals`, `permit_extensions` |
| Checklists | `checklist_templates`, `checklist_assignments`, `checklist_findings` |
| Risk | `risk_assessments`, `risk_hazards`, `risk_matrices` |
| RBAC | `roles`, `permissions`, `role_permissions`, `member_roles` |
| Commercial | `features`, `plans`, `subscriptions`, `marketplace_*` |

---

## Reporting engine

Single table `ehs_events` for incident, near_miss, hazard, unsafe_act, unsafe_condition, safety_observation.

Status enum: `draft`, `submitted`, `triage`, `investigation`, `capa`, `verification`, `approval`, `closed`, `reopened`, `cancelled`.

Recent: LTI/Fatal severities + UA/UC categories (`20260820000001`).

---

## Proposed forward migrations

### regions

Link sites to business units through regions; add `region_id` on `sites`.

### lmra_assessments

Dedicated LMRA with `draft/submitted/approved/rejected`, risks/controls jsonb, optional `permit_id`.

### site_visits + site_visit_findings

Types: `hsv`, `rsv`, `tsv`.

### mis_periods + mis_submissions

Period-bound MIS with approval workflow.

### ehs_score_periods + ehs_score_dimensions + ehs_score_values

Scorecard with dimensional scoring and site/project/region grain.

### ehs_events extensions

`allocated_to_member_id`, `allocated_at`, `assignee_closed_at`, `final_closed_at`, etc.

### workflow_definitions (Phase 10)

Configurable state machines per module.

### report_definitions

Report Hub scheduled exports.

---

## Duplicates to avoid

- Keep `notifications` (not `in_app_notifications`)
- Don't add fourth attachment pattern
- Unified CAPA source polymorphism

---

## RLS

All new tables: `organization_id` + policies matching `20260326000006_rls_policies.sql` patterns.

Regenerate `src/types/database.ts` after apply.

---

## Full migration inventory

| File | Domain |
|------|--------|
| `20260326000001` | Extensions, helpers |
| `20260326000002` | Foundation tenancy, RBAC, org structure |
| `20260326000003` | Subscriptions, entitlements |
| `20260326000004` | Platform admin, audit |
| `20260326000005` | EHS events core |
| `20260326000006` | RLS policies |
| `20260326000007` | Seed permissions, roles, features |
| `20260326000008`–`18` | Onboarding, risk, permits, checklists, CAPA, supporting |
| `20260326000023` | Hierarchy phase 3 (member scope enrichment) |
| `20260326000024` | Reporting engine phase 4 |
| `20260326000025`–`27` | Risk, PTW, checklist engines |
| `20260326000032` | Contractor engine |
| `20260326000033`–`35` | Regulatory, ESG, gap fill |
| `20260326000040` | Executive analytics (verify live apply) |
| `20260326000050` | AI copilot (verify live apply) |
| `20260326000060` | Integration + production hardening |
| `20260818000001`–`03` | RLS + admin-only hierarchy writes |
| `20260820000001` | LTI/Fatal + UA/UC incident classifications |

---

## Table count by domain (~80+ public tables)

Foundation: `profiles`, `organizations`, `organization_settings`, `organization_members`, `business_units`, `sites`, `projects`, `departments`, `locations`

Events: `ehs_events` + 6 child tables, `event_types`, `event_categories`, `severity_levels`, `investigations`

CAPA: `capa_items`, `action_items`

PTW: `permits` + 4 child tables, `permit_types`

Checklists: 8 tables from `20260326000011`

Risk: `risk_assessments`, `risk_hazards`, `risk_controls`, `risk_matrices`, `risk_assessment_types`

Supporting: training (4), contractor (3+), PPE (4), chemicals (2), documents (3), MOC, toolbox (2)

Compliance/ESG: 20+ tables in `20260326000020`, `20260326000033`

Control plane: plans, subscriptions, usage, marketplace, audit_logs

---

## Assessment conclusion

**Reuse ~75%** of schema for enterprise rebuild. Add region, LMRA, visits, MIS, scorecard via forward migrations. Extend `ehs_events` for UA/UC allocation rather than new observation tables.
