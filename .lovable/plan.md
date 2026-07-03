## Root cause

The Second Brain was wired to an older asset table. The Athletes Prayer Foundation has **33 completed assets in `venture_documents`** (scoped to that snapshot), but **0 rows in `attendee_deliverables`** — which is the only place the brain looks.

Result:
- `getBrainStatus` shows `Assets 0/0` because it counts `attendee_deliverables` filtered by `user_id`.
- `brain-reindex` skips every real deliverable and only embeds the venture snapshot JSON + brief. That JSON gets chunked into ~102 pieces, which is why the memory shows 106 chunks (102 "venture" + 4 "brief") with nothing actually useful in them.
- Chat answers therefore have no access to the executive summary, market analysis, roadmap, brand strategy, etc.

## Fix

Teach both the status counter and the reindex job to read `venture_documents` scoped to the current snapshot, in addition to the legacy `attendee_deliverables` path (so pre-migration accounts keep working).

### 1. `src/lib/brain.functions.ts` — `getBrainStatus`

When a `snapshotId` is provided, count from `venture_documents`:
- `totalAssets` = rows where `snapshot_id = snapshotId`
- `generated` = rows where `status = 'complete'` AND `content` is non-empty
- `assessed` = rows where `deep_assessment_status = 'complete'`
- `heroReady` = rows where `hero_image_status = 'ready'`

Fall back to the current `attendee_deliverables` behavior when `snapshotId` is null (legacy accounts). Memory-chunk and notes counts stay as-is.

### 2. `supabase/functions/brain-reindex/index.ts`

When `snapshotId` is set, additionally fetch:
```
venture_documents
  .select("document_type, content, deep_assessment, intake_answers, hero_image_prompt, metadata")
  .eq("snapshot_id", snapshotId)
  .eq("status", "complete")
```

For each row, push two `Source` entries when applicable:
- `kind: "deliverable"`, `source_ref: document_type`, `title: document_type`, `content: content`
- `kind: "assessment"`, `source_ref: document_type`, when `deep_assessment` is non-empty

Include `intake_answers` (if present) at the top of the deliverable content so budget/pro-forma answers are searchable. Skip the existing venture-snapshot JSON dump when there are ≥1 real deliverables (it's noise — the deliverables already summarize the venture in prose), or at minimum shrink it to the top-level fields only. This alone drops the misleading "venture" chunk count from ~102 to a handful.

Keep the existing `attendee_deliverables` read for backward compatibility, but de-dupe by `source_ref` so nothing is embedded twice.

### 3. Rebuild memory for the affected venture

After deploy, the user clicks **Rebuild memory** on the Brain page. The new job:
- Wipes the 106 stale chunks for `snapshot_id = a430693d-…`
- Re-embeds the 33 venture documents + assessments + brief + notes
- Status card then shows `Assets 33/33`, real hero-image and assessment counts, and chat can cite the actual deliverables.

## Verification

- `Assets` stat on `/dashboard/brain` reads `33/33` (or similar) for Athletes Prayer Foundation.
- Asking "summarize my executive summary" or "what does my market analysis say?" returns grounded answers with citations to `deliverable` / `assessment` chunks, not generic snapshot text.
- Switching ventures still isolates memory (previous fix intact).

## Out of scope

- No schema changes; both tables already exist.
- No migration of legacy `attendee_deliverables` rows.
- Chunking, embedding model, and RLS remain unchanged.
