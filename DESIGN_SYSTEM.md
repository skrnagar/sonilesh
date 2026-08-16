# SONIL EHS360 Marketing Design System

## Brand

| Token | Value |
|---|---|
| Wordmark | **SONIL** (company) + **EHS360** (product) |
| Legal / footer | **SONIL** |
| Tagline | One Platform. Complete EHS Control. |
| Supporting | From the field to the boardroom. |
| Personality | Premium B2B SaaS — authoritative, calm, operationally precise |

**EHS** is the industry acronym for Environment, Health & Safety. The product is branded **SONIL EHS360** even if informal notes say “ESH”.

**Do not use:** Raksha branding, fake logos, fake case studies, fake certifications (SOC2/ISO/GDPR claims), childish UI, purple/cream AI tropes.

## Lockup

Header mark is an SVG shield inside a 360° orbit (navy field, teal arc, three EHS layer strokes) plus Outfit type: **SONIL** in navy, **EHS360** in safety green. Inverse lockup is used on navy marketing/auth chrome. Product sidebars, field, and admin use the `chrome` lockup so type follows light/dark sidebar tokens.

## Theme

Default is **light**. `next-themes` with `attribute="class"`, `defaultTheme="light"`, `enableSystem={false}`, storage key `sonil-ehs360-theme`.

Toggle locations: marketing navbar, workspace/admin sticky header, field header.

`.dark` on `html` remaps the same CSS variables (canvas, card, border, sidebar, badges). Do not invent a second palette.

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
| Display / headings / wordmark | Outfit (`--font-display-face`) | Geometric, confident H1s, tight tracking |
| UI / body | Source Sans 3 (`--font-sans-face`) | High-readability professional sans |
| Numbers | Tabular lining (`tabular-nums`) | Dashboards and KPI tiles |

Scale (marketing):

- Display: 56–72px / 0.95 / semibold (hero SONIL)
- Product line: 32–48px / medium (hero EHS360)
- H1: 36–46px
- H2: 28–35px
- H3: 18–20px
- Body: 16px / 1.6
- Small / meta: 13–14px
- Nav: 13px, tracking `-0.01em`
- Eyebrow: 12px uppercase, tracking `0.16–0.2em`

## Spacing & layout

- Container max: `1200px` (`max-w-[75rem]`), gutters `24px` → `32px` desktop
- Section vertical rhythm: `72–112px`
- Breakpoints target: **1440 / 1024 / 390**
- Prefer section dividers and typographic hierarchy over card grids
- Mobile header: lockup + Request demo (menu remains for full nav)

## Components (marketing)

| Component | Purpose |
|---|---|
| `BrandLockup` | SVG mark + SONIL EHS360 type |
| `Container` | Max-width wrapper |
| `SectionHeader` | Eyebrow + title + support |
| `Navbar` / `MegaMenu` | Sticky header + menus |
| `Footer` | Site map + SONIL copyright |
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
