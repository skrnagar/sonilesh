# RAKSHA Reference Requirements

**Purpose:** Structured requirements extracted from KEC RAKSHA user guides (PDFs) and the Safety App Permission Matrix (Excel). Use as the authoritative reference for parity work against legacy RAKSHA / KEC MyZone.

**Sources (Downloads):**

| File | Date in doc | Pages |
|------|-------------|-------|
| `SafetyApp-Permission-Matrix...xlsx` | — | 1 sheet, 9 modules |
| `User Guide for UA & UC Reporting.pdf` | 05 May 2020 | 19 |
| `User Guide for Team Safety Visit.pdf` | 07 May 2020 | 25 |
| `User Guide for Raksha Report.pdf` | 06 Aug 2020 | 14 |
| `User Guide for Online MIS Reporting.pdf` | 05 May 2020 | 18 |
| `User Guide for My zone-Work Permit.pdf` | — | 11 |
| `User Guide for My zone-LMRA (1) 1.pdf` | — | 9 |
| `User Guide for My zone (1).pdf` | — | 6 |
| `User Guide for EHS Score Card.pdf` | 17 Jul 2020 | 28 |

**Platform URLs referenced in docs:**

- RAKSHA app/web: `https://digital.kecrpg.com`
- KEC MyZone (Work Permit / LMRA): `https://digital.kecrpg.com/myzone/login`

**Screenshot-inferred modules (not fully documented in PDFs):**

Launchpad tiles — RAKSHA REPORTS, UA/UC/WSN, INCIDENT, HSV/RSV, TSV/HSR/RSR/WER, UTILITIES, TRAINING, EHS MIS REPORT, EHS SCORE CARD, NC, CHECKLIST, LMRA, WORK PERMIT, BBS.

Report Hub — Raksha Reports (UA UCs, Incidents, HSVRSV, TSV, Action Items, EHS MIS Status, BU/Region EHS Score), iQuality, Other Reports, BRSR.

KEC BI — UA & UC Reporting (division, region multi-select, project, type, date filters; open/closed table; donut chart).

Login — KEC User vs NON-KEC User split.

---

## 1. Per-module requirements

### 1.1 Authentication & onboarding

| ID | Requirement | Source |
|----|-------------|--------|
| AUTH-01 | Landing page offers **KEC EMPLOYEE** vs **NON-KEC USER** login paths | Screenshots |
| AUTH-02 | KEC login: company mail ID + password → Sign in | All RAKSHA PDFs |
| AUTH-03 | MyZone login: mail ID + password at `/myzone/login` or MyZone app | Work Permit, LMRA |
| AUTH-04 | Registration: choose device, download app, sign in, choose user type, enter mail/password, register details | Raksha Report, EHS Score Card |
| AUTH-05 | Password issues → contact IT Support | Work Permit, LMRA |

### 1.2 UA / UC / WSN

**Workflow (4 steps):**

```
Report → SO Allocate → User Close Action → SO Final Closure
```

