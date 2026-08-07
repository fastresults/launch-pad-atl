# Content Studio — Art Direction Cleanup

Three fixes to the poster compositor so ads read like real editorial layouts: measured text contrast, proper margins and gaps, and a true vector logo with no plate.

## 1. Text contrast measured from the actual photo

Today ink color is picked from the brand surface color, not from what is actually behind the text. In the sample the black serif headline sits over a bright window and pale porch, so it loses contrast at the top lines.

- Sample the real pixels of the generated plate inside the text block region (a coarse grid over the headline, kicker, and CTA bounding boxes) before choosing ink.
- Choose ink (near-white vs near-black) by whichever wins WCAG contrast against the sampled mean, and require >= 4.5:1.
- If it still falls short, deepen the scrim locally: raise scrim opacity in steps until the measured contrast clears, rather than always using a fixed gradient. For `centered-plate`, do the same with plate opacity.
- Apply the same test to the kicker: keep it gold only when the gold clears ~3:1 against the sampled background; otherwise fall back to ink at reduced opacity.
- Record the measured ratio per element in QA (`headline_contrast`, `kicker_contrast`) so the preview panel shows it alongside the existing QA pill.

## 2. Margins, gaps, and safe zones

Current padding is a flat fraction and the block is bottom-anchored with no guard against colliding with the logo or the canvas edge.

- Define one margin scale per aspect (a single `safeInset` derived from the short side, ~7% for 1:1, ~6% for wide, ~8% for vertical) and use it for left, right, and bottom for every layout — no separate ad-hoc pads.
- Enforce a minimum optical gap between the type block and the logo box: if they overlap or come within one inset, shrink headline size a step or move the logo to the opposite corner.
- Normalize the vertical rhythm: kicker -> headline gap = 0.8x kicker size, headline -> rule = 0.6x headline size, rule -> CTA = 1.1x CTA size. Remove the current mixed multipliers that make gaps look random across layouts.
- Cap the type block at ~52% of canvas height; if the fitted lockup exceeds it, drop headline size before adding lines.
- For `edge-rule`, align the rule to the same left inset as the text with a consistent gutter, so text is not pushed off the balanced grid.

## 3. Logo as vector ink, no plate

The ad path currently drops the raw logo data URL straight into the SVG, so whatever background the stored raster carries (white box) shows up.

- Route the ad logo through the same vector path the cover compositor uses: strip the SVG background, then either keep the original colors when they clear contrast, or knock the mark out in a single ink color chosen by the luminance of the region behind the logo corner.
- Never draw a rect, chip, or plate behind the logo on content ads.
- Prefer a quiet corner: sample the four corner regions of the plate and place the logo in the calmest, highest-contrast one (still respecting the type block's corner).
- Keep the small tier as default, but pad the logo box by the same `safeInset` used for the type so the mark is optically aligned with the headline's left/right edge.
- Add `logo_contrast` and `logo_plate: false` to the QA payload.

## Technical notes

- `supabase/functions/_shared/content-ad-svg.ts` — contrast sampling, margin scale, rhythm constants, collision handling, logo emission without plate.
- `supabase/functions/venture-content-ad/index.ts` — pass the pre-composite plate bytes for sampling, resolve the logo through `stripSvgBackground` / mono rasterization instead of the raw data URL, extend the QA object.
- `supabase/functions/_shared/logo-raster.ts` and `image-qa.ts` already provide background stripping, mono recolor, and luminance helpers; reuse them rather than adding new ones.
- No schema change. Existing assets are unaffected until regenerated.
