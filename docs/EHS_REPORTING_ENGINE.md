# EHS Reporting Engine (Phase 4)

Phase 4 delivers a **shared reporting engine** on top of the existing `ehs_events` table. Incidents, near misses, hazards, unsafe acts/conditions, and safety observations are **report types**, not separate CRUD subsystems.

## Design principle: one table, many types

All report types share:

| Concern | Implementation |
|--------|----------------|
| Storage | `public.ehs_events` |
| Type discriminator | `event_types.code` → FK `event_type_id` |
| Workflow status | `ehs_events.status` (`EhsEventStatus`) |
| Numbering | `next_event_number()` RPC + `number_sequences` |
| Activity | `ehs_event_activity` |
| Attachments | `ehs_event_attachments` + Storage bucket `ehs-attachments` |
| CAPA link | `capa_items.source_record_id` + `createCAPAFromReport` |

Application code lives in `src/lib/services/events.ts` (create, transition, list) with type metadata in `src/lib/reporting/types.ts`.

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Web / Field UI │────▶│  events.ts       │────▶│  ehs_events     │
│  Server Actions │     │  workflow.ts     │     │  + event_types  │
└─────────────────┘     └────────┬─────────┘     └────────┬────────┘
                                 │                        │
                                 ▼                        ▼
                        ┌────────────────┐        ┌─────────────────────┐
                        │ capa-bridge.ts │        │ custom fields, RLS  │
                        │ attachments.ts │        │ number_sequences    │
                        └────────────────┘        └─────────────────────┘
```

## Report types

Six report types are defined in `REPORT_TYPE_CODES` (`src/lib/reporting/types.ts`):

| Code | Label | Number prefix | Feature key | Create permission |
|------|-------|---------------|-------------|-------------------|
| `incident` | Incident | `INC-` | `incident_management` | `incidents.create` |
| `near_miss` | Near Miss | `NM-` | `near_miss` | `near_miss.create` |
| `hazard` | Hazard | `HZ-` | `hazard_reporting` | `hazards.create` |
| `unsafe_act` | Unsafe Act | `UA-` | `hazard_reporting` | `hazards.create` |
| `unsafe_condition` | Unsafe Condition | `UC-` | `hazard_reporting` | `hazards.create` |
| `safety_observation` | Safety Observation | `SO-` | `hazard_reporting` | `hazards.create` |

Hazard-family types (`hazard`, `unsafe_act`, `unsafe_condition`, `safety_observation`) share the `hazard_reporting` entitlement. Incidents and near misses have dedicated feature keys.

### Required fields (validation contract)

`requiredFieldsForType()` encodes the minimum payload per type before submit:

- **incident:** `occurredAt`, `siteId`, `description`, `severityId`
- **near_miss:** `occurredAt`, `siteId`, `description`, `potentialSeverityId`
- **hazard:** `siteId`, `description`, `categoryId`
- **unsafe_act / unsafe_condition:** `siteId`, `description`
- **safety_observation:** `siteId`, `description`, `observationPolarity`

Phase 4 columns on `ehs_events` support these fields: `potential_severity_id`, `observation_polarity`, `latitude`, `longitude`, `source`, `requires_capa`.

## Custom fields

Organizations can extend forms without schema migrations per field.

### Definitions — `report_custom_field_definitions`

Per org + event type:

- `code`, `label`, `field_type` (see `CUSTOM_FIELD_TYPES` in types.ts)
- `options` (JSON for select types), `is_required`, `sort_order`
- Scoped by `organization_id` + `event_type_id`

Supported field types: text, long_text, number, date, datetime, boolean, single_select, multi_select, user, site, project, department, location, attachment.

### Values — `report_custom_field_values`

One row per `(event_id, field_definition_id)` with typed columns:

- `value_text`, `value_number`, `value_boolean`, `value_date`, `value_json`

Service helpers: `listCustomFieldDefinitions`, `upsertCustomFieldDefinition`, `saveCustomFieldValues` in `src/lib/services/attachments.ts`.

A trigger (`assert_custom_field_same_org`) rejects values when the event, definition, and value row disagree on `organization_id`.

## Numbering — `next_event_number`

Human-readable IDs are allocated via the `next_event_number(p_organization_id, p_sequence_key, p_prefix)` RPC (migration `20260326000024_reporting_engine_phase4.sql`).

Behavior:

1. Upsert into `number_sequences` for `(organization_id, sequence_key)` with default `pad_length = 5`, `include_year = true`.
2. Atomically increment `current_value`.
3. Return `{prefix}{YYYY}-{padded}` when `include_year` is true, else `{prefix}{padded}`.

Example: `INC-2026-00042`. Prefixes come from `REPORT_TYPE_META.prefix`; sequence keys typically match event type codes.

`events.ts` calls the RPC in `allocateEventNumber()` with a JS fallback if RPC is unavailable.

## Permissions and entitlements

On create and transition, `events.ts` resolves:

- **Feature:** `REPORT_TYPE_META[code].featureCode` → `requireFeature()`
- **Permission:** `permissionCreate` / view paths from metadata → `requirePermission()`

| Report type | Feature | View permission (typical) |
|-------------|---------|---------------------------|
| incident | `incident_management` | `incidents.view` |
| near_miss | `near_miss` | `near_miss.view` |
| hazard family | `hazard_reporting` | `hazards.view` |

Plans gate modules via `plan_features`. Migration seeds `safety_observation` feature for plans that already have `hazard_reporting`.

UI surfaces use `requireModuleAccess()` and `<FeatureGate>` with the same feature codes.

## Tenant isolation and RLS

All reporting data is org-scoped:

- `ehs_events.organization_id` — primary tenant key; existing RLS on events applies.
- New Phase 4 tables enable RLS in migration `20260326000024`:

| Table | Select | Mutate |
|-------|--------|--------|
| `report_status_definitions` | System rows (`organization_id IS NULL`) or org member | Platform admin or `settings.manage` |
| `report_custom_field_definitions` | Org member | Platform admin or `settings.manage` |
| `report_custom_field_values` | Org member | Org member (insert/update) |
| `report_category_templates` | Any authenticated user | Platform-managed seed data |

Cross-tenant writes are blocked at the database layer; services additionally verify `organization_id` on reads and uploads.

## Mobile field flow — `/field/report`

Field users reach the report hub at `/field/report` (`src/app/field/report/page.tsx`):

1. Resolve field role via `resolveFieldRole()`.
2. Filter actions with `canFieldAction()` (`report_incident`, `report_near_miss`, `report_hazard`).
3. Route to type-specific forms (`/field/incident`, `/field/near-miss`, `/field/hazard?type=…`).

Submissions call the same `createEhsEvent()` path as desktop with `source: 'field'`. Optional GPS (`latitude` / `longitude`) and photo attachments use `uploadReportAttachment()`.

Principles (see `docs/FIELD_EXPERIENCE.md`): large tap targets, same RLS/entitlements as web, idempotent-friendly creates.

## Workflow interface — `src/lib/services/workflow.ts`

Phase 4 exposes **stable call sites** for a future workflow engine; logic today delegates to `events.ts`.

| Function | Role |
|----------|------|
| `startWorkflow()` | Returns `{ engine: "reporting_builtin_v1", status }` — placeholder hook after create |
| `workflowCanTransition(from, to)` | Delegates to `canTransition()` |
| `workflowTransition()` | Validates transition, calls `transitionEhsEvent()` |

Built-in status graph (service layer):

```
draft → submitted → triage → investigation → capa → verification → approval → closed
                                                              ↘ reopened
