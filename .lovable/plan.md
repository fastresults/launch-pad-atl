## What I found (measured, not guessed)

Two stacked causes — the images are dark *and* the hero darkens them again.

**1. Source images are genuinely underexposed.** I measured average brightness (0–255) of all 21 scene files in `src/assets/scenes/`:

```text
bakery        7.5   ← nearly black
branding     10.6
fitness      13.7
coffee       22.4
photography  23.4
restaurant   29.7
realestate   32.5
foodtruck    35.6 ... roofing 36.1, detailing 39.3, matchmaking 41.0
seniorcare   45.0 ... boutique 46.3, ecommerce 54.6, autoauction 55.6
medspa       56.5, daycare 57.7, trucking 62.9, homehealth 66.4
landscaping  90.9, cleaning 96.6  ← the only two that read as "lit"
```
A healthy photographic hero sits around 70–110. Nine images are below 35, i.e. mostly black frames.

**2. The scrim on top removes most of what's left.** `.hero-scrim` in `src/styles.css:760` layers a near-opaque bottom gradient (`#05070F` at 4%, then 0.72 alpha at 38%), a 0.66-alpha top band, plus two colored haze radials. So even a well-exposed image loses ~60–70% of its luminance behind the copy area — and the copy area is exactly where the subject usually is.

## The fix

**A. Rebalance the scrim (biggest single win)**
- Drop the bottom stop from 0.72 → ~0.55, raise the mid-clear window (0.28 → ~0.14), soften the top band 0.66 → ~0.40.
- Keep enough darkness only directly behind the headline/glass card by narrowing the gradient to a bottom-weighted band instead of covering the full frame.
- Reduce the two haze radials (0.28 / 0.24 → ~0.16 / 0.14) so they tint rather than muddy.
- Verify headline and kicker still pass contrast against the brightest scenes (cleaning, landscaping) — if not, add a tighter local scrim behind the text block only rather than re-darkening the whole image.

**B. Normalize the images at the CSS layer**
- Add a `filter: brightness(...) contrast(...) saturate(...)` on `.hero-scene` to lift the whole set uniformly.
- For the worst offenders, add a per-scene brightness multiplier driven by a data attribute or an inline CSS variable set from `src/lib/founder-scenes.ts`, so bakery/branding/fitness get a bigger lift than cleaning/landscaping (which need none, and would blow out with a global boost).

**C. Tone-correct the source files**
- Re-expose the 9 images under ~35 average luma in place (gamma/levels lift preserving highlights) so the fix doesn't depend on CSS filters alone and mobile GPUs don't pay a filter cost. Files stay at the same paths, so no code changes needed for this part.
- Re-measure after correction; target 65–95 average for every scene so the rotation stops flickering between "black frame" and "bright frame."

**D. Verify**
- Screenshot the hero at desktop and mobile widths across several rotation steps (including bakery and cleaning, the two extremes) and confirm: subject visible, headline legible, no scene reading as a black rectangle, no scene blowing out.

## Technical notes
- Files touched: `src/styles.css` (`.hero-scene`, `.hero-scrim`, hero haze tokens), `src/lib/founder-scenes.ts` (optional per-scene exposure value), and the 9 underexposed JPEGs in `src/assets/scenes/`.
- No component logic, rotation timing, or Ken Burns behavior changes.
- Opacity stays at 100% as you last set it.
