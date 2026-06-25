# Fix Media Hub upload failure

## Root cause

The component and the library are out of sync on calling conventions.

- `MediaHub.tsx` calls every function like a TanStack-Start server fn: `createSignedFn({ data: { filename, ... } })`.
- `src/lib/media.functions.ts` exports plain async functions whose first arg **is** the data object, e.g. `createSignedUploadUrl(data: { filename, contentType })`.

So when the upload runs, the function reads `data.filename` from an object that actually looks like `{ data: { filename: "…" } }` — `data.filename` is `undefined`. The signed-upload path becomes `${uid}/${Date.now()}-undefined` (exactly what the storage PUT in the network log shows: `1782398707259-undefined`).

The PUT succeeds because Supabase happily accepts the signed URL, but:

1. The file is stored under a junk name with no extension.
2. The destructure `const { uploadUrl, asset } = await createSignedFn(...)` reads `asset` from a return value that only has `{ uploadUrl, path }`, so `asset` is `undefined`.
3. `finalizeFn({ data: { assetId: asset.id } })` throws on `asset.id` — or, even before that, doesn't match `finalizeUpload`'s signature (`{ path, filename, contentType, folderId, size }`), so no `media_assets` row is ever inserted.

That's why `GET /media_assets` returns `[]` after the upload.

The same mismatch affects every other call in MediaHub (listMedia, createFolder, etc.) — they happen to work only because the library functions ignore the wrapper or the destructure failure is silent.

## Fix

Make `MediaHub.tsx` call the library functions with their real signatures. Keep `media.functions.ts` as the source of truth (it's also used elsewhere).

### Changes

1. **`src/components/media/MediaHub.tsx`**
   - Remove the `{ data: ... }` wrapper from every call to `listFn`, `foldersFn`, `collectionsFn`, `createFolderFn`, `createCollectionFn`, `createSignedFn`, `finalizeFn`, `getUrlFn`, `updateFn`, `deleteFn`, `reprocessFn`, `toggleCollectionFn`.
   - Rewrite the upload handler:
     ```ts
     const { uploadUrl, path } = await createSignedUploadUrl({
       filename: file.name,
       contentType: file.type || "application/octet-stream",
     });
     const putRes = await fetch(uploadUrl, {
       method: "PUT",
       headers: { "Content-Type": file.type || "application/octet-stream" },
       body: file,
     });
     if (!putRes.ok) throw new Error(`Upload failed: ${putRes.status}`);
     await finalizeUpload({
       path,
       filename: file.name,
       contentType: file.type || "application/octet-stream",
       folderId: folderId ?? undefined,
       size: file.size,
     });
     ```
   - Audit the rest of the file for any remaining `{ data: ... }` wrappers and the matching destructures (e.g. anywhere expecting `asset.id` or `assets` arrays) and align them to the real return shapes (`listMedia` returns the rows array directly; `listFolders` / `listCollections` return arrays, not `{folders}` / `{collections}` wrappers).

2. **Optional cleanup** (low risk, big consistency win): also fix the `assetsQ.data?.assets`, `foldersQ.data?.folders`, `collectionsQ.data?.collections` reads to use the arrays directly returned by the library.

## Verification

- Reload `/admin/media`, upload a small PNG.
- Confirm the storage PUT path ends with the real filename (e.g. `…/1782…-flyer.png`), the toast says "Uploaded …", and a new row appears in `media_assets`.
- Confirm `GET /rest/v1/media_assets?...` now returns the row and the thumbnail renders.

## Out of scope

No DB / RLS / storage-policy changes — bucket and policies are already in place; the bug is purely client-side argument shape.
