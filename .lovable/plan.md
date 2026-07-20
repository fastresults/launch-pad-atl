## Goal
Drop the oval frame around the coffee cup so it sits naturally on the cream page, and give the steam a subtle, always-on drift.

## Changes (hero only, `src/components/home/HomeFramework.tsx` + one new asset)

1. **New illustration, no frame**
   - Generate `src/assets/hero-coffee-nosteam.png` (transparent background) — same watercolor cup + saucer as today but *without* the drawn steam wisps. Cream page shows through directly.

2. **Remove the circular frame**
   - Delete the `rounded-full border border-[#C9B99A] bg-[#FBF7F1]/60 ... shadow-...` container on the cup.
   - Cup renders directly on the hero background, centered in the right column, sized to match current visual weight (~86% of column width, max ~280px).
   - Keep the shared top/bottom baseline grid (kicker-aligned top, price card below).

3. **Animated steam overlay**
   - Add an inline SVG absolutely positioned above the cup rim (3 wisps, hand-drawn curved paths, stroke color `#8B7355` at ~35% opacity, slight blur).
   - Animate each wisp with `framer-motion`:
     - `y`: `0 → -8px` loop
     - `opacity`: `0.15 → 0.45 → 0.15`
     - `x`: tiny `±2px` sway
     - Staggered delays (0s, 0.8s, 1.6s), 4–5s duration, `easeInOut`, infinite.
   - Wrap in `useReducedMotion()` guard — if reduced, render static steam at mid opacity, no animation.

4. **Keep everything else untouched** — copy, price card, "Designed for" list, grid baselines, meta row all stay as-is.

## Technical notes
- Reuse existing `motion` import and `reduceMotion` variable already in `Hero`.
- Steam SVG lives inline (no new asset) so stroke color inherits from the palette and animates cheaply.
- Position steam with `absolute -top-6 left-1/2 -translate-x-1/2` inside a `relative` cup wrapper.