| ID | Requirement | Source |
|----|-------------|--------|
| UAUC-01 | **Anyone** may report UA/UC (KEC and non-KEC employees) | UA/UC PDF p.2 |
| UAUC-02 | Reporters include: Execution Team (User), Safety Officer, PM, RM-EHS, RM-Execution, and anyone | UA/UC PDF p.5 |
| UAUC-03 | Launchpad tile: **UA/UC** opens reporting format | UA/UC PDF p.5 |
| UAUC-04 | **Fields:** Business Unit, Region, Project, UA or UC, Category, Subcategory, Incident Description, Incident Date & Time, Location | UA/UC PDF p.6 |
| UAUC-05 | **Photo attachments mandatory** — browse/upload from device; others must understand the observation | UA/UC PDF p.7–8 |
| UAUC-06 | On submit → appears in UA/UC list; **notification to project Safety Officer** | UA/UC PDF p.8 |
| UAUC-07 | SO opens reported UA/UC from list (e.g. UC007589); options: **Allocate Action** or **Close UA/UC** | UA/UC PDF p.9–10 |
| UAUC-08 | Allocate popup: action item text, action type, allocated-to person, expected due date → **ALLOCATE ACTION** | UA/UC PDF p.11 |
| UAUC-09 | Allocated user sees **notification bell** on Launchpad → Allocated Action list | UA/UC PDF p.12–13 |
| UAUC-10 | User closes action: status **CLOSED** → remarks + closure photos → **CLOSE ACTION** | UA/UC PDF p.14–15 |
| UAUC-11 | SO reviews closure: **Case A** relevant → close UA/UC; **Case B** not relevant → re-allocate | UA/UC PDF p.16 |
| UAUC-12 | SO final closure: Close UA/UC → Yes Close → remarks + optional photo (skip if user photo sufficient) → CLOSE ACTION | UA/UC PDF p.17–19 |
| UAUC-13 | Record status: **Open / Close** | Raksha Report PDF p.8 |
| UAUC-14 | WSN grouped with UA/UC in permission matrix (module **UA/UC/WSN**) | Permission Matrix |

**Roles:**

| Role | Capabilities |
|------|--------------|
| All roles (14) | Create |
| Safety Officer | Allocate, action close, final closure, delete/cancel |
| User / Site Engineer / QC / Section In-Charge / PM | Action close |
| Admin | Delete/cancel |
| Nobody | Edit after create |

### 1.3 Incidents (IR)

No dedicated incident PDF. Requirements inferred from **Raksha Reports** guide and permission matrix.

| ID | Requirement | Source |
|----|-------------|--------|
| IR-01 | Launchpad tile: **INCIDENT** | Screenshots |
| IR-02 | My Zone → Incidents: list all reported incidents, **Major / Minor** classification | Raksha Report PDF p.9 |
| IR-03 | Expand (+) to explore Major/Minor incidents | Raksha Report PDF p.9 |
| IR-04 | Click incident number for detail view | Raksha Report PDF p.9 |
| IR-05 | Filters: SBU / Region / Project / date range; download | Raksha Report PDF p.9 |
| IR-06 | Same action-allocation workflow as UA/UC (allocate → close → final closure) | Permission Matrix |
| IR-07 | Delete: Safety Officer, Project Manager, Admin | Permission Matrix |

### 1.4 Team Safety Visit (TSV)

Guide title references TSV; steps also label HSV/RSV in places. PM is the creator.

| ID | Requirement | Source |
|----|-------------|--------|
| TSV-01 | **Only Project Manager** can create/fill TSV | TSV PDF p.4 |
| TSV-02 | Launchpad tile: **TSV** | TSV PDF p.4 |
| TSV-03 | List page shows all TSV with details; **CREATE TSV** for new | TSV PDF p.5 |
| TSV-04 | **Fields:** Business Unit, Region, Project, Location, Date | TSV PDF p.6 |
| TSV-05 | **Mandatory relevant pictures** (browse/upload) | TSV PDF p.7–9 |
| TSV-06 | Fill all **checklist item parameters** + comments | TSV PDF p.10 |
| TSV-07 | Submit → notification to project Safety Officer | TSV PDF p.11 |
| TSV-08 | SO can allocate only **STATUS-OPEN** TSV | TSV PDF p.12 |
| TSV-09 | Allocate action popup: action item, type, allocated-to, due date | TSV PDF p.14 |
| TSV-10 | User closes observation: CLOSED status, remarks, photos | TSV PDF p.17–18 |
| TSV-11 | On user close → notification to **Safety Officer and Project Manager** | TSV PDF p.19 |
| TSV-12 | SO + PM review: relevant → PM closes TSV; not relevant → SO re-allocates | TSV PDF p.20 |
| TSV-13 | PM final close: Close TSV → Yes Close → remarks + photos → Close TSV → Yes Close | TSV PDF p.21–24 |
| TSV-14 | Status: **Open / Closed** | TSV PDF p.12 |

