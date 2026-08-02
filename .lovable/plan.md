## What's happening

**Random order:** already implemented — `shuffleScenes()` Fisher-Yates shuffles the 15 scenes on every mount, so each visit gets a new sequence. I'll add one safeguard so the first scene is never the same as the previous visit (stored in `sessionStorage`), and so a reshuffle never repeats the prior order.

**The jerk:** in `src/styles.css`, the Ken Burns zoom (`hero-drift`, 9s) is attached only to `.hero-scene[data-active="true"]`. The moment a scene stops being active, the animation is stripped and its transform snaps from `scale(1.14)` back to `scale(1)` — instantly — while the image is still visibly fading out over 1400ms. That snap-back is the jerky shrink. There's also a timing mismatch: the drift runs 9s but the scene changes every ~7s, so the zoom is still mid-motion at the handoff.

## Fix

1. **`src/styles.css` — hold the end state on exit**
   - Give `.hero-scene` a resting transform equal to the drift end state (`scale(1.14) translate3d(-1.2%, -1%, 0)`) so an outgoing image keeps its zoom instead of snapping back.
   - Add `transform` to the transition alongside `opacity` with matching easing, so any residual change eases rather than jumps.
   - Set the active drift duration to match the scene cycle (7s) with `animation-fill-mode: forwards` and a linear/`ease-out` curve that lands exactly where the resting transform sits — the animation ends and the static transform takes over with zero visual delta.
   - Cross-fade tuning: keep opacity at ~1400ms ease-in-out on both entering and leaving layers so the two images overlap continuously (no gap, no double-exposure flash).
   - Reduced-motion block stays: no drift, static scale.

2. **`src/components/home/CinematicHero.tsx`** — no structural change needed; only ensure inactive images keep `data-active="false"` (already the case) and that the previously-active scene is allowed to finish its fade (it is, since all images stay mounted).

3. **`src/lib/founder-scenes.ts`** — extend `shuffleScenes` to accept an "avoid" first-scene id, and have the hero read/write the last-shown first scene id in `sessionStorage` so consecutive visits never open on the same image or the same order.

## Verification

Playwright run capturing hero frames across two full scene transitions to confirm the outgoing image no longer shrinks abruptly, plus two page loads to confirm different opening scenes.
