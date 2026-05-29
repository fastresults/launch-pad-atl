# Fix: Mobile business-ideas rail looks static

## Problem
On the home page section "What others are starting in 2026", the mobile view (`MobileScroller` in `src/routes/index.tsx`, lines ~746–757) is a plain horizontal `overflow-x-auto` rail. Cards fill the viewport edge-to-edge, nothing animates, and there's no peek of the next card — so users don't realize they can swipe. Desktop/tablet already auto-scroll via `MarqueeRow`.

## Goal
Make it obvious on mobile that the rail is swipeable AND have it auto-scroll on its own, matching the desktop marquee behavior — without breaking touch scrolling.

## Changes (mobile only, `src/routes/index.tsx`)

1. **Reuse `MarqueeRow` on mobile** instead of the static `MobileScroller`.
   - Replace the `md:hidden` block to render two `MarqueeRow`s (rowA left, rowB right) at a slightly slower speed tuned for small screens.
   - Keep the existing desktop block unchanged (`hidden md:block`).
   - If `MarqueeRow` doesn't already pause on touch/hover, add `pause-on-hover` + `touch-action: pan-x` so a user finger drag pauses the auto-scroll and lets them swipe freely; releases resume the animation.

2. **Card peek (visual affordance)** — constrain `IdeaCard` width on mobile so ~15% of the next card is always visible at the right edge (e.g. `w-[85vw] max-w-[340px]`). This is the strongest "there's more →" signal.

3. **Swipe hint chip** — under the category pills, add a small mobile-only line: `← swipe to explore →` with subtle muted styling and a fade-out after first user interaction (simple `useState` flag toggled on touchstart).

4. **Edge fade mask** — add a left/right gradient fade on the mobile rail container (`mask-image: linear-gradient(...)`) so cards visibly bleed off both edges, reinforcing the scrollable affordance.

5. **Remove `MobileScroller`** once unused, or keep as dead code removed in same edit.

## Out of scope
Desktop layout, card content, category filter behavior, copy outside the new hint chip.

## Verification
- Preview at 375×812 and 390×844: rail auto-scrolls slowly, next card peeks at right edge, edge fade visible, hint chip shows then fades after swipe.
- Finger drag pauses animation and scrolls freely; release resumes.
- Desktop 1366+ unchanged (still two `MarqueeRow`s).
- No horizontal page scroll introduced.
