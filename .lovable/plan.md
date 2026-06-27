## Issue
Each venture card shows `0 / 34 documents` because the count is hardcoded in `SnapshotCard` (`src/routes/_authenticated/dashboard/hub.index.tsx`) — it never queries the actual completed `venture_documents` for each snapshot.

## Fix

1. **Add a count query to `listSnapshots`** in `src/lib/foundersHub.functions.ts`:
   - After fetching snapshots, query `venture_documents` once with `select("snapshot_id", { count: ... })` filtered to `status = 'complete'` and the user's snapshot IDs.
   - Aggregate per-snapshot counts client-side and attach `doc_count` to each snapshot object returned.

2. **Use the real count in `SnapshotCard`** (`hub.index.tsx`):
   - Replace the hardcoded `` `0 / ${totalDocs} documents` `` with `` `${snapshot.doc_count ?? 0} / ${totalDocs} documents` ``.

3. **Type update**: extend the `VentureSnapshot` shape (or a derived type) with optional `doc_count: number`.

No DB/schema changes. No UI redesign — counts will simply become accurate.