cancelled is terminal from early states
```

`report_status_definitions` seeds system labels/colors per event type for future UI customization; transitions remain enforced in TypeScript until a configurable engine lands.

## CAPA bridge — `capa-bridge.ts`

`createCAPAFromReport()` links a report to the central CAPA module:

1. Load report + `event_types.code`.
2. Map type → `source_module` via `capaSourceModuleForType()`.
3. Call `createCapa()` with `sourceRecordId = reportId`, `eventId = reportId`.
4. Set `ehs_events.requires_capa = true`, `status = 'capa'`.
5. Write activity + audit log.

`capaSourceModuleForType()` returns type-specific modules (`incident`, `near_miss`, `hazard`, etc.) or `ehs_report` for unknown codes.

Migration expands `capa_items.source_module_check` to include all report type codes plus `ehs_report`.

## Attachments — private bucket `ehs-attachments`

| Step | Detail |
|------|--------|
| Upload | `uploadReportAttachment()` → Storage path `{orgId}/events/{eventId}/{timestamp}-{filename}` |
| Bucket | `ehs-attachments` (private) |
| Metadata | Row in `ehs_event_attachments` |
| Download | `createSignedAttachmentUrl()` — time-limited signed URL (default 3600s) |
| Validation | Max 15 MB; allowed MIME types for images, PDF, Office docs |

Tenant check: upload verifies the event belongs to `organizationId` before writing to Storage.

## Categories

`report_category_templates` holds system seed categories per event type. `seed_org_report_categories(org_id)` copies templates into `event_categories` for new orgs.

## Migration reference

**File:** `supabase/migrations/20260326000024_reporting_engine_phase4.sql`

Key changes:

- `safety_observation` event type + feature + plan seeding
- `ehs_events` columns: `requires_capa`, `potential_severity_id`, geo, `source`, `observation_polarity`
- Tables: `report_status_definitions`, `report_custom_field_definitions`, `report_custom_field_values`, `report_category_templates`
- `number_sequences.include_year`, `format_pattern`
- `next_event_number()` function
- RLS policies + org-consistency trigger on custom field values
- CAPA `source_module` constraint update

## Related code paths

| Path | Purpose |
|------|---------|
| `src/lib/reporting/types.ts` | Type codes, metadata, validation helpers |
| `src/lib/services/events.ts` | CRUD, transitions, numbering, notifications |
| `src/lib/services/workflow.ts` | Workflow facade (stub) |
| `src/lib/services/capa-bridge.ts` | Report → CAPA |
| `src/lib/services/attachments.ts` | Uploads, signed URLs, custom fields |
| `src/app/app/reporting/queue/page.tsx` | Triage inbox |
| `src/app/field/report/page.tsx` | Mobile report hub |

## Out of scope (Phase 4)

Risk Assessment and Permit modules are **not** part of this phase. Do not implement separate CRUD stacks for report types — extend `ehs_events` and shared services instead.
