# EHS360 Marketing Design System

## Brand

| Token | Value |
|---|---|
| Name | **EHS360** |
| Tagline | One Platform. Complete EHS Control. |
| Supporting | From the field to the boardroom. |
| Personality | Premium B2B SaaS — authoritative, calm, operationally precise |

**Do not use:** Raksha branding, fake logos, fake case studies, fake certifications (SOC2/ISO/GDPR claims), childish UI, purple/cream AI tropes.

## Color

Extend existing app tokens; marketing surfaces stay clean white with navy foundation.

| Role | CSS variable | Hex | Usage |
|---|---|---|---|
| Navy / Primary | `--primary` | `#0b3a53` | Brand, headlines, nav, CTAs |
| Blue accent | `--accent` | `#1f6f8b` | Links, interactive emphasis |
| Safety green | `--success` / `--mkt-safety` | `#0f766e` | Positive / control states |
| Amber warning | `--warning` | `#b45309` | Caution, open actions |
| Critical red | `--destructive` | `#b42318` | Critical only |
| Surface | `--card` | `#ffffff` | Page surfaces |
| Canvas | `--background` | `#f4f6f8` | Soft page wash |
| Ink | `--foreground` | `#0f172a` | Body text |
| Muted | `--muted-foreground` | `#64748b` | Supporting copy |
| Border | `--border` | `#d7dee7` | Dividers, hairlines |

Hero may use a subtle navy→teal radial gradient. Elsewhere: flat white / light canvas.

## Typography

| Role | Face | Notes |
|---|---|---|
| UI / body | IBM Plex Sans (`--font-sans-face`) | Already loaded in root layout |
| Display (rare) | Source Serif 4 (`--font-display-face`) | Brand wordmark emphasis only |

Scale (marketing):

- Display: 48–56px / 1.1 / semibold
- H1: 36–44px
- H2: 28–32px
- H3: 18–20px
- Body: 16px / 1.6
- Small / meta: 13–14px
- Eyebrow: 12px uppercase, tracking `0.16em`

## Spacing & layout

- Container max: `1200px` (`max-w-[75rem]`), gutters `24px` → `32px` desktop
- Section vertical rhythm: `72–112px`
- Breakpoints target: **1440 / 1024 / 390**
- Prefer section dividers and typographic hierarchy over card grids

## Components (marketing)

| Component | Purpose |
|---|---|
| `Container` | Max-width wrapper |
| `SectionHeader` | Eyebrow + title + support |
| `Navbar` / `MegaMenu` | Sticky header + menus |
| `Footer` | Site map + legal |
| `CTASection` | Closing conversion block |
| `ProductScreenshot` | Framed product viz shell |
| `DashboardPreview` | Synthetic ops dashboard |
| `MobilePreview` | Field device frame |
| `WorkflowDiagram` | Lifecycle steps |
| `FeatureCard` / `ModuleCard` / `IndustryCard` | Sparse interactive tiles |
| `MetricCard` | KPI callout (use sparingly) |
| `PricingCard` | Contact Sales / Custom |
| `ComparisonTable` | Capability matrix |
| `Accordion` | FAQ / expandable detail |
| `Badge` / `Button` | Reuse shadcn variants |

Cards are allowed only when they aid interaction or scanning — never in the hero.

## Motion

Intentional, reduced-motion safe:

1. Hero content fade/rise (~400ms)
2. Product viz subtle parallax / reveal on scroll
3. Mega menu / accordion height transitions

`prefers-reduced-motion: reduce` → disable transforms; keep opacity/instant swaps.

## Imagery rules

- Product visualization: dashboard + field + risk + CAPA (CSS/React compositions, not stock photos)
- Full-bleed hero visual plane (edge-to-edge background), not inset media cards
- No floating badges/stickers on hero media
- Trust strip = industry names as text, not fake logos

## Accessibility

- Landmark regions, skip link
- Focus rings via `--ring`
- Color contrast AA for text
- Mega menus keyboard operable
- Form labels associated; errors announced
