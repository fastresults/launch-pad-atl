# Fix logo placement: vector mark, no plates

## What's actually happening in your screenshot

Three separate layers stack up in the bottom-right corner, and each one is added by a different part of the pipeline:

1. **The pale gray block** — painted by the image model. We currently tell it to leave a "logo landing area" of a specific size in a specific corner. Despite the prompt forbidding frames and plates, the model interprets "reserved area" as "paint a subtle panel there." Verified in `cover-art-director.ts`: the reserved-zone directive is sent on every cover.
2. **The white rounded chip with a drop shadow** — painted by our compositor. `logo-compositor.ts` only takes the clean "direct composite" path when the logo bitmap has real transparency; otherwise it draws a white chip. The mark saved from Logo Studio is an SVG that includes a white background rectangle, so after rasterisation it reads as fully opaque and falls into the chip branch.
3. **The logo itself** — full-color, at whatever colors the SVG defines, regardless of what it's sitting on.

So the mark is being treated as an opaque raster sticker instead of a vector mark.

## The fix

**A. Treat the mark as vector ink, not a picture**
- Strip background fills from the SVG before rasterising (full-canvas `rect`/`path` fills matching the viewBox, plus any pure-white background layer), so the raster is genuinely transparent.
- Belt-and-braces: after rasterising, knock out any remaining uniform border color to alpha and trim the bitmap to the ink bounding box, so there's no dead margin baked into the mark.

**B. Color the mark for contrast, automatically**
- Measure the luminance of the region the mark will land on.
- Re-render the vector in a single contrast-safe color drawn from the kit: brand ink on light regions, brand surface/white on dark regions — a knockout, exactly how a designer would place a mark on photography.
- Keep the full-color version only where it clears contrast on a flat brand surface (avatars, and covers where the landing region is near-neutral). Never recolor the avatar mark — that's the brand's hero placement.

**C. Delete the plates entirely**
- Remove the white chip, the shadow, and the footer-band branch from the cover path. The mark composites directly onto the image, always.
- If contrast is still marginal after recoloring, apply a soft local gradient scrim (a darkening/lightening falloff from the corner, no hard edge) instead of any rectangle.

**D. Stop asking the model for a landing area**
- Drop the reserved-zone directive from the cover prompt. Replace it with composition guidance only: keep the chosen corner visually quiet (no focal subject, no busy detail) — no mention of an area, zone, rectangle, or space for anything. That removes the source of the gray block.
- Keep the existing "no borders/frames/plates anywhere" ban.

**E. Verify**
- Add a QA check that measures contrast between the composited mark's ink and the pixels behind it, and record it alongside the existing contrast QA so a bad placement is visible in the preview panel rather than silently shipped.
- Regenerate the LinkedIn header, Facebook cover, and Instagram set for Anderson Elderly Residences and confirm: no plate, no chip, mark reads cleanly.

## Technical notes

- `supabase/functions/_shared/logo-raster.ts` — add an SVG pre-pass that removes background rects and accepts a monochrome override (force `fill`/`stroke` to one hex); expose `rasterizeSvgMono(svg, hex, width)`.
- `supabase/functions/_shared/brand-logo-bitmap.ts` — return the SVG source text alongside the bitmap so downstream consumers can re-render in an arbitrary ink color; cache per-color rasters (`...@1024-<hex>.png`). Add alpha knockout + bbox trim for raster-only marks that ship with a white background.
- `supabase/functions/_shared/logo-compositor.ts` — remove the chip and footer-band branches for non-avatar placements; always direct-composite. Replace the surface-swap logic with a "pick knockout ink" decision from `avgLuminance()` behind the box, and add the radial scrim fallback.
- `supabase/functions/venture-social-cover/index.ts` — pass the SVG text/kit colors into `compositeLogo`, drop `logoZoneHint` from the prompt call, and record a `logo_contrast` value into QA.
- Same compositor path also serves `venture-content-ad`, so Content Studio ads get the fix at the same time.
