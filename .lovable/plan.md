
## Problems in the current preview

1. **Headline clips off the right edge** ("...business" is cut). The SVG's width estimator in `content-ad-svg.ts` underestimates Arial Bold, so `wrap()` believes a line fits when it actually overflows the canvas.
2. **Logo has no contrast guarantee.** The `startuplabs` wordmark is placed directly on whatever pixels sit under the bottom-right corner (often dark or busy), so it disappears or muddies.

## Fix plan (single file: `supabase/functions/_shared/content-ad-svg.ts`)

### 1. Headline never truncates visually

- Tighten `charUnits()` to match Arial Black/800 weight: bump default from `0.56 → 0.62`, caps `0.66 → 0.72`, `m/w` `0.88 → 0.95`, space `0.34 → 0.38`.
- Add a **right-edge safety margin**: compute `textW = W - x*2 - Math.round(W*0.02)` so wrapping reserves ~2% breathing room.
- Allow **3 lines on 1:1 and 4:5** (currently only 9:16 gets 3). Bump `maxLines` for 1:1 to 3, 4:5 to 3, 9:16 to 4.
- Lower `maxSize` cap from 98 → 84 so first pass doesn't lock in an oversized font.
- Sanity guard: after `wrap()` succeeds, re-check each line with a stricter multiplier (`estimatedWidth(line, size) <= textW * 0.98`); if any line fails, continue shrinking.

Result: the "40-page business plan…" headline wraps cleanly inside the band at every aspect.

### 2. Logo auto-contrast chip

Add a rounded background chip drawn *under* the logo image whenever it improves legibility:

- Determine chip color by luminance of `plan.surface` (the footer/brand surface):
  - If surface is dark (`lum < 0.35`) → chip = `#FFFFFF` at 92% opacity.
  - If surface is light (`lum > 0.7`) → chip = `plan.ink` (near-black) at 88% opacity.
  - Mid-tone → pick whichever of white/ink has higher contrast vs. surface.
- Only render chip when contrast(logo-region-bg, white) < 3.0 OR corner is `bottom-right` over the AI image (always risky). Simple rule: **always render the chip for `bottom-right`**, skip for `top-left` (which sits on the solid surface band and is safe).
- Chip geometry: `rect` with `rx = boxH * 0.22`, padded `boxW * 0.12` horizontally and `boxH * 0.18` vertically around the logo box, drawn before the `<image>` tag.

Extend `SvgArgs` with an optional `logoChip?: boolean` (default true for bottom-right) so callers can opt out. No changes needed in `venture-content-ad/index.ts` — it already passes `logoCorner: "bottom-right"`.

## Verification

- Regenerate the failing "40-page business plan" post — headline should wrap to 3 lines inside the band with no clipping.
- Confirm the `startuplabs` logo sits on a soft white pill with clear separation from the underlying photo.
- Spot-check a light-palette venture to confirm the chip flips to dark and top-left placements remain chip-free.
