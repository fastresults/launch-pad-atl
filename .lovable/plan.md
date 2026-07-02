
## Problem

On Step 5 ("Your ad batch is ready"), each Week 1 row currently has a plain "Open" link that just opens the raw image URL in a new tab. There is no preview modal and no way to delete an ad. Step 4 already has both — Step 5 was never wired up.

## Fix (single file: `src/components/hub/ContentStudio.tsx`, `Step5Launch` only)

1. **Row → modal.** Turn each ad row into a `<button>` that sets `previewIdx` (index into a flat, week-ordered `flatAds` array). Remove the `<a href={signed_url}>` "Open" link.

2. **Mount `AssetPreviewDialog`** at the bottom of `Step5Launch` (same component Step 4 uses). Map the selected ad + its post to a `PreviewableAsset` with the same fields Step 4 passes: `url`, `title` (hook), `subtitle` (`Week N · platform`), `assetKind` (aspect), `width`, `height`, `canvasPlan`, `qaStatus`, `qaNotes`, `modelUsed`, `lastFeedback`, `lastHeadline`, `lastLogoSize`, `updatedAt`. Provide `onPrev` / `onNext` cycling through previewable ads.

3. **Delete from modal.** Pass `onDelete` to `AssetPreviewDialog` that calls `deleteContentAd(snapshotId, ad.id)`, invalidates `["content-ads", snapshotId]` via `useQueryClient`, toasts, and closes the modal.

4. **Delete inline on each row.** Add a small trash-icon button on the right side of every row. `stopPropagation` so it doesn't open the modal; `confirm()` prompt; same `deleteContentAd` + invalidate + toast. Row disappears on refetch.

5. **Row hover affordance.** Add `hover:bg-white/5 cursor-pointer` so it's obviously clickable, plus a subtle "Click to preview" hint via `title` attribute.

## Technical notes

- `deleteContentAd` and `AssetPreviewDialog` are already imported at the top of the file.
- Add `useQueryClient` call inside `Step5Launch` (already imported from `@tanstack/react-query`).
- No changes to `BuildAdsPanel` (Step 4), edge functions, data model, calendar parser, or any other component.
- No new dependencies.
- Regenerate flow from Step 5 is out of scope for this pass — modal will show the image + metadata + delete; regenerate stays in Step 4.

## Files changed

- `src/components/hub/ContentStudio.tsx` — edit `Step5Launch` (~40 line addition, ~10 line replacement)
