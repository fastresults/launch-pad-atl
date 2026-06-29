## Problem

In the Brand Style Guide DOCX (Save to My Files), every embedded logo is forced into a fixed square via docx-js `transformation: { width: 360, height: 360 }` (primary), `200x200` (alternates), and `280x280` (cover). A wide wordmark like "startuplabs" gets stretched vertically into a square — the warping seen in the screenshot.

## Fix

Preserve each logo's true aspect ratio by measuring the image's natural dimensions before insertion and scaling to fit inside a max box (not a fixed square).

### Changes — `src/lib/brand-guide-docx.ts`

1. **Extend `fetchKitImage`** to also return `width` and `height` of the decoded image:
   - Decode the fetched bytes with `createImageBitmap(new Blob([arrayBuffer]))` (available in modern browsers, used by DOCX export which already runs client-side).
   - Fallback to an `HTMLImageElement` + `URL.createObjectURL` if `createImageBitmap` is unavailable.
   - Return `{ data, type, width, height }`.

2. **Add a `fitBox(natW, natH, maxW, maxH)` helper** that returns `{ width, height }` scaled to fit inside the max box while preserving aspect ratio (no upscaling beyond natural size for tiny SVG/PNGs — cap at max box).

3. **Apply `fitBox` at every `ImageRun` site**:
   - Primary logo card → max box `360 x 360`
   - Alternate logo grid → max box `200 x 200`
   - Cover logo (line ~937) → max box `280 x 280`
   - Any other logo embeds in the file follow the same pattern.

4. **Guard for missing dimensions**: if measurement fails, fall back to a conservative landscape box (e.g. `360 x 180`) rather than the current forced square.

No other call sites change. Color-swatch PNGs are generated at known dimensions and remain untouched.

### Verification

After build, regenerate the Brand Style Guide for the active venture with the uploaded `startuplabs` wordmark, open the DOCX, and confirm the primary logo renders with correct proportions (wider than tall, no vertical stretching). Repeat for a square mark to confirm square logos still render correctly.