**Flowchart (authoritative):**

```
TSV Created by PM → SO Notified → SO Allocates → User Closes Observation
→ PM & SO Review → [IF evidence satisfactory] PM Closes TSV
                  → [IF NOT] SO Re-allocates
```

**Roles (matrix):** Create/Edit/Delete — **PM only** (+ Admin delete). Allocate — SO. Final closure — SO.

### 1.5 HSV / RSV

No dedicated PDF workflow. Covered in Raksha Reports and permission matrix.

| ID | Requirement | Source |
|----|-------------|--------|
| HSV-01 | Launchpad: **HSV/RSV** tile; also HSR/RSR/WER grouping in screenshots | Screenshots |
| HSV-02 | My Zone → HSV/RSV: list all reported HSV/TSV; expand region-wise (+) | Raksha Report PDF p.10 |
| HSV-03 | Serial number opens detail; filters + download same as UA/UC | Raksha Report PDF p.10 |
| HSV-04 | **HSV Create/Edit/Delete:** Profit Center Head, Vertical Head (Civil SBU), BU Head | Permission Matrix |
| HSV-05 | **RSV Create/Edit:** Regional Manager, Regional Manager (Civil SBU) | Permission Matrix |
| HSV-06 | Allocate / final closure: Safety Officer | Permission Matrix |

### 1.6 EHS MIS Report

| ID | Requirement | Source |
|----|-------------|--------|
| MIS-01 | Launchpad tile: **EHS MIS REPORT** | MIS PDF p.3 |
| MIS-02 | Select Business Unit, Region, Project, **Month** | MIS PDF p.4 |
| MIS-03 | Select Regional EHS Manager, Project Manager, Location | MIS PDF p.5 |
| MIS-04 | Parameter sections (e.g. BASIC DATA, INCIDENT RECORD / Leading Parameters) with coded rows (e.g. HS01); default value **0** | MIS PDF p.6–8 |
| MIS-05 | **Save as Draft** after completing each parameter section | MIS PDF p.9 |
| MIS-06 | Submit MIS → goes to RM-EHS | MIS PDF p.10 |
| MIS-07 | RM-EHS reviews scrollable parameter page | MIS PDF p.11–12 |
| MIS-08 | **Approve path:** RM-EHS Approve → SBU-EHS Head Approve → Central EHS Team | MIS PDF p.13, 20 |
| MIS-09 | **Reject path:** RM-EHS Reject → Yes Close → **mandatory rejection comment** → Reject MIS → returns to SO for edits | MIS PDF p.13–19 |
| MIS-10 | My Zone MIS Status: filter by month/year; statuses **Submitted / Approved by RM-EHS / Approved by SBU Head**; multi-month compile | Raksha Report PDF p.12–13 |

**Roles (matrix):** Create/Edit/Delete — **Safety Officer only**. Approve/Reject — **RM-EHS, BU EHS Head**.

### 1.7 EHS Score Card

