# Organization Onboarding

## Overview

New organizations complete an 11-step wizard after signup. Progress is persisted in `organization_onboarding_progress` so admins can leave and resume.

## The 11 steps

Defined in `@/lib/constants/organization` as `ONBOARDING_STEPS`:

| # | Step key | Purpose |
|---|---|---|
| 1 | `welcome` | Intro / start |
| 2 | `company` | Legal name, size, address |
| 3 | `industry` | Industry selection |
| 4 | `structure` | Hierarchy depth toggles |
| 5 | `business_unit` | First business unit (optional) |
| 6 | `site` | First site |
| 7 | `project` | First project (optional) |
| 8 | `invite` | Invite teammates (optional) |
| 9 | `ehs_config` | Risk matrix / branding (optional) |
| 10 | `review` | Summary before go-live |
| 11 | `finish` | Completion |

## Optional steps

`OPTIONAL_ONBOARDING_STEPS`:

- `business_unit`
- `project`
- `invite`
- `ehs_config`

Optional steps can be **skipped** without blocking progression. Required steps (`company`, `industry`, `structure`, `site`, `review`) must be completed or the wizard cannot finish.

Check at runtime: `isOptionalStep(step)` in `@/lib/services/onboarding-progress`.

## Progress table

`organization_onboarding_progress` (one row per organization):

| Column | Description |
|---|---|
| `current_step` | Next step to show on resume |
| `completed_steps` | Steps finished normally |
| `skipped_steps` | Optional steps skipped |
| `step_data` | JSON blob of per-step form state |
| `updated_by` | Last editor |

RLS: tenant members only (`onboarding_progress_tenant` policy).

## Skip and resume

**Advance / skip** — `advanceOnboardingStep`:

- Completing a step adds it to `completed_steps` and advances `current_step` to the next entry in `ONBOARDING_STEPS`.
- Skipping (`skip: true`) adds the step to `skipped_steps` and still advances.
- Optional `stepData` merges into `step_data` for prefill on return.

**Resume** — `resumeOnboardingPath(progress, organizationId)`:

- Reads `current_step` (defaults to `welcome`).
- Returns the URL from `onboardingPathForStep`.

Path rules:

| Step | URL |
|---|---|
| `welcome`, `company` | `/onboarding?org={id}` |
| `finish` | `/onboarding/finish?org={id}` |
| Others | `/onboarding/{step}?org={id}` |

**Bootstrap** — `ensureOnboardingProgress` creates a row with `current_step: "welcome"` on first access.

## Completion

When onboarding finishes, set `organizations.onboarding_completed_at`. The app dashboard uses `getOrganizationSetupCompletion` for a post-onboarding checklist (profile, site, project, users, departments, EHS config).

## Related code

- Constants: `src/lib/constants/organization.ts`
- Service: `src/lib/services/onboarding-progress.ts`
- Migration: `supabase/migrations/20260326000023_organization_hierarchy_phase3.sql`
