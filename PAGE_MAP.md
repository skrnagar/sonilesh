# EHS360 Marketing Page Map

## Public routes

| Path | Page | Primary CTA |
|---|---|---|
| `/` | Homepage | Request Demo |
| `/platform` | Platform overview | Request Demo |
| `/solutions` | Solutions hub | Explore industries |
| `/solutions/construction` | Construction | Request Demo |
| `/solutions/epc` | EPC | Request Demo |
| `/solutions/power-energy` | Power & Energy | Request Demo |
| `/solutions/renewable-energy` | Renewable Energy | Request Demo |
| `/solutions/manufacturing` | Manufacturing | Request Demo |
| `/solutions/oil-gas` | Oil & Gas | Request Demo |
| `/solutions/infrastructure` | Infrastructure | Request Demo |
| `/solutions/mining` | Mining | Request Demo |
| `/solutions/logistics` | Logistics | Request Demo |
| `/features` | Feature capabilities | Request Demo |
| `/modules` | Modules hub | Explore modules |
| `/modules/incidents` | Incidents | Request Demo |
| `/modules/risk-management` | Risk Management | Request Demo |
| `/modules/permit-to-work` | Permit to Work | Request Demo |
| `/modules/inspections` | Inspections | Request Demo |
| `/modules/audits` | Audits | Request Demo |
| `/modules/capa` | CAPA | Request Demo |
| `/modules/training` | Training | Request Demo |
| `/modules/contractor-management` | Contractors | Request Demo |
| `/modules/ppe` | PPE | Request Demo |
| `/modules/document-control` | Document Control | Request Demo |
| `/modules/analytics` | Analytics | Request Demo |
| `/field-experience` | Field experience (marketing) | Request Demo |
| `/enterprise` | Enterprise / multi-tenant | Contact Sales |
| `/security` | Security posture (no fake certs) | Contact Sales |
| `/pricing` | Pricing (Custom / Contact Sales) | Contact Sales |
| `/resources` | Resources placeholders | Browse |
| `/about` | About EHS360 | Request Demo |
| `/contact` | Contact | Send message |
| `/request-demo` | Demo request form | Submit |

## Auth (existing — do not replace)

| Path | Notes |
|---|---|
| `/login` | Sign In target from marketing header |
| `/signup` | Optional secondary CTA |
| `/forgot-password`, `/reset-password`, `/verify-email` | Existing flows |

## Product routes (protected / out of marketing scope)

| Path | Notes |
|---|---|
| `/app/*` | Customer workspace |
| `/admin/*` | Platform admin |
| `/field/*` | **Product** field UI — not marketing |
| `/onboarding/*` | Org setup |

## Route conflict

| Requested marketing path | Resolution |
|---|---|
| `/field` | **Conflict** with product `src/app/field`. Marketing page shipped as **`/field-experience`**. Nav labels say “Field”. |

## Footer columns

Product · Solutions · Modules · Company · Legal placeholders · © 2026 EHS360