| ID | Requirement | Source |
|----|-------------|--------|
| SC-01 | Launchpad tile: **EHS SCORE CARD** | Score Card PDF p.5 |
| SC-02 | **Self Assessment** — Safety Officer / EHSO | Score Card PDF p.6 |
| SC-03 | **Cross Audit** — RM-EHS | Score Card PDF p.6 |
| SC-04 | **Central EHS** can assess any SBU | Score Card PDF p.6 |
| SC-05 | SBU-specific assessment sheet (e.g. Transmission only for Transmission users) | Score Card PDF p.7 |
| SC-06 | **Header fields:** Region, Project, Regional Manager, PM, PCH, Location, No. of Workmen, Assessment Date | Score Card PDF p.9 |
| SC-07 | **Parameter sections (sequential):** MMR → OER → EPP → L&MC → Negative Score Criteria | Score Card PDF p.9–15 |
| SC-08 | Each sub-point: **Applicable / Not Applicable**, **Percentage compliance** (dropdown range), remark | Score Card PDF p.9–10 |
| SC-09 | Compliance value **auto-calculated** from percentage selection | Score Card PDF p.10–11 |
| SC-10 | Navigation: **Save as Draft**, **Save as Next**, **Previous**, final **Submit** | Score Card PDF p.10–15 |
| SC-11 | Submitted sheet shows **Self Assessment Score**, prepared-by, date, per-parameter compliance in remarks | Score Card PDF p.16–17 |
| SC-12 | Expand (+) sub-parameters and sub-points for drill-down compliance | Score Card PDF p.18–19 |
| SC-13 | **Download** Word, Excel, PDF | Score Card PDF p.20–21 |
| SC-14 | RM-EHS: view SO self-assessment → **ADD RM EHS SCORE** → parallel assessment → separate RM-EHS score column | Score Card PDF p.22–28 |
| SC-15 | My Zone / Report Hub: **BU/Region EHS Score** | Screenshots |

**Roles (matrix):** Create/Edit/Delete — **Safety Officer, Admin**.

### 1.8 Work Permit (PTW)

Accessed via **KEC MyZone → Raksha → Work Permit** (not RAKSHA Launchpad in PDF).

| ID | Requirement | Source |
|----|-------------|--------|
| PTW-01 | **User (issuer of work):** Site Engineer / Supervisor / Foreman (KEC) | Work Permit PDF p.2 |
| PTW-02 | **Issuer (approver):** Section In-Charge (Area In-Charge / HOD / Construction Manager); fallback **PM** | Work Permit PDF p.2 |
| PTW-03 | **Reviewer/Assessor:** Safety Officer (ESHO) | Work Permit PDF p.2 |
| PTW-04 | **Closure:** User (Site Engineer / Supervisor / Foreman) | Work Permit PDF p.2 |
| PTW-05 | Permit duration **≤ 12 hours**; extension request max 12 hours before close | Work Permit PDF p.2 |
| PTW-06 | Rejected/cancelled permit must be **re-issued** after rectification | Work Permit PDF p.2 |
| PTW-07 | Permit **expires immediately** after validity if not closed | Work Permit PDF p.2 |
| PTW-08 | Unchecked checklist points = **"Not done"** | Work Permit PDF p.2 |
| PTW-09 | ADD Work Permit → select permit document type → fill checklist (**no blank fields**) | Work Permit PDF p.5 |
| PTW-10 | **Issued to:** sub-contractor representative / supervisor + company name (manual) | Work Permit PDF p.5 |
| PTW-11 | Attach working-location photo (**JPG/JPEG only**) | Work Permit PDF p.6 |
| PTW-12 | Assign issuer from dropdown → Submit → status **PENDING** | Work Permit PDF p.6 |
| PTW-13 | On submit: email + PDF to Issuer (To), User (CC) | Work Permit PDF p.6 |
| PTW-14 | Issuer: Approve (no deviation) or Reject → forward to ESHO in "Review by EHSO" | Work Permit PDF p.7 |
| PTW-15 | Issuer status: **APPROVED** or **Rejected**; email + PDF per outcome | Work Permit PDF p.7 |
| PTW-16 | ESHO: OKAY (verify) or Cancel → **Verified by EHS** / **Cancelled by EHS** | Work Permit PDF p.8 |
| PTW-17 | Extension: User Extend → ESHO Verify Extension / Cancel → Issuer Approve Extension | Work Permit PDF p.9 |
| PTW-18 | User Close Permit: closure action + remarks → status **CLOSED** | Work Permit PDF p.10 |

**Statuses:** PENDING → APPROVED/REJECTED (Issuer) → Verified by EHS / Cancelled by EHS (ESHO) → CLOSED (User); extension sub-flow.

### 1.9 LMRA (Last Minute Risk Assessment)

Accessed via **KEC MyZone → Raksha → LMRA**.

