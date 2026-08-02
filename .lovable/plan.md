## What's actually wrong

Yes — I found the global styling, and there are **two competing systems fighting each other** on every public page:

1. **`src/styles.css`, lines ~283-560** — a legacy `.marketing-surface` layer with viewport-relative type (`clamp(1.875rem, 2.9vw, 3.5rem)`), viewport-relative gutters, tier-specific media queries at 60rem/64rem/80rem, and roughly **40 `!important` declarations** that override component classes.
2. **`src/public.css`, 411 lines** — the newer `.public-surface` layer with `zoom: 0.6`, `--public-gutter: calc(20vw / 0.6)`, and its own separate H1/H2 scale at three breakpoints.

Both files are imported globally in `src/main.tsx`, and 15 route/component files still reference `.marketing-surface`. Every size on a public page is therefore a product of: a vw-derived clamp, times a zoom factor, times a breakpoint override, times an `!important` rule. That is why the same page looks different on the same monitor at different OS scale factors, and why every targeted fix produced a new symptom. There is no single number to correct — the system itself is the bug.

## The rebuild

Strip both layers out entirely and replace them with one deliberately boring stylesheet. Nothing viewport-derived, nothing scaled, no `!important`.

### 1. Delete

- Remove the entire `.marketing-surface` / `.marketing-dialog` / `.marketing-sheet` block and all of its desktop-tier media queries from `src/styles.css` (keeping design tokens, `@theme`, dark/light roots, app/dashboard/slide styles untouched).
- Delete `src/public.css` and its import in `src/main.tsx`.
- Remove `src/components/RenderDiagnostics.tsx` and its wiring in `src/App.tsx` — it was forensic instrumentation for a bug we're now removing at the source.
- Remove `scripts/hero-geometry.py` and `scripts/public-parity.py`, which assert ratios and zoom factors that will no longer exist.

Logged-in app, admin, and workshop slides are not touched.

### 2. New `src/public.css` — the whole layout law, ~120 lines

```
.public-page            /* dark canvas, DM Sans, 16px/1.6, color tokens only */
.public-page .sl-hero   /* width:100%; min-height:100svh - header; no gutter */
.public-container       /* width:100%; max-width:1200px; margin-inline:auto;
                           padding-inline:24px  (16px below 640px) */
```

Type scale — fixed pixel values, one breakpoint at 768px, no `clamp()`, no `vw`, no `zoom`:

| Element | Mobile | Desktop |
|---|---|---|
| Body | 16px | 16px |
| H1 | 32px | 48px |
| H2 | 24px | 32px |
| H3 | 20px | 22px |
| Lead paragraph | 17px | 18px |
| Eyebrow | 12px | 12px |
| Buttons | 15px, 44px tall | 15px, 44px tall |

On your 1386px viewport that gives a 1200px content column with ~93px of breathing room each side; on a 1920px monitor the column stays at 1200px and centers. Lines never get longer than a readable measure, and text is identical at every window size within a breakpoint — the standard behavior of every normal website.

### 3. Rewire the 15 public files

Each public route currently wraps content in `marketing-surface` / `public-surface` plus ad-hoc `mx-auto max-w-4xl/6xl/7xl px-6` containers that each impose a different width. Every one of those gets replaced with the single `.public-container`, so width is defined in exactly one place:

`src/routes/` — `index`, `services`, `build`, `build.$slug`, `webinar`, `one-on-one`, `schedule`, `contact`, `facilitator`, `private-tuesday`, `privacy`, `terms`
`src/components/` — `home/HomeFramework`, `home/CinematicHero`, `landing/LandingFramework`, `register/RegisterFramework`, `site/Header`, `site/Footer`

The hero is the sole exception: full bleed edge to edge, its inner text stack centered on the same 1200px measure.

### 4. Verify before calling it done

A short Playwright pass over all 13 public routes at 390 / 768 / 1024 / 1386 / 1920 px asserting three things: hero section width equals viewport width; every other section's content box is exactly 1200px (or viewport minus padding when narrower) and centered; computed H1 is exactly 32px or 48px. If Chromium can't launch in this sandbox I'll say so plainly rather than claim a pass I didn't observe.

## Technical notes

- Copy, content, backend, routing, and all authenticated screens are unchanged. This is presentation only.
- Colors keep the current midnight-navy palette via existing tokens — the visual identity stays; only geometry and type sizing are rebuilt.
- No `zoom`, no `transform: scale`, no `vw` sizing, no `clamp()`, and no `!important` anywhere in the new public stylesheet. Those four constructs caused every failure in this thread, so their absence is the acceptance criterion, not a preference.
