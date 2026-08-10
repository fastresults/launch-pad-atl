# Regenerate always replaces — no orphaned images

Today, regenerating a social cover or an ad creative writes a brand-new file and a brand-new row. The old image stays in storage and keeps showing in the grid, so tiles pile up duplicates and storage grows with every retry. Only two places clean up after themselves today: document hero images (they remove the previous file) and brand collateral (it overwrites the same path).

This makes "regenerate" mean the same thing everywhere: the picture you were looking at is replaced — old row deleted, old file deleted — and only the new one remains.

## What the founder sees

- Press Regenerate on a social cover, an ad creative, a logo lockup, or any other generated image: the tile swaps to the new image. No second copy appears beside it, no stale thumbnail lingers.
- "Regenerate week" / "Regenerate all" in Content Studio behave the same, per tile.
- If the new generation fails, the existing image stays untouched — deletion only happens after the replacement is safely stored.
- Deleting is silent; no extra confirmation on regenerate (the explicit Delete button keeps its confirmation).

## Where this applies

| Surface | Today | After |
|---|---|---|
| Social covers (`venture-social-cover`) | new row per run, old file kept | prior rows for that platform + asset kind deleted, files removed |
| Content Studio ads (`venture-content-ad`) | new row per run, old file kept | prior rows for that post + aspect deleted, files removed |
| Document hero images | previous file removed | unchanged (already correct) |
| Brand collateral | overwrites same path | unchanged (already correct) |
| Logo studio / brand assets uploads | mixed: some overwrite, some accumulate | superseded files removed when a slot is regenerated |

## Technical notes

- Add a shared helper `supabase/functions/_shared/replace-asset.ts` with `replaceSupersededAssets({ admin, bucket, table, match, keepId })`: selects rows matching the slot, removes their `storage_path` values from the bucket in one `storage.remove([...])` call, then deletes the rows. Failures log a warning and never break the response.
- `venture-social-cover` generate: after the new row inserts successfully, call the helper with `{ table: "venture_social_assets", match: { snapshot_id, platform, asset_kind }, keepId: newRow.id }`. Carry over `is_selected: true` to the new row when the superseded one was selected, so selection is never lost.
- `venture-content-ad` generate: same, with `{ table: "venture_content_ads", match: { snapshot_id, post_id, aspect }, keepId: newAd.id }`.
- Ordering is strict: upload → insert → then delete the old. Never delete first.
- `venture-brand-assets` / `venture-logo-studio`: where a regenerate writes a new UUID path for a slot that already had one, remove the previous path after the new record is committed (the logo publish path already uses `upsert: true`, so only the UUID-suffixed writes need the sweep).
- Client changes are limited to relying on the refreshed list; no UI restructuring needed since the grid already renders from the query result.
