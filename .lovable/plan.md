# Make channel kit tiles deletable for a clean re-generate

## Problem
Today each tile only offers Regenerate, which re-runs against the same record (carrying canvas plan, prior feedback, prior seed). Users have no way to fully discard a bad image and start from a blank slate. They want "delete → fresh generate".

## Solution
Add a Delete action per asset tile and surface it inside the full-size preview modal. Delete removes the stored asset (DB row + storage object) so the tile returns to its empty "Generate" state, producing a brand-new asset with no inherited context.

The backend already supports this — `deleteSocialAsset(snapshotId, assetId)` calls the existing `venture-social-cover` `delete` action. Only UI wiring is needed.

## UX changes (`SocialAutopilot.tsx`)

1. **Tile row actions** (only when `t.signed_url` exists):
   - Add a small ghost `Trash2` icon button between Download and Keep/Regenerate.
   - Confirm via lightweight `AlertDialog` ("Delete this image? The tile will reset and you can generate a fresh one.").
   - On confirm: call `deleteSocialAsset(snapshotId, t.id)`, invalidate `["social-cover", snapshotId]`, clear `errors[k]`, clear `kept[k]`. Tile reverts to placeholder + the existing "Generate" button (already shown for `!done && !err`).

2. **Empty tile after delete**: the existing `Generate` button (line 959–980) already handles fresh creation — no extra wiring needed because `generateOneKitTask` will insert a new row when none exists.

3. **Preview modal** (`AssetPreviewDialog`): add a `onDelete` prop and a "Delete" button next to Regenerate. Same confirm + same handler. Close modal on success.

4. **Style preview tiles** (`StyleStep` section, lines 533–600): apply the same Delete affordance to the cached style previews via a parallel `deleteStylePreview` helper (already exposed pattern in `style-preview.functions.ts`; add if missing — mirror the cover delete action).

5. **Loading state**: while delete is in-flight, show `Loader2` on the trash button and disable Regenerate/Keep to prevent races. Reuse existing `runningKeys` map with a `:delete` suffix to avoid collision with generation spinners.

6. **Toast**: `toast.success("Deleted — tile is ready for a fresh generation")`.

## Files touched
- `src/components/hub/social/SocialAutopilot.tsx` — add delete buttons (kit tiles + style tiles), confirm dialog, handler.
- `src/components/hub/social/AssetPreviewDialog.tsx` — add `onDelete` prop + button.
- `src/lib/style-preview.functions.ts` — add `deleteStylePreview` if not present (mirror cover delete).
- (No edge function changes — `venture-social-cover` `delete` action already exists.)

## Out of scope
- No changes to generation prompts, QA, or signature compositor.
- No bulk-delete; tile-level only (Regenerate-all still covers the "nuke everything" case).
