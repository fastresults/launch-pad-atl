## Goal
Every file in the Media Hub (admin library + user hub) gets a quick **Preview** and a **Copy URL** action — accessible from both the card/list rows and the detail drawer.

## Changes

**1. `src/components/media/MediaHub.tsx`** — only file touched.

**Detail drawer (already has signed `previewUrl`):**
- Add a **Copy URL** button next to Download / Re-run AI that writes `previewUrl` to the clipboard via `navigator.clipboard.writeText` and shows a `toast.success("Link copied")`.
- URL is the 1-hour signed URL already produced by `getAssetSignedUrl`. Add a small helper note in the drawer: "Link expires in 1 hour."

**Card (grid) and row (list) quick actions:**
- Add two icon buttons on every asset (visible on hover for grid, always for list): **Eye** (Preview) and **Link** (Copy URL).
- Preview: opens the existing detail drawer (same as clicking the card) — guarantees inline preview for images, PDFs, audio, video; fallback message for other types (already implemented in `Preview` component).
- Copy URL: calls a new `copyAssetUrl(assetId)` helper that invokes `getAssetSignedUrl` server fn on demand, copies the returned signed URL, and toasts. No drawer open required.
- `stopPropagation` on both buttons so they don't trigger row selection / drag.

**Bulk action (nice-to-have, small):**
- When exactly one asset is selected, the existing toolbar gains a **Copy URL** button using the same helper.

## Out of scope
- No server-fn changes — `getAssetSignedUrl` already returns a signed URL and works for both admin (`master-media`) and user (`user-media`) assets.
- No new permanent/public URLs — signed URLs only (respects bucket privacy + RLS).
- No changes to upload, push-to-user, folders, collections, drag-and-drop.

## Technical notes
- Single helper inside `MediaHub.tsx`:
  ```ts
  const copySignedUrl = async (assetId: string) => {
    const { url } = await getSignedFn({ data: { assetId } });
    await navigator.clipboard.writeText(url);
    toast.success("Link copied (valid 1 hour)");
  };
  ```
- Uses existing `useServerFn(getAssetSignedUrl)` (already wired for `AssetThumb`).
- Icons: `Eye`, `Link` from `lucide-react` (already imported elsewhere or added to existing import).