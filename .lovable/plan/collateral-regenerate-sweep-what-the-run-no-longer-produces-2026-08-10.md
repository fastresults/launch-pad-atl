# Collateral regenerate: sweep what the run no longer produces

## Current behaviour (verified)

Collateral writes to deterministic paths (`{user}/brand-collateral/{snapshot}/{name}.{ext}`) with `upsert: true`, and rows upsert on `(snapshot_id, kind, name)`. The regeneration at 16:16–16:17 UTC overwrote all 37 files in place — 37 storage objects, 37 rows, no duplicates, no orphans.

The gap: nothing removes a file or row whose *name* is no longer produced. If a kind later emits fewer pages, a renamed page, or a different extension (svg → png), the old object and row survive and keep showing in the grid and the ZIP.

## What changes

After a kind finishes generating successfully, delete every row for that `(snapshot_id, kind)` whose `name` was not written during this run, and remove their storage objects.

Rules:
- Sweep runs only after the kind completed without throwing — a failed kind never deletes anything.
- Sweep is scoped per kind, so regenerating just the invoice never touches the presentation.
- Deletion failures log a warning and never fail the response.
- Extension changes are covered because the sweep compares the recorded `storage_path`, not just the name.

## Technical notes

- `supabase/functions/venture-collateral/index.ts`
  - `store()` returns the written `name` (it already returns the path); `generateKind()` collects the set of names it wrote.
  - New `sweepKind(admin, snapshotId, kind, keptNames)`: select `id, name, storage_path` for the kind, filter out `keptNames`, `storage.remove()` the paths in one call, then delete the rows by id — in that order.
  - Call `sweepKind` at the end of `generateKind`, inside the success path.
- Reuse the existing helper shape from `supabase/functions/_shared/replace-asset.ts` where practical; the collateral case keys on a name set rather than a single `keepId`, so it gets its own small function alongside it rather than bending the existing signature.
- No schema, RLS, or UI changes.

## Out of scope

Backfilling orphans created before this change — there are none for the current venture, and a one-off cleanup can be run later if any turn up.
