## What's wrong in the attached render

The "startuplabs" logo sits in a tiny light-gray rectangle floating over the concrete background. Two concrete defects in `supabase/functions/_shared/logo-compositor.ts` cause this:

1. **Wide wordmarks get shrunk by the width cap, not enlarged by it.**
   The chip is sized height-first (`boxH = short * heightFrac * padCompensation`), then width is derived from logo aspect. For a ~4:1 wordmark on a landscape canvas, that produces `boxW ≈ 0.60 * W`, which exceeds `maxWFrac` (0.48 md / 0.58 lg). The clamp path then does `boxW = maxW; boxH = boxW / aspect` — which **shrinks the height** (and therefore the logo) well below the tier's target. The wider the wordmark, the smaller the logo ends up. That's the opposite of what the tiers imply.

2. **The chip reads as a pasted sticker, not integrated art.**
   - Chip is a fully opaque flat `plan.surface` rectangle with hard 90° corners and no shadow/edge treatment.
   - `plan.surface` for this brand is a light neutral that lands very close to the base image's midtone gray, so the chip prints as a slightly-off rectangle outline instead of a deliberate lockup.
   - 8% inner padding on every side wastes another ~16% of the chip on empty surface color, making the logo look small even at "md/lg".
   - Transparent PNG logos still get a solid chip painted behind them even when they'd composite cleanly onto the artwork.

Secondary: the prompt-side `logoSafeZone` hint uses the same height-first math, so the reserved negative space the model paints doesn't match the actual composited chip — occasionally the chip lands on top of model-rendered content.

Note: no `[logo-compositor]` log line appears in `venture-social-cover` logs for the run in question, but that's just because the search window predates the console.log; the compositor is being called (image clearly shows the chip).

## Plan

Scope: `supabase/functions/_shared/logo-compositor.ts` and matching hint consumers. No UI changes.

### 1. Width-first sizing for wide logos, height-first for square/tall

Split the target math on aspect ratio:

- `aspect >= 2` (wordmark): drive from a new `widthFrac` per tier. `boxW = short * widthFrac`, `boxH = boxW / aspect`.
- `aspect < 2` (mark/badge): keep current height-first math.

New tier table (adds `widthFrac`, raises corner ceilings so lg can actually reach lg):

```text
sm: heightFrac 0.10, widthFrac 0.28, maxWFrac 0.42
md: heightFrac 0.14, widthFrac 0.36, maxWFrac 0.52
lg: heightFrac 0.20, widthFrac 0.46, maxWFrac 0.66
```

Keep a soft `maxWFrac` clamp, but when it triggers on a wordmark, clamp width **without** re-shrinking height below `heightFrac * short` — take the max of the two candidates.

### 2. Reduce inner padding

Drop `padPct` in `fitInside` from 0.08 to 0.05. Combined with the sizing fix, wordmark glyphs get ~35–45% more perceived height.

### 3. Chip finish: rounded corners + subtle drop shadow + transparent-logo fast path

- If the decoded logo has any pixel with alpha < 250 (transparent PNG), skip the chip entirely and composite the logo directly, sized to the same target box. Add a soft 8-px feathered scrim only when a luminance probe of the target region shows contrast against the logo's ink is < 3:1.
- Otherwise draw a rounded-rect chip: corner radius = `min(boxW, boxH) * 0.14`, plus a 1-pass Gaussian-ish soft shadow (offset y = 4 px, blur ~10 px, 25% alpha). Rounded rect and blur done by pixel-writing with imagescript (no native deps).
- Chip surface picker: probe average luminance of a small crop of the base image behind the chip. If |L(chip.surface) − L(base)| < 0.08, swap the chip color to `plan.ink` (dark) or `#FFFFFF`, whichever gives the higher contrast against the base — so the chip always reads as a deliberate lockup.

### 4. Sync the prompt safe-zone hint

Update `logoSafeZone` to use the same width-first / height-first branch and the same tier constants so the negative space the model reserves matches the chip we composite. Callers (`venture-social-cover/index.ts`, `venture-style-preview/index.ts`) need no signature changes.

### 5. Verify

- Add one console.log line summarizing the new decision: `aspect, tier, mode(width-first|height-first), chipW/H, pad, radius, chipMode(chip|direct), surfaceSwap(yes|no)`.
- Sanity-check by regenerating the current asset at md and lg on a wide wordmark and a square mark; confirm lg wordmark reaches ~46% canvas width and no chip prints when a transparent PNG is used.

### Files touched

- `supabase/functions/_shared/logo-compositor.ts` — sizing, padding, rounded/shadowed chip, transparent-logo path, surface-swap, updated `logoSafeZone`.

No client, DB, or other Edge Function changes.