| ID | Requirement | Source |
|----|-------------|--------|
| LMRA-01 | Applicable for **all site activities** | LMRA PDF p.3 |
| LMRA-02 | **User:** Site Engineer / Supervisor / Foreman | LMRA PDF p.3 |
| LMRA-03 | **Step 1 — Entry:** site details, risks identified, controls taken → submit for ESHO approval | LMRA PDF p.3 |
| LMRA-04 | **Step 2 — Approval:** ESHO Approve/Reject after verification | LMRA PDF p.3 |
| LMRA-05 | ADD LMRA → fill all fields → assign ESHO via **ASSIGNED TO** dropdown | LMRA PDF p.5 |
| LMRA-06 | Attach site photo in file attachments | LMRA PDF p.7 |
| LMRA-07 | Status **Pending** on submit; email To ESHO, CC User | LMRA PDF p.7 |
| LMRA-08 | ESHO outcome: **Approved / Rejected**; email To User, CC ESHO | LMRA PDF p.8 |

### 1.10 Raksha Reports / My Zone (operational reporting)

| ID | Requirement | Source |
|----|-------------|--------|
| RPT-01 | Launchpad → **MY ZONE** → **Raksha Reports** | Raksha Report PDF p.5–6 |
| RPT-02 | Access: **all roles except basic "User"** (example: RM-EHS) | Raksha Report PDF p.6 |
| RPT-03 | Report types: **UA/UC**, **Incidents**, **HSV/RSV**, **Action Items**, **EHS MIS Status**, **Installation Status (Site Wise)** | Raksha Report PDF p.7–14 |
| RPT-04 | Common filters: SBU / Region / Project (multi-select) + date range calendar → **View Reports** | Raksha Report PDF p.8 |
| RPT-05 | **Refresh** and **Back** controls on report pages | Raksha Report PDF p.7 |
| RPT-06 | **Download** via save option | Raksha Report PDF p.8 |
| RPT-07 | UA/UC list: serial number → detail; Open/Close status column | Raksha Report PDF p.8 |
| RPT-08 | Action Items: filter by status **Open / In progress / Closed**; region-wise expand (+) | Raksha Report PDF p.11 |
| RPT-09 | EHS MIS Status: month/year dropdown; drill region → project → view MIS; compile 2–4 months in one sheet | Raksha Report PDF p.12–13 |
| RPT-10 | Installation Status: SBU/Region/Location; status **Pending / Installed**; shows employee name, User ID, Mail ID | Raksha Report PDF p.14 |

### 1.11 NC (Non-Conformance)

No PDF. Matrix-only module.

| ID | Requirement | Source |
|----|-------------|--------|
| NC-01 | Launchpad tile: **NC** | Screenshots |
| NC-02 | Create/Delete: RM, RM (Civil SBU), PCH, Vertical Head, BU Head, RM-EHS, BU EHS Head, Admin | Permission Matrix |
| NC-03 | Allocate: Safety Officer, Project Manager | Permission Matrix |
| NC-04 | Final closure: Safety Officer, Project Manager | Permission Matrix |
| NC-05 | No edit after create (all roles No) | Permission Matrix |

### 1.12 Checklist

No dedicated PDF. Matrix-only.

| ID | Requirement | Source |
|----|-------------|--------|
| CL-01 | Launchpad tile: **CHECKLIST** | Screenshots |
| CL-02 | Create/Edit: User, Site Engineer, QC Engineer, Section In-Charge, PM | Permission Matrix |
| CL-03 | Delete: Section In-Charge, Admin (+ SO yes in matrix — inconsistent casing) | Permission Matrix |
| CL-04 | No allocate/close/final-closure workflow in matrix (all NA) | Permission Matrix |

### 1.13 Modules visible in screenshots — no PDF coverage

