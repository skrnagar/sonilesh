# Phase 19 — EHS360 Marketplace + Partner Ecosystem

**Status:** Spec only. Implement after **16A → 16B → 17 → 18**. Do not build marketplace product code from this document until then.

## Core principle

> EHS360 Core stays stable. Customers, partners, consultants, and the EHS360 team can add industry packs, integrations, templates, dashboards, compliance content, and AI agents **without modifying the core application**.

Marketplace content must be **configurable and versioned**. Do **not** duplicate the core application for each industry. A package configures existing EHS engines.

```text
                         EHS360 PLATFORM
                               │
          ┌────────────────────┼────────────────────┐
          ↓                    ↓                    ↓
       CORE EHS           MARKETPLACE            AI PLATFORM
          │                    │                    │
          │          ┌─────────┼─────────┐          │
          │          ↓         ↓         ↓          │
          │       Packs    Templates  Connectors    │
          └──────────┼─────────┼─────────┼──────────┘
                     ↓         ↓         ↓
                  CUSTOMER-SPECIFIC EXPERIENCE
```

## Categories

| Category | Examples |
| --- | --- |
| INDUSTRY_PACK | Construction & EPC, Power & Energy, Solar, T&D, Manufacturing, Oil & Gas, Mining, Logistics, Infrastructure |
| TEMPLATE / CHECKLIST_LIBRARY | Inspection, audit, JSA/JHA, permit, toolbox, LMRA, CAPA, emergency |
| COMPLIANCE_PACK | Versioned jurisdiction content (e.g. India BRSR / Environment / Occupational Safety) — **no unsupported regulatory claims** |
| RISK_LIBRARY | Hazards, controls, activities, risk factors |
| DASHBOARD / REPORT | Executive widgets, monthly/contractor/audit/incident reports |
| INTEGRATION | SAP, Oracle, Microsoft, HRMS, ERP, IoT, access control — secrets never exposed to packages |
| AI_AGENT | Permit review, investigation, CAPA effectiveness, contractor risk, compliance, audit prep |

## Package model

Package fields: `id`, `name`, `slug`, `description`, `category`, `version`, `publisher`, `status`, `visibility`, `pricing_type`, timestamps.

**Statuses:** Draft → Review → Approved → Published → Deprecated / Suspended. Only approved/published packages install.

**Publishers:** EHS360 | Partner | Customer | Internal. Do not expose private publisher information.

**Versioning:** Installed tenants stay on an installed version until they upgrade. Never silently change installed content.

## Manifest + dependencies

Every package declares metadata, version, dependencies, permissions, features, templates, workflows, dashboards, reports, risk libraries, compliance content, AI capabilities. Validate before install. Dependencies may include core EHS version, other packages, entitlements. **No circular dependencies.**

## Customer UX

`/app/marketplace` — Discover | Installed | Updates | My Packages

Flow: Browse → View → Review (permissions/data/features/dependencies) → Install → Configure → Activate

Installation states: AVAILABLE | INSTALLING | INSTALLED | UPGRADE_AVAILABLE | UPGRADING | FAILED | DISABLED | UNINSTALL_PENDING

Config: `/app/settings/marketplace/[package]` — templates, workflows, terminology, thresholds, dashboards, notifications. Not internal system config.

## Template customization

```text
BASE TEMPLATE (marketplace master)
  + CUSTOMER OVERRIDE
```

Never overwrite the marketplace master. Upgrades show current vs new, changes, impact; allow Review / Upgrade / Skip. Do not auto-overwrite customer customizations.

## Industry packs

Configure existing engines (hazards, risks, JSA/JHA, permits, inspections, checklists, training, competencies, emergency, dashboards, KPIs). **Do not** create duplicate industry-specific incident tables.

Reuse BRSR checker implementation as an official tool/package where appropriate — do not duplicate its rule engine.

## AI agent packages

Manifest must specify tools, permissions, data sources, risk level, model requirements. Agents must use existing authorization, tool registry, tenant scope, and audit. High-risk writes require human approval.

## Security (non-negotiable)

Packages **cannot**:

- execute arbitrary server code
- access the database directly
- bypass RLS
- access secrets
- change system permissions / core security
- disable audit or billing
- change tenant ownership

Prefer declarative definitions. Required permissions shown and approved before install. Uninstall disables features; **preserves historical EHS data**.

## Partner + admin

- `/partner` — create packages, versions, submit for review; partners do **not** access customer data by default
- `/platform/marketplace` — packages, publishers, reviews, versions, installations, security, reports
- Review gates: security, content, permissions, dependencies, quality, regulatory claims

## Tenancy + entitlements

All installation/config records are `organization_id` scoped with RLS. Customer A install/config/custom templates must be invisible to Customer B.

Package availability = installed **and** organization entitlement valid. Never bypass entitlements.

Billing hooks: FREE | PAID | SUBSCRIPTION | ENTERPRISE — interfaces only in this phase; no complex revenue share unless explicitly required.

## Audit

Package installed / upgraded / disabled / removed / configuration changed / permission approved.

## Docs to create at implementation time

- `docs/MARKETPLACE_ARCHITECTURE.md`
- `docs/PACKAGE_SPECIFICATION.md`
- `docs/PACKAGE_SECURITY.md`
- `docs/PARTNER_PLATFORM.md`
- `docs/PACKAGE_VERSIONING.md`

## Explicit non-goals for this phase (until scheduled)

- Fake marketplace listings or ratings
- Rewriting core EHS modules
- Six separate industry applications
- Automatic suspension/blacklisting from AI/package logic
- Fabricated legal/regulatory content
