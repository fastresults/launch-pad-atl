## Why the map looks empty

Two things are happening, only one of them is a real bug:

1. **Real bug — the assets never render.** `BrainMindMap` selects `deliverable_type_key` and `title` from `venture_documents`, but neither column exists on that table (the real column is `document_type`, and there is no `title` — titles are derived). PostgREST rejects the request, the query silently returns `[]`, and none of the 34 asset nodes are drawn.
2. **Accurate but misleading copy.** For the currently-signed-in account, `founder_brain_memory` genuinely has 0 rows (memory has never been rebuilt for this snapshot). Even after fix #1 the "No memory yet…" empty state would keep showing unless we broaden the check to "no graph data of any kind" and word it around assets + memory.

## Changes

### `src/components/brain/BrainMindMap.tsx`
- Change the `venture_documents` select to columns that exist: `id, document_type, status, hero_image_status, deep_assessment_status`.
- Surface Supabase errors in all four `queryFn`s with `console.warn` so a silently-failing PostgREST response never masquerades as "no data" again.
- Reword the empty overlay to: "Nothing to map yet. Generate startup assets, then rebuild memory to enrich the graph." Keep the `filtered.nodes.length <= 1` trigger.

### `src/lib/brain-graph.ts`
- Update `DocRow` to `{ id; document_type?: string | null; status?: string | null; hero_image_status?: string | null; deep_assessment_status?: string | null }`.
- In the docs loop, derive a human label from `document_type` (e.g. `value_proposition` → `Value Proposition`) via a small `humanize()` helper (`replace(/_/g,' ')` + title-case). Fall back to "Asset".
- Use `document_type` (not `deliverable_type_key`) when computing `assetRefs` so memory rows tied to an asset are still de-duplicated.
- Store `{ docId, documentType }` on the node's `data` for future drawer detail.

### No schema / RLS changes
The RLS on `venture_documents` and `founder_brain_memory` is correct; this is purely a client column-name mismatch.

## Expected result

After the fix, StartupLabs' snapshot renders ~35 nodes immediately: root → "Startup Assets" cluster → 34 asset nodes (plus any with hero/assessment sub-nodes). Once the user hits **Rebuild memory**, memory/note/assessment clusters populate too.