| Module | Notes | Gap severity |
|--------|-------|--------------|
| **UTILITIES** | Launchpad tile only | High — no workflow, fields, or roles |
| **TRAINING** | Launchpad tile only | High — no workflow in reference set |
| **BBS** | Launchpad tile only | High — no workflow in reference set |
| **WSN** | Bundled in UA/UC/WSN matrix module; no separate workflow doc | Medium |
| **HSR / RSR / WER** | Grouped under TSV/HSR/RSR/WER in screenshots | High — no dedicated guide |
| **iQuality** | Report Hub tile | High — no guide |
| **Other Reports** | Report Hub tile | Medium |
| **BRSR** | Report Hub tile | Medium — may be separate ESG scope |
| **NON-KEC USER** | Login path only | Medium — no registration/permission doc |

---

## 2. Permission matrix summary

**Source sheet:** `CommunicationMatrix (2)` in `SafetyApp-Permission-Matrix...xlsx`

**Roles (14):** Safety Officer, User, Site Engineer, QC Engineer, Section In-Charge, Project Manager, Regional Manager, Regional Manager (Civil SBU), Profit Center Head, Vertical Head (Civil SBU), Business Unit Head, Regional Manager EHS, BU EHS Head, Admin

**Actions per module (7):** Create, Edit, Delete/Cancel, Approve/Reject, Action Allocate, Action Close, Final Closure of Observation

### 2.1 Matrix by module

| Module | Create | Edit | Delete | Approve/Reject | Allocate | Action Close | Final Close |
|--------|--------|------|--------|----------------|----------|--------------|-------------|
| **UA/UC/WSN** | All 14 | None | SO, Admin | NA | SO | SO, User, SE, QC, SI, PM | SO |
| **IR** | All 14 | None | SO, PM, Admin | NA | SO | SO, User, SE, QC, SI, PM | SO |
| **NC** | RM+, EHS heads, Admin | None | Same as create | NA | SO, PM | SO, User, SE, QC, SI, PM | SO, PM |
| **HSV** | PCH, VH, BU Head | PCH, VH, BU Head | PCH, VH, BU Head, Admin | NA | SO | SO, User, SE, QC, SI, PM | SO |
| **RSV** | RM, RM Civil | RM, RM Civil | RM Civil, Admin | NA | SO | SO, User, SE, QC, SI, PM | SO |
| **TSV** | PM | PM | PM, Admin | NA | SO | SO, User, SE, QC, SI, PM | SO |
| **Checklist** | User, SE, QC | User, SE, QC, SI, PM | SI, Admin | NA | — | — | NA |
| **MIS** | SO | SO | SO | RM-EHS, BU EHS Head | NA | NA | NA |
| **ScoreCard** | SO, Admin | SO, Admin | SO, Admin | NA (SO=No) | NA | NA | None |

*RM+ = Regional Manager, Regional Manager (Civil SBU), Profit Center Head, Vertical Head (Civil SBU), Business Unit Head, Regional Manager EHS, BU EHS Head, Admin*

### 2.2 Cross-module patterns

1. **Observation modules** (UA/UC/WSN, IR, NC, HSV, RSV, TSV) share the allocate → action close → final closure pattern; Safety Officer is always the allocator and (usually) final closer.
2. **Edit is universally disabled** for observation modules after creation.
3. **MIS and ScoreCard** use approval/calculation workflows, not action allocation.
4. **Checklist** is a standalone CRUD module without the observation closure chain.
5. **Admin** has elevated delete on most modules; **Safety Officer** is the operational hub for field safety workflows.

---

## 3. BI / reporting requirements

### 3.1 KEC BI — UA & UC Reporting (screenshots)

| ID | Requirement |
|----|-------------|
| BI-01 | Filters: **Division**, **Region** (multi-select), **Project**, **Type**, **Date** range |
| BI-02 | Summary table: UA / UC / WSN counts — **open vs closed** |
| BI-03 | **Donut chart** visualization of UA/UC/WSN distribution |
| BI-04 | Instant filter application (no full page reload implied by "instant UI" target) |

