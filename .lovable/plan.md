# Fix logo upload, delete, and slot assignment from verified state

## What the audit proves

The current venture has exactly two stored logo entries: `icon` (colour symbol) and `icon_reversed` (inverse symbol). There is no stored `primary`, `reversed`, `stacked`, or `stacked_reversed` entry.

The UI nevertheless shows the colour symbol in both **Symbol** and **Horizontal**. This is not a classifier result; it is a display bug in `logoSetFrom()`: when `primary` is empty, it aliases the first available logo into the `primary` cell. Consequently:

- an empty Horizontal cell displays the Symbol;
- deleting Horizontal sends `variant: primary`, removes no stored row, and the Symbol immediately reappears through the same alias;
- the set count and visible grid disagree with the database;
- deleting a true primary can make the backend mark an unrelated remaining symbol as `primary`, reinforcing the false Horizontal assignment.

The function logs contain only boot/shutdown records, so they cannot currently prove which slot was requested, measured, saved, replaced, or deleted. The database is the reliable evidence for this incident.

There is also a durability risk in the current implementation: upload, delete, and signed-URL refresh each perform a separate read-modify-write of the entire `logos` JSON array. A refresh or concurrent mutation can overwrite a newer change.

## Build plan

### 1. Make the grid a literal view of stored slots

- Remove the `primary <- first logo` alias from `LogoSetPanel.logoSetFrom()`.
- Populate each grid cell only from its exact `variant` (`icon`, `primary`, `stacked`, etc.).
- Keep “default mark” selection separate from form/tone assignment; a `primary: true` flag must never change which cell artwork occupies.
- Compute preview availability from all real entries without manufacturing a Horizontal entry.

### 2. Make delete exact and idempotent

- Delete by immutable logo entry identity/path plus expected variant, not variant alone.
- Return `removed_count`, removed path/variant, and the authoritative resulting logo array.
- If the requested entry is already absent, return an explicit no-op result; do not show “Logo removed” for zero removals.
- When deleting the default entry, choose a new default without changing that entry’s form, tone, or variant.

### 3. Separate assignment from measurement

- Treat the founder’s reviewed assignment as authoritative when saving from a specific grid cell or the multi-file review screen.
- Run measurement as validation and show any disagreement before save; do not silently re-route after the user confirms the destination.
- Store both `assigned_form`/`assigned_tone` and measured evidence (`measured_form`, `measured_tone`, aspect, shape count, confidence) so classification remains inspectable without rewriting user intent.
- For low-confidence SVGs (compound paths, masks, `<use>`, CSS/currentColor) and rasters, require confirmation rather than guessing.

### 4. Eliminate lost updates

- Move logo-array mutations into one atomic database function or equivalent compare-and-swap operation.
- Make upload replacement, delete, default selection, and URL refresh preserve changes made after their read.
- Stop persisting refreshed signed URLs back into the logo array; keep stable storage paths in the database and sign URLs only in the response/read path.
- Ensure replacement deletes old storage only after the authoritative database mutation succeeds.

### 5. Add request-level evidence

For every upload, assignment, replacement, delete, and refresh, emit structured logs with:

- request ID, snapshot ID, operation;
- requested slot and confirmed slot;
- measured form/tone/aspect/shapes/confidence;
- matched/removed/replaced counts;
- logo-array version before/after and final slot inventory;
- storage cleanup outcome.

Do not log file contents, signed URLs, or authentication data.

### 6. Regression coverage and live verification

Add tests that reproduce this exact failure:

1. A kit containing only `icon` renders Symbol only; Horizontal remains “Not supplied.”
2. Deleting absent Horizontal reports no-op and never affects Symbol.
3. Deleting Horizontal removes only `primary`; Symbol and Stacked remain.
4. Deleting the default mark does not rewrite another entry’s variant/form/tone.
5. Uploading one file into each Symbol, Horizontal, and Stacked cell persists and renders in that exact cell.
6. Reviewed multi-file assignments survive server validation unchanged.
7. Concurrent refresh/upload/delete cannot resurrect or lose entries.
8. Refreshing the page reproduces the same slot inventory held in the database.

After deployment, exercise the current Friendship House venture with Symbol, Horizontal, and Stacked colour/inverse files; compare each response, structured log, database inventory, and rendered grid after a hard reload.

## Technical scope

- `src/components/hub/brand/LogoSetPanel.tsx`: remove slot aliasing, use entry identity for delete, show authoritative/no-op results, preserve confirmed assignments.
- `supabase/functions/venture-brand-assets/index.ts`: exact mutation contract, atomic operations, structured logs, non-persistent URL signing.
- `supabase/functions/_shared/logo-form.ts`: return measurement evidence/confidence without silently overriding confirmed assignment.
- Database migration: atomic logo mutation function and a monotonic logo-set version if needed for compare-and-swap.
- Tests: shared classifier tests, edge mutation tests, and component regression tests for literal slot rendering.