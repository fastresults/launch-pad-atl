# Hero: rebalance the composition

Award-winning eye on the current state: the two columns don't share a baseline, the cup floats in a sea of cream with a visible gap before the price card, and the left column dead-ends into ~300px of empty space below "Designed for." The fix is structural, not decorative.

## Root causes

1. **Right column is two disconnected objects** (cup, then card) stacked with a gap — no visual through-line.
2. **Left column ends too early** — "Designed for" sits mid-column and leaves a large empty band beneath it.
3. **Grid split (7/5) still gives the cup more air than it can fill**, so the cup reads as small inside its own column.
4. **No shared bottom baseline** — the left "Designed for" list and the right price card end at wildly different Y positions.

## Structural moves (all in `src/components/home/HomeFramework.tsx` Hero)

**Unify the right column into a single object**
- Merge the cup and the price card into one composed unit: the cup sits *inside* the top of the price card, breaking its top edge (classic editorial "cameo" move). Cup image gets `-mt-24 lg:-mt-32` and sits above the card border, saucer tucks into the card's top padding.
- The steam then rises into the space *above* the card that used to be dead air — it now has narrative purpose (steam rising off the offer).
- Result: one tall composed object on the right instead of two floating ones.

**Rebalance grid to 6/6 (true symmetry)**
- Change `lg:col-span-7 / lg:col-span-5` → `lg:col-span-6 / lg:col-span-6`.
- The composed cup+card unit is now wide enough to visually match the headline column.
- Gap stays at `lg:gap-12`.

**Give the left column a real closing element**
- Add a short signed-off editorial pull quote *below* "Designed for" — one line, italic serif, `#8B7355`, e.g.:
  > *"You don't need another course. You need one morning and someone who's built this before."*
  > — Adam Anderson
- This absorbs the empty band and gives the left column an ending that matches the CTA weight on the right.

**Shared bottom baseline**
- Left column: `flex flex-col` + the pull quote sits at `mt-auto pb-2` to hug the bottom.
- Right column: composed card ends naturally at the CTA + fine-print link.
- Both columns end within ~24px of each other.

**Cup + steam sizing (keep the recent 2× scale)**
- Cup: `w-full max-w-[440px]` centered inside the card's top overhang.
- Steam: keep current larger scale, but re-anchor to the card so it rises from a defined origin rather than floating in space.

**Tighten vertical rhythm**
- Masthead ("Issue No. 01") → H1: reduce `mb-10` to `mb-6`.
- Kicker → H1: reduce `mb-6` to `mb-4`.
- These trims remove ~40px of top whitespace so the hero doesn't push below the fold on 1386px viewports.

**Price card refinements**
- Increase top padding to `pt-32 lg:pt-36` to make room for the tucked-in cup.
- Add a subtle hairline under the cup area (inside the card) before the `$297` — separates the illustration zone from the offer zone.
- Everything below (`$297`, deck, CTA, fine print) stays.

## Guardrails

- No copy changes except adding the closing pull quote.
- No palette changes; Warm Sand tokens only.
- Preserve `useReducedMotion` behavior.
- Verify at 1386 and 1851 CSS widths: (a) both columns end within ~24px of each other, (b) no empty band > 80px anywhere, (c) cup+card reads as one composed object.
