# Logo-On-Every-Asset Enforcement

## Problem

The cover/banner/post screenshots ship with an empty grey rectangle where the logo should be. Reason: in `supabase/functions/_shared/cover-art-director.ts`, the prompt for non-avatar assets explicitly tells the image model:

> "Reserve a clean rectangular zone in a non-focal corner … do NOT place the attached logo into the image; just leave room … we composite this exact logo on top later."

…but `supabase/functions/venture-social-cover/index.ts` never performs that compositing step. The model dutifully leaves an empty box, the file is uploaded as-is, and the user sees a logoless asset. Avatars work because the avatar branch hands the raw logo PNG through with a flat surface — the model just centers it.

## Fix

Make logo placement a guaranteed, deterministic, server-side step for every asset kind. Stop relying on the model to do it.

### 1. Add a logo compositor — `supabase/functions/_shared/logo-compositor.ts`

- Pure Deno + WASM PNG decode/encode (use `npm:upng-js` or `https://deno.land/x/pngs`) — no native deps.
- Exports `compositeLogo(baseBytes, logoBytes, opts)` returning PNG bytes.
- `opts`:
  - `placement`: `"avatar-center" | "banner-corner" | "post-lockup" | "thumbnail-lockup"`
  - `surfaceHex`: from `CanvasPlan.surface` (used to draw a clean rounded "logo chip" behind the mark so it always survives whatever the model rendered).
  - `inkHex`: from `CanvasPlan.ink` — passed through for future tint variants.
- Behavior:
  - Computes a target box per placement rule (e.g. banner: bottom-right, 14% of shortest side, 6% inset; post/thumbnail: top-left, 18%; avatar: 70% centered).
  - Draws a flat `surfaceHex` rounded-rect chip with ~10% padding behind the logo so contrast is guaranteed regardless of the underlying art.
  - Letterboxes the logo into the chip preserving aspect ratio (no warping — reuse the existing `fitBox` approach).

### 2. Wire the compositor into `venture-social-cover/index.ts`

- After the model returns `bytes` (and after the QA/retry pass), if `logoBytes` exists:
  - Avatars: keep current behavior (the model already centers it on a flat surface, but run compositor in `avatar-center` mode anyway as a guarantee — eliminates any model drift, crops, or recolors).
  - All other asset kinds (`banner`, `header`, `channel_art`, `thumbnail`, `video_poster`, `vertical_pin`, `pinned_post`, `story_cover`, …): pick the placement from a small map keyed on `asset.kind` and composite.
- Upload the composited bytes (not the raw model output) to storage.
- Record `logo_composited: true` on `qa_notes` for traceability.

### 3. Update the prompt to match the new contract

In `supabase/functions/_shared/cover-art-director.ts`:

- Replace the "leave a clean rectangular zone … do NOT place the attached logo" language with a per-placement instruction that names the **exact reserved zone** (e.g. "Bottom-right 18% × 18% safe zone must remain a flat ${plan.surface} field — no type, no shapes, no texture in that rectangle. We will composite the logo there.").
- Keep the "do NOT redraw / invent a logo" rule.
- Tell the model the reserved chip will be `plan.surface`, so it should compose the rest of the canvas so the chip reads as intentional (not as a hole).

### 4. Mirror the same compositing in `venture-style-preview/index.ts`

Style preview thumbnails should show the user the logo placement too — otherwise Step 4 tiles still look logoless even after we ship.

### 5. No DB schema change required

`venture_social_assets.qa_notes` already stores JSON; add `logo_composited` there.

## Technical notes

- Decode/encode path stays on the edge — files are small (≤2048px) so WASM PNG ops are well under the function CPU budget.
- Compositor is asset-kind driven; adding new platforms later only requires extending the placement map.
- If `logoBytes` is missing (no uploaded mark), skip compositing and fall back to the current "no logo" prompt branch.

## Files touched

- New: `supabase/functions/_shared/logo-compositor.ts`
- Edit: `supabase/functions/_shared/cover-art-director.ts` (prompt language for the reserved zone)
- Edit: `supabase/functions/venture-social-cover/index.ts` (composite before upload)
- Edit: `supabase/functions/venture-style-preview/index.ts` (composite before upload)
