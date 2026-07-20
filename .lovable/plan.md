# Hero: bigger cup, tighter composition

Goal: Make the coffee cup and steam ~2× larger, and remove the excess vertical whitespace under the left column and around the cup on the right.

## Changes (all in `src/components/home/HomeFramework.tsx`, Hero only)

**Grid re-balance**
- Shift from `lg:col-span-8 / lg:col-span-4` to `lg:col-span-7 / lg:col-span-5` so the right column has room for a larger cup without overflow.
- Tighten grid gap on large screens: `lg:gap-14` → `lg:gap-10`.

**Coffee cup + steam (2× larger)**
- Remove the `max-w-[280px]` cap and the inner `w-[86%]` shrink on the image; render the cup at full column width (`w-full`, on mobile cap at `max-w-[420px]` centered, was 280).
- Move cup upward so steam breathes into the kicker row: wrap in a `-mt-4 lg:-mt-8` container and let steam extend above via `-translate-y-8`.
- Steam SVG: grow from `h-[28%] w-[46%]` to `h-[46%] w-[72%]`, increase `strokeWidth` 2.2 → 3, and lengthen the wisp paths' vertical travel (`y: [0,-10,0]`) so motion reads at the larger scale.

**Whitespace cleanup (left column)**
- The big empty gap under the deck comes from `mt-auto pt-10` pushing "Designed for" to the bottom to match the tall right column. With the right column now taller (bigger cup + card), reduce to `mt-10 pt-0` so the list sits naturally under the paragraphs.
- Reduce `mt-8` → `mt-6` on the deck paragraph and `mt-4` → `mt-3` on the secondary paragraph to tighten rhythm.
- Section vertical padding: current outer `py-*` on the hero section — trim top padding one step (e.g. `pt-16` → `pt-10` on lg) so the masthead sits closer to the H1.

**Price card**
- Reduce `mt-8` above the price card to `mt-6` so it hugs the cup baseline.

## Guardrails
- No copy changes.
- No color/token changes; keep Warm Sand palette.
- Preserve `useReducedMotion` behavior for steam + cup float.
- Verify at 1280 and 1851 CSS widths that: (a) cup is visibly ~2× today's size, (b) no empty band between deck copy and "Designed for", (c) price card bottom aligns near the "Designed for" list bottom.
