## Goal

Make the landing page (shown when super-admin turns on landing-only mode) a **full byte-for-byte duplicate** of today's homepage — then fully independent, so edits to the landing page never touch the live homepage and vice versa.

Today `StandaloneLanding.tsx` just re-renders `<HomeFramework />`, so any change to the homepage would leak into the landing page. This plan forks it.

## What to build

### 1. Duplicate the homepage component tree into `src/components/landing/`

Create standalone copies (not re-exports) of every home component the landing page uses:

- `src/components/landing/LandingFramework.tsx` — copy of `src/components/home/HomeFramework.tsx` (664 lines)
- `src/components/landing/LandingBusinessIdeasScroller.tsx` — copy of `HomeBusinessIdeasScroller.tsx`
- `src/components/landing/LandingVideoTestimonials.tsx` — copy of `VideoTestimonials.tsx`
- `src/components/landing/LandingAccessModeDialog.tsx` — copy of `AccessModeDialog.tsx`

Inside `LandingFramework.tsx`, rewrite the three internal imports to point at the new landing-scoped siblings instead of `@/components/home/*`. Everything else (shared UI primitives, brand assets, `@/lib/*` data, hooks) stays imported from the shared locations — those are cross-cutting building blocks, not homepage content.

### 2. Replace the current `StandaloneLanding.tsx`

Swap its one-line body to render `<LandingFramework />` instead of `<HomeFramework />`. Update the header comment to say the landing page is now a fully independent fork — edits here do not affect `/` (the live homepage) once the site toggles back on.

### 3. Leave everything else alone

- `/` route (`src/routes/index.tsx`) keeps rendering `HomeFramework` — the live-site homepage is untouched.
- `LandingOnlyGate`, the admin toggle, `site_settings.landing_only_mode`, and `/login` / `/reset-password` bypasses stay exactly as they are.
- No database changes.

## What "independent" means after this ships

| Change you make…                             | Affects live homepage `/` | Affects landing page |
|----------------------------------------------|:-------------------------:|:--------------------:|
| Edit `src/components/home/HomeFramework.tsx` | ✅                        | ❌                   |
| Edit `src/components/landing/Landing*.tsx`   | ❌                        | ✅                   |
| Edit a shared primitive (`ui/*`, brand, lib) | ✅                        | ✅                   |

Shared primitives stay shared on purpose — you don't want to re-fork the design system, brand tokens, or data functions just to fork one page. If a specific dialog or lib helper needs to diverge later, we can fork it into `landing/` at that time.

## Trade-off to acknowledge

Duplicating ~700 lines of JSX means the two pages will drift over time. That drift is the whole point of this request. When you want landing-only copy or a stripped-down layout, edit the `landing/` files freely; the homepage will not move.

## Technical notes

- Pure copy-paste of file contents, then a find-and-replace on the four internal home imports inside `LandingFramework.tsx`.
- No new routes, no router changes, no changes to `App.tsx`.
- Typecheck after the copy to confirm no dangling imports.
