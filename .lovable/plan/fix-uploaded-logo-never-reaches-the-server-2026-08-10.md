# Fix: uploaded logo never reaches the server

## What the logs and data show

- `venture_brand_kits.logos` for this venture is an empty array — nothing was ever saved.
- Function logs for `venture-brand-assets` show only boot/impersonation lines around the attempt, no successful upload write.
- Root cause is client-side: `generateBrandAsset` in `src/lib/foundersHub.functions.ts` destructures a fixed whitelist of fields and forwards only those to the edge function. `variant`, `dataUrl` and `filename` are not in that list, so the upload body arrives without the image. The server's `logo_upload_own` branch then fails its data-URL check and nothing is stored or displayed.
- The same drop affects `logo_remove_upload` (its `variant` is discarded, so it always targets `primary`).

## The fix

1. In `generateBrandAsset`, stop whitelisting: forward the full unwrapped payload to `venture-brand-assets` (keeping `snapshotId`/`kind` required), so any current or future field — `variant`, `dataUrl`, `filename` — passes through unchanged.
2. Keep the existing error surfacing behaviour untouched.

## Verification

- Upload a PNG into the Primary slot from the Brand Studio panel and confirm the tile renders.
- Confirm `venture_brand_kits.logos` now contains one entry with `source: "upload"`, `variant: "primary"` and a storage `path`.
- Confirm the Reversed slot upload lands in its own slot without replacing Primary, and that Remove on a non-primary slot clears only that slot.
