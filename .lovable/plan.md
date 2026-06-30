## Why this is still happening

The code is asking the image model to use the brand signature color, but it is still relying on the model to obey that instruction. The screenshots show the generated asset is mostly grayscale even though the stored canvas plan includes a purple signature color (`#1F163D`). The current safeguards are not strong enough because:

1. **The QA retry can still ship failures**
   - The backend marks low-signature output as `QA fail`, but still saves and displays it if the single retry is not better enough.
   - This is why the UI shows a `contrast` / `QA fail` badge while the asset remains visible.

2. **The selected brand color is too dark to register as a “splash”**
   - `#1F163D` is a near-black purple. The model and the current thumbnail can easily render it as charcoal/gray.
   - The palette display in the modal shows the purple exists, but the artwork itself does not visibly contain a strong purple region.

3. **The deterministic logo-compositing step only guarantees the logo**
   - We now force the selected logo onto the image, but we do not deterministically force a brand-color shape/wash/block into the final pixels.
   - The model is still responsible for the brand-color splash, and that is the unreliable part.

4. **The UI hides the actual brand-signature diagnosis**
   - The asset preview shows `surface`, `ink`, and `accent`, but not the dedicated `signature` / `displaySignature` value or its measured coverage.
   - Users see `QA fail`, but not “brand color missing / only X% coverage.”

## Plan to fix

### 1. Make brand color enforcement deterministic, not prompt-only
- Add a backend post-processing step after image generation and before upload.
- If signature color QA fails, programmatically composite a brand-signature element into the image using the existing `canvas_plan`:
  - `sidebar_stripe`: solid edge stripe.
  - `anchor_block`: large corner/quadrant block.
  - `corner_mark`: solid tab/quarter mark.
  - `framed_border`: thick inner frame.
  - `focal_shape` / `duotone_wash` fallback: controlled translucent signature wash or solid accent panel.
- Use `displaySignature` as the visible output color, while preserving the raw brand color in metadata.
- Re-run QA after compositing so assets do not save as “pass” unless the signature is actually visible.

### 2. Stop accepting “invisible brand color” assets as normal output
- Keep saving the asset so the workflow does not dead-end, but mark it clearly when QA still fails.
- Change retry selection logic so signature-color improvement is prioritized over generic contrast improvement.
- If the retry still lacks the brand color, apply the deterministic signature overlay before upload.

### 3. Pass brand-signature controls through the whole client path
- `generateSocialCover` currently types only `snapshotId`, `platform`, `asset`, `direction`, and `feedback`; the caller passes signature controls via `as any`.
- Make `signatureIntensity`, `signaturePlacement`, and `signatureMinCoveragePct` first-class typed inputs so regeneration controls reliably reach the backend.

### 4. Improve the preview diagnostics
- Update the preview palette to show four colors: `surface`, `ink`, `signature`, `accent`.
- Show signature coverage from `qa_notes.observed.signatureCoveragePct` and whether the signature was visible.
- Rename the small failure badge from generic `contrast` to a more accurate label when applicable, e.g. `brand color missing` or `QA fail`.

### 5. Update regeneration defaults to match the user expectation
- For regeneration, default intensity should be `bold` when the previous asset failed signature coverage.
- Add a quick note like “Make brand color unmistakable” so users do not have to type “more purple” manually.

## Files to change

- `supabase/functions/_shared/image-qa.ts`
- `supabase/functions/_shared/logo-compositor.ts` or a new shared compositor utility
- `supabase/functions/venture-social-cover/index.ts`
- `src/lib/social-cover.functions.ts`
- `src/components/hub/social/SocialAutopilot.tsx`
- `src/components/hub/social/RegenerateAssetDialog.tsx`
- `src/components/hub/social/AssetPreviewDialog.tsx`

## Validation

- Generate/regenerate one YouTube thumbnail and verify the final stored asset contains a visible brand-color region.
- Confirm QA notes report signature coverage above the required threshold.
- Confirm the preview modal displays the signature color and coverage, not just a generic `contrast` badge.