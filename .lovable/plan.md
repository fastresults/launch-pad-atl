# Make the eight workshop cards feel like editorial covers

Right now the eight "$197 workshop" cards are flat panels: icon, pill, headline, italic line, paragraph, link. They read like a spec sheet, and because the copy lengths differ, the "Learn more" links land at eight different heights. The fix is to turn each one into a photographic card with a consistent internal rhythm.

## What's wrong today

- No visual anchor — eight near-identical dark rectangles, nothing to distinguish "Build your brand" from "Close more sales" at a glance.
- Ragged bottoms: the CTA floats wherever the paragraph ends, so the grid looks unaligned.
- The description paragraph is long enough to dominate the card and flatten hierarchy.
- Hover does almost nothing (border tint only), so the cards don't feel clickable.

## The new card

Each card becomes a full-bleed image card:

```text
┌────────────────────────────┐
│  [cinematic image, top]    │  ~40% of card height
│   icon chip     $197 pill  │  floating over the image
├────────────────────────────┤
│  Build your brand          │  headline
│  Your brand in a day.      │  serif italic kicker
│  Logo, palette, type…      │  clamped to 3 lines
│                            │
│  Learn more  →             │  pinned to the bottom
└────────────────────────────┘
```

Details:

- **Photography, not illustration.** One cinematic, on-brand image per workshop — moody, low-key, deep-navy grade so the eight sit together as a set. Subjects stay concrete and human (a swatch book and pantone chips for brand, a lit laptop on a desk for website, a phone on a marble counter for social, an open notebook of headlines for content, a control console for AI, a mail tray for revenue, a handshake across a table for sales, a stack of filed papers and a stamp for scaffolding).
- **Gradient scrim** from transparent to the card surface at the bottom of the image so text never sits on busy pixels and the image dissolves into the card instead of ending in a hard line.
- **Icon and price pill float on the image**, in a frosted glass treatment, keeping the existing shapes and tokens.
- **Equal heights.** Card is a flex column, description clamped to three lines, CTA pushed to the bottom with `mt-auto`. Every "Learn more" aligns across the row.
- **Hover:** image scales ~1.04 with a slow ease, scrim deepens slightly, border warms to primary, arrow slides right. One coordinated motion, not four separate ones.
- **Motion respect:** the scale is disabled under reduced-motion.

## Also recommended (small, high payoff)

- Give the section a short kicker above the grid so the eight cards read as a menu ("Eight mornings. Pick the one you need next.") rather than an undifferentiated block.
- On desktop, keep the 4-across grid but let the row breathe with slightly more gap; on tablet 2-across; mobile single column with a shorter image band (images at 4:3 on mobile waste vertical space).

## Technical notes

- Generate eight images at 1024x640, save to `src/assets/workshops/`, and externalize them via the assets CLI (`.asset.json` pointers) so the repo stays light.
- Add an `image` field to the `BUILD_LAYER` entries in `src/lib/framework-deliverables.ts` (pointer import per capability), with a safe fallback to the current flat card if a pointer is missing.
- Extract the card into `src/components/home/BuildLayerCard.tsx` so `HomeFramework.tsx` just maps over `BUILD_LAYER`. The same card can then be reused on `/build`.
- All colors via existing semantic tokens (`bg-card`, `border-primary/40`, `text-muted-foreground`); the scrim uses a `card`-based gradient, no hardcoded hex.
- Images get descriptive `alt` text and `loading="lazy"`.

## Out of scope

- Card copy stays exactly as written.
- No changes to routing, pricing, or the workshop catalog data model beyond the new image field.
