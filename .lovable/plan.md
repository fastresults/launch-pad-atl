## Problem
On narrow mobile widths, the header row (logo + "Reserve" pill + hamburger) overflows horizontally, pushing the hamburger off-screen. Causes:
- Logo has no `shrink` allowance, so it eats all the row width.
- Hamburger is `size-11` (44px) and "Reserve" pill has generous padding; combined width + gap exceeds the row on ~360–375px viewports.
- No `min-w-0` on the row's left side to let flex children shrink.

## Fix (scoped to `src/components/site/Header.tsx`)
1. Add `min-w-0 shrink` to the logo `<Link>` so it can compress instead of pushing siblings out.
2. Step the logo down on the smallest screens: `h-8 sm:h-9 md:h-12`.
3. Mark the mobile right cluster `shrink-0` and tighten its gap: `gap-1.5`.
4. Shrink the hamburger button to `size-10` and the "Reserve" pill to `px-3 py-1.5 text-xs sm:text-sm` so both fit comfortably alongside the logo at 360px.
5. Reduce the outer container horizontal padding on the smallest screens (`px-3 sm:px-4 md:px-6`) to claw back a few pixels.

No other files touched. No business-logic changes.

## Verification
- Drive Playwright at viewport 360×800 and 390×844, screenshot the header on `/`, confirm hamburger is fully inside the viewport and tappable.
- Confirm desktop (`lg+`) layout is visually unchanged.