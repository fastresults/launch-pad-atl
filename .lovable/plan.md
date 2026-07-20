# Redesign around the ICP profiles

Goal: re-skin the site so a Plan-B Seeker, AI-Displaced Professional, Main Street Operator, or Family/Couple lands on the page and feels "this is for me, I can do this on a Saturday morning." Copy already got the plain-spoken sweep — this pass is visual: composition, palette, type, density, imagery register.

## Scope (in this pass)

Public marketing surfaces only. No business logic, no route changes, no auth/data work.

- `/` (home hero + framework + workshops scroller + access-mode dialog)
- `/build` (index + workshop card grid)
- `/services`
- `/schedule`
- `/contact`
- Shared: `Header`, `Footer`, section rhythm, button/pill styles

Out of scope: `/facilitator`, `/webinar`, `/one-on-one`, admin, dashboard, auth screens.

## Ritual (per the redesign skill)

Two acts. User picks in both — no guessing.

### Act 1 — Pin the taste

Capture the current `/` preview at 1386px as the anchor image. Then one round of three visual questions:

1. **Palette** — 3 swatch sets tuned to the ICP (warm/neighborly, confident/editorial, calm/trust). Current cream `#FBF7F1` + rust `#B8532A` is one option; two fresh alternatives sit beside it.
2. **Type pairing** — 3 pairings that read grown-up but not corporate (e.g. `instrument-serif-work-sans`, `lora-nunito-sans`, `outfit-figtree`). No default Inter/Poppins.
3. **Layout** — 3 wireframe structures for the home composition (e.g. `single-column`, `split-screen`, `magazine`).

The three answers lock as hard constraints for Act 2.

### Act 2 — Three rendered directions

Generate 3 full rendered directions of the home page using `design--create_directions`, with the captured screenshot attached as image reference. Palette, type, and layout are identical across all three — variation lives in:

- Hero composition and emphasis (headline scale, subhead rhythm, CTA weight)
- Density (breathing room vs. information-rich)
- Imagery register (portrait-led vs. object-led vs. type-led)
- Section transitions and motion feel
- Where "3 ways to start" and the workshop scroller sit in the fold

Each direction gets a distinct point of view — e.g. "Sunday paper," "Neighborhood shop window," "Field guide." Not three tints of the same layout.

Present the three back with one question: "Which direction should I build?"

### Act 3 — Implement the chosen direction

- Copy the chosen direction's tokens verbatim into `src/index.css` (HSL semantic tokens; no hardcoded colors in components).
- Update `tailwind.config.ts` if new tokens are added.
- Re-skin the in-scope routes and shared components to match hero alignment, section counts, density, and hierarchy of the chosen direction.
- Keep all current copy intact (already ICP-aligned from the last sweep).
- Verify with Playwright screenshots at 1386px and 390px.

## ICP guardrails the visuals must pass

- Reads instantly to a 35-year-old nurse or teacher — not to a VC.
- No "AI startup" aesthetic (no purple/indigo gradient on white, no glassmorphism dashboards).
- Price and "one Saturday morning" are visible above the fold.
- CTAs feel like "come on down," not "book a demo."
- Photography/illustration register suggests real people and Main Street, not stock founders at whiteboards.

## Deliverables

1. Three locked visual picks (palette / type / layout).
2. Three rendered home-page directions.
3. Implemented redesign across the 5 routes + shared chrome, matching the chosen direction.
4. Before/after screenshots at desktop + mobile in `.lovable/redesign/`.

## What I need from you to start

Approve this plan. On approval I'll capture the current `/` screenshot and fire the three visual-preference questions in one round.