### 3.2 Raksha Reports (My Zone / Report Hub)

| ID | Requirement |
|----|-------------|
| BI-05 | Hierarchical scope: SBU → Region → Project (multi-select projects) |
| BI-06 | Date-range picker (calendar) on all operational reports |
| BI-07 | Status filters: Open/Close (UA/UC), Open/In progress/Closed (Action Items), Submitted/Approved stages (MIS) |
| BI-08 | Region-wise and project-wise **expand (+)** drill-down |
| BI-09 | Serial-number / incident-number **detail navigation** from list |
| BI-10 | **Export/download** (save option) on all report views |
| BI-11 | MIS Status: month/year selector; **multi-month compile** (2–4 months in one sheet) |
| BI-12 | Installation Status: site-wise app install tracking (Pending/Installed, user identity) |
| BI-13 | EHS Score: BU/Region roll-up in Report Hub |

### 3.3 Score Card exports

| ID | Requirement |
|----|-------------|
| BI-14 | Download assessment sheet as **Word, Excel, or PDF** |
| BI-15 | Excel export preserves expandable parameter hierarchy (+ sub-parameters) |

---

## 4. Cross-cutting UX requirements

### 4.1 Navigation & shell

| ID | Requirement | Source |
|----|-------------|--------|
| UX-01 | **Launchpad** home with module tiles/icons after login | All RAKSHA PDFs |
| UX-02 | **Notification bell** on Launchpad for allocated action items | UA/UC, TSV PDFs |
| UX-03 | **MY ZONE** entry point for reports (separate from operational tiles) | Raksha Report PDF |
| UX-04 | MyZone shell for Work Permit + LMRA (Raksha sub-area) | Work Permit, LMRA PDFs |
| UX-05 | Report Hub as secondary navigation layer (screenshots) | Screenshots |

### 4.2 Forms & data entry

| ID | Requirement | Source |
|----|-------------|--------|
| UX-06 | Hierarchical pickers: **Business Unit → Region → Project** on most forms | Multiple PDFs |
| UX-07 | **Browse/upload** photo attachments with popup file picker | UA/UC, TSV, PTW, LMRA |
| UX-08 | **Mandatory photos** where safety evidence is required (UA/UC, TSV) | UA/UC, TSV PDFs |
| UX-09 | **Save as Draft** for multi-section forms (MIS, Score Card) | MIS, Score Card PDFs |
| UX-10 | **Save as Next / Previous** wizard navigation between parameter sections | Score Card PDF |
| UX-11 | Popup confirmations: Yes Close, Reject MIS comment box | MIS, Score Card, UA/UC |
| UX-12 | Auto-generated record numbers (UC007589, TSV000062) | UA/UC, TSV PDFs |

### 4.3 Notifications & communications

| ID | Requirement | Source |
|----|-------------|--------|
| UX-13 | In-app notification on Launchpad bell icon | UA/UC, TSV PDFs |
| UX-14 | Email + PDF attachment on Work Permit state changes (To/CC per role) | Work Permit PDF |
| UX-15 | Email on LMRA submit (To ESHO) and approve/reject (To User) | LMRA PDF |
| UX-16 | Defined Safety Officer per project receives UA/UC and TSV submissions | UA/UC, TSV PDFs |

### 4.4 List & report UX patterns

| ID | Requirement | Source |
|----|-------------|--------|
| UX-17 | Filter → **View Reports** button (explicit apply, not live on every keystroke) | Raksha Report PDF |
| UX-18 | **Refresh** and **Back** on report pages | Raksha Report PDF |
| UX-19 | Expandable rows (+) for region/project drill-down | Raksha Report, Score Card PDFs |
| UX-20 | Status badges: Open, Close, Pending, Approved, Rejected, Verified by EHS, etc. | Multiple PDFs |

### 4.5 Load & performance (inferred from rebuild goals + BI screenshots)

