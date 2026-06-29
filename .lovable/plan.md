## Goal
Replace the static Step 4 "Pick a look" mocks with brand-aware, AI-rendered preview tiles, each with its own Regenerate button (and a "Regenerate all"). Step 5 regenerate behavior stays as is.

## What changes

### 1. Brand-aware previews (replace CSS mocks)
- `StylePreview` in `src/components/hub/social/SocialAutopilot.tsx` currently draws CSS shapes from the palette. Swap to render an actual AI-generated thumbnail per direction (Editorial / Photographic / Geometric / Illustrative), composed with the venture's logo, palette, and typography.
- Fall back to the existing CSS mock while loading or if generation fails.

### 2. New thumbnail cache table
Add `venture_style_previews`:
- `id`, `snapshot_id`, `direction` (editorial|photographic|geometric|illustrative), `image_url`, `canvas_plan` jsonb, `qa_status`, `created_at`
- Unique on `(snapshot_id, direction)`. RLS + GRANTs mirroring `venture_social_assets`.

### 3. Edge Function: `venture-style-preview`
- Input: `{ snapshotId, direction, feedback? }`
- Reuses `_shared/canvas-plan.ts`, `palette-tile.ts`, `cover-art-director.ts`, and `image-qa.ts` (the same pipeline as Step 5) but at 1024x768 preview ratio.
- Uses brand kit (palette + logo PNG from `user-media`) as multimodal input so previews look like what the kit will actually produce.
- Upserts result into `venture_style_previews`.

### 4. UI: Regenerate on each Step 4 tile
In `Step4Style`:
- Per-tile overlay button (top-right): `RotateCcw` icon → opens `RegenerateAssetDialog` (already exists) prefilled with that direction; on submit calls `venture-style-preview` with `feedback`.
- Header action: "Regenerate all" → fires the function for all 4 directions in parallel with a single shared feedback string.
- Tile shows loading shimmer while regenerating; selection state preserved.
- First visit auto-generates any missing previews (one call per direction, parallel).

### 5. Client wrapper
Add `generateStylePreview(snapshotId, direction, feedback?)` in `src/lib/social.functions.ts` (next to `generateSocialCover`).

## Files touched
- `supabase/migrations/<ts>_venture_style_previews.sql` (new)
- `supabase/functions/venture-style-preview/index.ts` (new)
- `src/lib/social.functions.ts` (add wrapper)
- `src/components/hub/social/SocialAutopilot.tsx` (Step4Style + StylePreview)
- Reuse: `src/components/hub/social/RegenerateAssetDialog.tsx` (no change)

## Out of scope
- Step 5 tiles (already have regenerate).
- Changing the 4 direction options or copy.
