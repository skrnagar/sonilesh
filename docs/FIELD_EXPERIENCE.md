# Field Experience

## Approach (Release 1)

Responsive mobile web at `/app` with field-optimized flows:

- Quick report (Incident / Near Miss / Hazard)
- Camera attachments
- Optional GPS location tagging
- CAPA status updates
- Permit view (shell)

## Principles

- Large tap targets, minimal chrome
- Offline draft sync deferred (config-ready; not Day-1 unless confirmed)
- Same RLS / entitlements as desktop
- Idempotent create for retry-safe submits

## Raksha Reports hub (`/field/reports`)

Mirrors the RakShaDashboard three-column layout from digital.kecrpg.com:

1. **User context strip** — name, BU, region, project, role, and access level from workspace cookies.
2. **Raksha Reports** — UA/UC, incidents, site visits, action items, MIS, EHS score.
3. **iQuality Reports** — checklists (live); quality analytics scaffolded with desktop redirect.
4. **Other Reports + BRSR** — profile (live); WFM/ESG items scaffolded.

Link map lives in `src/lib/field/report-links.ts`. Scaffold entries route to `/field/reports/[reportKey]` with a coming-soon card and `webHref` to the best desktop module.

### UA/UC/WSN flow (live)

| Route | Purpose |
|-------|---------|
| `/field/ualist` | Reported UA/UC/WSN list with filters and sort |
| `/field/ua-uc/new` | Report form |
| `/field/ua-uc/[id]` | Detail view |
| `/field/ua-uc` | Redirects to `/field/ualist` |

Launchpad tile **RAKSHA REPORTS** → `/field/reports` (see `raksha-launchpad.ts`).

### Next steps (field reports)

- Incidents register list (form capture is live at `/field/incident`)
- iQuality observation capture and ageing analytics
- MIS and EHS scorecard data wiring (pages scaffolded)
- BRSR / WFM registers (desktop redirect until APIs are field-ready)
