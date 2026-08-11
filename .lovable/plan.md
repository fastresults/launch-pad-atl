# Light grey (#ECECEC) across Admin and Dashboard

Admin and Dashboard move to a permanently light interface on a #ECECEC page background, with white cards lifting off it. Dark mode is retired in those two areas. Public marketing pages, the workshop decks, and the client shared link (`/v/:token`) are untouched and stay as they are.

## What the audit found

- Both shells (`routes/_authenticated/dashboard.tsx`, `routes/_authenticated/_admin.tsx`) wrap their content in `ThemeProvider`, which defaults to **dark** and only goes light if the user flips the header toggle.
- The theme's light palette already exists in `src/styles.css` under `:root.light` — its background is near-white (`oklch(0.99 0 0)`), not grey.
- The real work is that the authenticated UI was built dark-only: **65 files** across dashboard/admin routes, `components/admin`, `components/dashboard`, `components/ops`, and `components/hub` use hardcoded translucent-white styling — ~324 `white/10`, ~85 `white/5`, plus `white/15`, `white/20`, `white/30`, `text-white`, and `bg-black/*` scrims. On #ECECEC these hairlines and veils disappear entirely and white-on-light text becomes unreadable.

So this is two jobs: set the surface, then convert the dark-only styling to semantic tokens so it renders correctly on it.

## Phase 1 — Set the surface

- `src/styles.css`: `:root.light` gets `--background: #ECECEC`. Cards stay pure white so panels lift off the page; `--muted`/`--secondary` are nudged slightly cooler than the page so filled rows still read as recessed; `--border` firms up so hairlines are visible against grey.
- `ThemeProvider` gains a `forced` mode. When set, it applies `.light` on mount, ignores stored preference, and never writes to localStorage.
- Both shells pass `forced="light"`. The `ThemeToggle` is removed from the dashboard header and `AdminSidebar`; the component file stays for any other surface that still uses it.
- Shell chrome updated: `border-white/5` on headers → `border-border`, sticky header `bg-background/80` keeps its blur but over the new grey.

## Phase 2 — Convert dark-only styling to tokens

A mechanical sweep across the 65 affected files, mapping each pattern to the existing design tokens:

| Current | Becomes |
| --- | --- |
| `border-white/5`, `/10`, `/15` | `border-border` (or `border-border/60` for lighter rules) |
| `bg-white/5`, `bg-white/10` | `bg-muted/50` or `bg-card` depending on whether it's a fill or a panel |
| `hover:bg-white/10` | `hover:bg-muted` |
| `text-white` | `text-foreground` — except inside primary/accent-filled elements, which become `text-primary-foreground` |
| `bg-black/50…/80` (modal scrims, image overlays) | `bg-foreground/60` for scrims; image-caption gradients keep a dark scrim since they sit over photography |
| `from-white/10` gradients | token-based gradients |

Each replacement is reviewed rather than blind-applied — the same class means "hairline" in one place and "chip fill" in another.

## Phase 3 — Screen-by-screen visual pass

Screenshot and correct the highest-density screens, in this order:

1. Founders Hub — `hub.index`, `hub.$snapshotId`, `hub.new` (highest count of dark-only classes)
2. Operationalize — `OpsDashboard`, the new delivery band, `HeavyLifting`, `InvestmentCompare`
3. Deliverables, Documents, Day, Legal setup, Brain
4. Admin — attendees, cohorts, applications, inquiries, users, review, decks

Things checked on each: card separation against #ECECEC, chart and badge legibility, status colors, logo lockups that assumed a dark backdrop, empty states, and any inline SVG art (`OpsStageArt`, mind map, timeline) that draws in `currentColor` or white.

## Phase 4 — Guardrails

- Contrast check on muted text, badges, and status pills against the new grey.
- Confirm the shared link and public site are unaffected (they don't mount the dashboard `ThemeProvider`).
- Confirm nothing writes a stale `dashboard-theme` value that could reintroduce dark.

## Technical notes

- `#ECECEC` is set once as `--background` inside `:root.light`; no component hardcodes the hex.
- `ThemeProvider`'s `useTheme()` still returns a valid context under `forced`, so any consumer keeps working; `setTheme` becomes a no-op there.
- No route, data, or backend changes — presentation only.
