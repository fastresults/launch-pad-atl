## Goal

Introduce Adam's portrait into `/facilitator` in a way that humanizes the page without dominating it. The copy already does the heavy lifting — the photo should anchor, not headline.

## Recommendation: small portrait inside the Hero, asymmetric two-column

The strongest UX placement is **inside `FacilitatorHero.tsx`**, as a contained square portrait sitting beside (not above) the headline.

### Why this placement
- The Hero is the only section that currently introduces "who is this person?" — a face here closes the trust loop instantly without any reader having to scroll.
- Putting it anywhere lower (Story, CTA, sidebar to Timeline) means readers spend the first scroll trying to mentally picture the author. Placing it in the Hero kills that friction.
- Other placements considered and rejected:
  - **Full-bleed hero photo** — too much energy on the image, violates the brief.
  - **Above the headline** — pushes copy down, makes the page feel like a personal-brand site, not a workshop site.
  - **Inside Story** — late, feels like a stock author bio block.
  - **Floating in the CTA** — sales-y, undercuts the executive tone.

### Visual treatment (keeps energy balanced toward copy)
- **Size:** ~160px square on desktop, ~96px on mobile. Small enough that the headline still owns the screen.
- **Layout:** Hero becomes a two-column flex — left column is the existing eyebrow + headline + subhead (unchanged copy, keeps the left primary border); right column is the portrait. On mobile the portrait stacks above the eyebrow at 96px so it doesn't push the headline below the fold.
- **Shape:** Soft square with `rounded-2xl` and `overflow-hidden` — not a circle (avatars feel social-media casual; squares feel editorial and serious).
- **Treatment:** Subtle `border border-border` + light shadow. No filters, no duotone, no parallax — the photo is high-quality and editorial; let it be.
- **Caption:** A single 11px uppercase tracked line under the image — "Adam Anderson · Facilitator" — matches the existing eyebrow typography system so the photo reads as part of the layout, not pasted on.
- **Motion:** Same fade-in as the hero's existing `motion.section` — no separate hover/scale on the photo. It's an anchor, not an interaction target.

### Asset handling
- Download the signed image to `src/assets/adam-anderson.jpg` (the signed Supabase URL expires; we need it bundled).
- Import as ES6 module in `FacilitatorHero.tsx` for Vite optimization.
- Add real `alt="Adam Anderson, workshop facilitator"` for SEO/a11y.
- Add `loading="eager"` (it's above the fold) and `width`/`height` to prevent CLS.

## Out of scope
- No changes to copy in Hero, Story, Pillars, Timeline, Audience, or CTA.
- No second portrait anywhere else on the page.
- No layout or color changes to other sections.
- No new background, gradient, or decorative imagery.