| ID | Requirement |
|----|-------------|
| UX-21 | Filter-driven reports should feel **instant** (client-side or cached aggregates for BU/Region/Project slices) |
| UX-22 | Donut/table KPI widgets update when filters change without full navigation |
| UX-23 | Large checklist/MIS/scorecard forms support **partial save** to avoid data loss |

---

## 5. Requirement counts & critical gaps

### 5.1 Summary table (for parent agent)

| Module | PDF source | Req count | Matrix covered | Critical gaps (docs only) |
|--------|------------|-----------|----------------|----------------------------|
| **Auth / Onboarding** | All PDFs + screenshots | 5 | No | NON-KEC user flow undocumented; no SSO/password-reset spec |
| **UA / UC / WSN** | UA & UC Reporting | 14 | Yes | WSN has no separate workflow; category/subcategory taxonomy not defined |
| **Incidents (IR)** | Raksha Report (list only) | 7 | Yes | No incident report/close workflow PDF; Major/Minor criteria undefined |
| **TSV** | Team Safety Visit | 14 | Yes | Checklist item catalog not in PDF; HSV/RSV conflated in guide text |
| **HSV / RSV** | Raksha Report (list only) | 6 | Yes | No create/fill workflow PDF; HSR/RSR/WER not documented |
| **EHS MIS** | Online MIS + Raksha Report | 10 | Yes | Full parameter catalog (HS01 etc.) not included in PDF |
| **EHS Score Card** | EHS Score Card | 15 | Yes | Parameter/sub-parameter master data not in PDF; Central EHS workflow ends at view |
| **Work Permit** | My zone-Work Permit | 18 | No | Not in permission matrix; permit type catalog not listed |
| **LMRA** | My zone-LMRA | 8 | No | Not in permission matrix; field schema not detailed |
| **Raksha Reports** | Raksha Report | 10 | No | Report Hub / iQuality / BRSR not in PDF |
| **NC** | — | 5 | Yes | No user guide at all |
| **Checklist** | — | 4 | Yes | No user guide; TSV embeds checklist but no master template spec |
| **KEC BI (UA/UC)** | Screenshots only | 4 | No | Full BI spec missing beyond filters + donut |
| **Training** | — | 0 | No | Launchpad tile only |
| **Utilities** | — | 0 | No | Launchpad tile only |
| **BBS** | — | 0 | No | Launchpad tile only |
| **Action Items** | Raksha Report (list) | 3 | Partial | No standalone create/close guide (embedded in UA/UC/TSV) |
| **My Zone shell** | My zone (1) | 3 | No | Navigation only — no functional spec |

**Totals:** ~126 numbered requirements across documented modules; **9 modules with zero PDF coverage**.

### 5.2 Top critical gaps (documentation-only)

1. **No Incident (IR) workflow PDF** — only list/report view; investigation stages unknown.
2. **No HSV/RSV creation guides** — matrix shows senior-role creators (PCH/BU Head, RM) but no field/checklist spec.
3. **Work Permit & LMRA absent from permission matrix** — RBAC must be inferred from role descriptions in PDF only.
4. **NC, Checklist, Training, Utilities, BBS** — launchpad/matrix hints only; no end-to-end workflow docs.
5. **Master data not included** — UA/UC categories, MIS parameters (HS01…), Score Card MMR/OER/EPP/L&MC trees, TSV checklist items, permit types.
6. **NON-KEC user** login path visible in screenshots but not described in any PDF.
7. **Report Hub / iQuality / BRSR** — screenshot labels only.
8. **WSN** bundled with UA/UC in matrix but never explained separately.

---

## 6. Source file index

Extracted text and parsed matrix live in `docs/_extracted/` (gitignored recommended):

- `User Guide for *.txt` — PDF text extractions
- `permission_matrix.json` — full Excel parse
- `parse_matrix.py` — re-run parser if Excel updates

**Excel path:** `C:\Users\hp\Downloads\SafetyApp-Permission-Matrix...xlsx`
