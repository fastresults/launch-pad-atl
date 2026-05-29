## Goal

Communicate in the site footer that **Startuplabs is a division of Evolve Inc.**, paired with the Evolve logo.

## Changes

**1. Add Evolve logo asset**
- Download the provided SVG and save it as `src/assets/evolve-logo.svg`.

**2. Update `src/components/site/Footer.tsx`**
- Import the new `evolve-logo.svg`.
- Add a new footer block (right side on desktop, stacked on mobile) containing:
  - The Evolve logo (height matched to the Startuplabs logo, ~h-8/h-10).
  - Tagline text: **"A division of Evolve Inc."** rendered in `text-muted-foreground`.
- Keep existing Startuplabs logo + address on the left and copyright in its current position; reflow into a 3-column layout on `md+` so the Evolve attribution sits clearly with its logo.

Proposed layout:

```text
[ Startuplabs logo · Norcross, GA ]   [ A division of  Evolve logo ]
                       © 2026 · One day. One business.
```

## Copy options (pick one in build)

- "A division of Evolve Inc." (default — concise, clearest)
- "Startuplabs is a division of Evolve Inc."
- "Proudly part of Evolve Inc."

Default to option 1 unless you'd prefer another.

## Out of scope

- No styling or structural changes to other footer content.
- No new routes or About-page Evolve section (can be a follow-up).
