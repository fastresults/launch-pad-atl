## Goal

Every public surface — home, landing, workshops, services, schedule, facilitator, contact, webinar, 1:1, private Tuesday, register, sign-in, legal — reads as one cinematic editorial system: midnight-navy canvas, blue-violet ambient haze, near-white Outfit display type, one electric-blue accent, glass panels over photography. Right now only the new hero follows the PRD; everything else is the Warm Sand cream/serif theme.

## The core move

The whole public site already routes its color through one scoped theme block, `.marketing-surface`, in `src/styles.css`. That block is currently Warm Sand (cream `#FAF8F5`, espresso `#8B7355`, DM Serif Display) and it forces warm values with `!important` overrides. Replacing that one block with the PRD's oklch token set flips nav, footer, buttons, cards, inputs, and every token-driven page in a single stroke. The remaining work is removing the ~250 hardcoded warm hex literals in a handful of components that bypass tokens.

```text
styles.css
 └─ .marketing-surface  ──► becomes the PRD token layer (oklch, midnight navy)
      ├─ Header / Footer      (token-driven — inherit automatically)
      ├─ services, schedule, facilitator, contact,
      │  webinar, one-on-one, privacy, terms, build.$slug   (mostly token-driven)
      └─ HomeFramework, LandingFramework, private-tuesday,
         AskConcierge, modals   (hardcoded hex — need manual conversion)
```

## Phase 1 — Token layer

Rewrite the `.marketing-surface` block to the PRD palette (Appendix A of the PRD): `--background oklch(0.155 0.019 268)`, `--foreground oklch(0.975 0.004 250)`, surface/card/popover/muted/accent, alpha hairline `--border`, `--ring`, plus `--brand-accent` (electric blue), `--brand-accent-soft`, `--brand-violet`, `--headline-dim`, `--gradient-haze`, `--gradient-brand`. Radius scale to `0.75rem` base.

Delete the warm `!important` sweep (the `.marketing-surface .text-white → #3D3025` family). Those rules exist only to drag a dark-built UI into cream; on a dark canvas they are actively wrong and they are what currently fights the hero.

Add the PRD utilities globally so any page can use them: `hero-haze`, `glass-panel`, `gradient-ring`, `glow-ring`, `text-gradient-brand`, `bg-gradient-brand`, `scene-fade`, `caret`, `scene-drift`, `eyebrow`, plus the reduced-motion block.

Typography: bind `--font-display: Outfit` and `--font-sans: DM Sans`, retire DM Serif Display / Fira Sans on public surfaces, and set `h1/h2/h3 { font-family: display; letter-spacing: -0.035em }` in the base layer.

## Phase 2 — Navigation and footer

- **Header:** transparent over the hero, then a glass bar on scroll (`glass-panel`, hairline bottom border, blur). Keep the current split edge-anchored structure — left: logo, workshops, services, schedule; right: facilitator, contact, 3 ways to start, sign in, CTA. Nav links become `text-muted-foreground` at `text-sm` with a `--brand-accent` underline-on-hover; the CTA becomes a `rounded-full` electric-blue pill. Logo gets a dark-canvas treatment.
- **Footer:** midnight surface with a hairline top border, muted link columns, single-accent hover, `eyebrow` section labels.
- **AskConcierge** launcher and panel: `glass-panel` + accent pill instead of its 67 hardcoded warm hex values.

## Phase 3 — Home and landing

These two carry ~50 hex literals each. Convert every one to a token or utility and re-key the section rhythm to the PRD:

- Section bands alternate `--background` and `--surface` with hairline dividers instead of cream/sand blocks.
- Stage numbers 01–08 keep their 20% opacity but in `--foreground`; the hatched `StageSketch` line art switches to `currentColor` so it inherits the accent/foreground of its section.
- `DeliverableCheck` items become glass tiles with an electric-blue check.
- The coffee-cup watercolor and testimonial cards get `scene-fade` masking so they sit on the dark canvas rather than a cream cutout.
- The business-ideas scroller cards become glass panels with hairline borders.
- Landing page mirrors home exactly, including `LandingFooter`, the interest modal, and the access-mode dialog.

## Phase 4 — Remaining public routes

`services`, `schedule`, `build` + `build.$slug`, `facilitator`, `contact`, `webinar`, `one-on-one`, `private-tuesday`, `register`, `login`, `signup`, `reset-password`, `privacy`, `terms`, `unsubscribe`. Most inherit from Phase 1; the work is per-page composition polish so each one opens with the same grammar:

- A short hero band: `eyebrow` → display `h1` (two-tone, accent clause in `text-gradient-brand`) → one muted subhead → glass CTA.
- Cards → `glass-panel rounded-2xl`; primary CTAs → `rounded-full` accent pills; forms → transparent inputs with alpha borders and an accent focus ring.
- `private-tuesday` booking grid: available slots as glass tiles with an accent edge, taken slots muted at low opacity — no more warm greys.
- Legal pages: same masthead, `max-w-3xl` prose at `text-sm leading-relaxed text-muted-foreground`.

## Phase 5 — Award-grade craft pass

- **Motion discipline:** 1600ms fades, slow drifts, 200–240ms hovers. Everything eased, nothing snaps. Full `prefers-reduced-motion` coverage.
- **Contrast:** verify AA on muted copy over the navy canvas and over photography; adjust `--muted-foreground` lightness if any check fails.
- **One accent rule:** grep for a second competing color and remove it; the emerald/olive accents currently in the warm theme go.
- **Overlay budget:** any page using photography follows the hero's light-scrim rule so images stay readable.
- **Verification:** Playwright pass over all public routes at 1280px and 390px, screenshotting each, plus a repo-wide check that no `text-white`, `bg-black`, or hex literal survives on a public surface.

## Technical notes

- Tailwind v4, CSS-first. All new tokens and `@utility` blocks live in `src/styles.css`; no `tailwind.config.js`.
- Outfit + DM Sans are already imported. The PRD warns against `@import`-ing font URLs inside a v4 stylesheet on their stack; this project's Vite setup resolves it fine today, but if the build complains the imports move to `<link>` tags in `index.html`.
- The authenticated app and admin console are untouched — they keep their own dark token set, and the `.marketing-surface` scope is what keeps the two separate.
- No backend, routing, copy, or business-logic changes. Presentation only.
