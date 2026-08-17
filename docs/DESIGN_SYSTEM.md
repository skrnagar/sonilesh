# Marketing design system (M1)

Do **not** rip the existing navy/teal system. Tokens live in `src/app/globals.css`. Fonts are loaded in `src/app/layout.tsx`.

## Colour

| Token | Light | Role |
|---|---|---|
| `--primary` / `--mkt-hero` | `#0b3a53` / `#071f2d` | Navy ink and dark heroes |
| `--accent` / `--mkt-safety` | `#0f766e` | Teal CTAs, eyebrows, safety actions |
| `--mkt-infra` | `#c45c26` | Warm accent in hero wash only |
| `--background` | `#eef2f6` | Page canvas |
| `--card` | `#ffffff` | Surfaces |

Dark theme mirrors the same navy/teal pair (`--mkt-hero: #07141c`, `--mkt-safety: #3d9b90`).

CTA variant: `Button variant="safety"` (teal). Primary navy buttons remain for in-app chrome.

## Type

| Role | Face | How |
|---|---|---|
| Body | **IBM Plex Sans** | `IBM_Plex_Sans` → `--font-sans-face` |
| Display | **Plus Jakarta Sans** | `Plus_Jakarta_Sans` → `--font-display-face` |

`h1`–`h3` and `.font-display` use Plus Jakarta. Do not swap these unless they are broken.

## Layout patterns (marketing)

- `Container` + `SectionHeader` + `PageHero`
- Dark hero: `bg-[var(--mkt-hero)]` with `.mkt-hero-wash`
- Banded sections: `.mkt-band`
- Product UI in market: `DashboardPreview` / `MobilePreview` inside `ProductScreenshot` — **no stock photos**
- Motion: `FadeIn` / `Reveal` in `src/components/marketing/motion.tsx`

## Honesty in UI

No certification badge rows, no invented metric tickers, no customer logo strips. Empty `/customers` is intentional.
