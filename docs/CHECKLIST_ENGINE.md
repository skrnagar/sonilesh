# Checklist Engine + Inspections + Audits (Phase 7)

Phase 7 delivers a **universal Checklist Engine** consumed by Inspections and Audits. Future modules (equipment, vehicle, behavioral, contractor, training, compliance, environmental, permit) reuse the same tables and services.

**PTW pre-work checklists** remain on `permit_*` tables for Phase 6 stability; they are candidates to migrate onto this engine later.

## Architecture

```
                CHECKLIST ENGINE
                       │
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
    INSPECTION       AUDIT      (future modules)
        │              │
        ↓              ↓
     Findings       Findings
        │              │
        └──────────────┼──────────────┘
                       ↓
                     CAPA
```

## Core tables

Base: `20260326000011_checklists_inspections_audits.sql`  
Enrichment: `20260326000027_checklist_engine_phase7.sql`

| Table | Role |
|-------|------|
| `checklist_templates` | Tenant templates (type, scoring, auto CAPA, threshold) |
| `checklist_sections` / `checklist_questions` / `checklist_options` | Structure |
| `checklist_assignments` | Scheduled / conducted instances (INS-/AUD- numbers) |
| `checklist_responses` | Answers + score + failing flag |
| `checklist_findings` | Findings → optional CAPA |
| `checklist_evidence` | Multi photos/files (Storage) |
| `checklist_activity` | Immutable timeline |
| `checklist_schedules` | Recurrence definitions |
| `finding_categories` | Major / Minor / Observation (+ org) |

## Services

`src/lib/services/checklists.ts`

- Templates: create, seed defaults, list, get bundle  
- Assignments: create, list, get bundle, complete (persist score), transition  
- Responses: `recordResponse` (fail → finding + optional CAPA; correct `inspection`/`audit` source)  
- Findings: list, update, link CAPA  
- Evidence: upload to `ehs-attachments`  
- Metrics: open / completed / overdue / avg score  

## Surfaces

| Route | Purpose |
|-------|---------|
| `/app/inspections` | Schedule + metrics + list |
| `/app/inspections/[id]` | Conduct, score, findings, evidence, workflow |
| `/app/audits` | Plan + list |
| `/app/audits/[id]` | Conduct + review workflow |
| `/app/findings` | Cross-module findings register |
| `/app/settings/ehs/checklists` | Template builder |
| `/field/inspection` | Mobile runner (scores on submit) |

## Entitlements

- Features: `inspections`, `audits`  
- Permissions: `inspections.*`, `audits.*`, `checklists.manage`, `findings.view`, `findings.manage`

## Scoring

`computeScore` ignores N/A. `completeAssignment` persists `score_percent`, totals, and `findings_count`.

## CAPA

- Template `auto_capa_on_fail`  
- Manual link from finding (`linkFindingToCapa`)  
- `source_module` = `inspection` or `audit`

## Apply

Run migration **`00027`** on live Supabase before production use.
