# Fix: regenerated assets still miss the brand "splash"

## Audit findings

The previous pass added a `signature` color, prompt language, and a coverage QA — but the splash still goes missing on regenerate. Three real bugs explain it.

1. **Signature-coverage detector matches the wrong pixels.**
   `image-qa.ts` uses a raw RGB squared-distance threshold of `60²`. A dark plum (e.g. `#1A0D2E`) is within that distance of plain black. So a fully black/gray render *passes* the signature check — QA reports "8% coverage" when there is literally no purple on screen. No retry fires.

2. **The signature picker accepts near-invisible hues.**
   `pickSignature` only requires saturation ≥0.25. Dark, desaturated brand purples (lightness <0.20) qualify and then disappear into the surface in a photographic duotone. The picker needs a *visible* hue band, and if the kit only offers a dim hue, we must screen-boost a displayable tint to use as the actual splash target.

3. **The pass threshold is too lenient for photographic.**
   Photographic minimum is 15% with a 60% tolerance → effective 9%. A sliver in one corner clears it. For photographic the "splash" must be a real duotone wash or a confident color block, not a pixel margin.

A fourth contributor on regenerate: the retry only fires inside the single function call. If the founder hits Regenerate again, we start over with the same plan, the same hex, and the same too-lenient QA — same result. We need both the plan and the QA to be stricter on every call.

## Plan

### 1. Replace the signature-coverage detector with a perceptual + hue check
`supabase/functions/_shared/image-qa.ts`:
- Convert pixels and `plan.signature` to OKLab (or HSL hue+sat) for matching, not raw RGB distance.
- A pixel counts toward signature coverage only if (a) ΔE to signature is small AND (b) the pixel is itself perceptibly chromatic (saturation ≥ ~0.20 and lightness in [0.15, 0.92]). Black/white/gray pixels never count, even if they're "close" in RGB to a near-black brand hue.
- Return both `signatureCoveragePct` and a new `signatureVisible` boolean. QA fails if `signatureVisible` is false regardless of nominal pct.

### 2. Make the signature actually visible
`supabase/functions/_shared/canvas-plan.ts`:
- Add a `displaySignature` field: the hex we send to the model and check against in QA. If the picked role's lightness is <0.25 or saturation <0.35, derive a displayable tint (raise L to ~0.45–0.55, keep hue) and use that as `displaySignature`. Keep the original kit hex as `signatureRole` reference only.
- Raise `signatureCoverageFor` for photographic to 22% (duotone wash target) and for editorial to 18%.
- Tighten QA tolerance band in `image-qa.ts` from 0.6× to 0.75× of the plan minimum.

### 3. Make the art-director prompt name and show the displayable hue
`supabase/functions/_shared/cover-art-director.ts`:
- Reference `plan.displaySignature` everywhere the prompt currently references `plan.signature`, so the model is told "use #X" where X is actually visible.
- Strengthen the photographic brief: "the duotone midtones must read clearly as the SIGNATURE hue, not as neutral gray; if the source subject is monochrome, add a confident signature-colored gradient wash or a flat signature block behind the subject covering ≥25% of the canvas."
- Add an explicit failure clause: "If the final image, viewed at thumbnail size, could be mistaken for grayscale, it is a failure."

### 4. Make the palette tile reflect the displayable hue
`supabase/functions/_shared/palette-tile.ts`:
- Swap the signature swatch to `displaySignature` so the reference image the model sees matches the prompt instructions.

### 5. Wire the retry note to the real failure reason
`supabase/functions/venture-social-cover/index.ts` and `supabase/functions/venture-style-preview/index.ts`:
- Use the new `signatureVisible` flag in the retry decision. If signature is invisible, the retry note becomes binding: "The previous render contained no perceptible {hex} pixels. Add a confident {displaySignature} block, sidebar, or duotone wash covering ≥{min}% of the canvas." No fallback to "looks close enough."
- Persist `plan.displaySignature` and the new QA fields onto `venture_social_assets.canvas_plan` / `qa_notes` for traceability.

### 6. Regenerate-with-feedback always re-evaluates
Confirm that every regenerate call rebuilds the plan (it does today via `buildCanvasPlan`), but also bump `variationSeed` into the *composition* guidance so the model doesn't repeat its prior framing — keeps the brand rules constant, varies the layout.

## Files touched

- `supabase/functions/_shared/canvas-plan.ts`
- `supabase/functions/_shared/image-qa.ts`
- `supabase/functions/_shared/cover-art-director.ts`
- `supabase/functions/_shared/palette-tile.ts`
- `supabase/functions/venture-social-cover/index.ts`
- `supabase/functions/venture-style-preview/index.ts`

No DB migration. No frontend changes.

## Acceptance check

After the change, regenerating the YouTube thumbnail in the screenshot must either (a) come back with a clearly visible purple block/wash, or (b) auto-retry once with a binding signature note before returning. A black-and-white render must never pass QA again.
