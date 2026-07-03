## Problem found

The repeated **Stale content detected** warning is caused by flawed detection logic, not necessarily stale data.

Current behavior:
- `detectVentureMismatch()` loads memory rows for the selected startup.
- It checks whether most asset memory titles include the current startup name.
- Rebuilt memory titles are normal output/type names like `budget_pro_forma`, `paid_ads_starter_pack`, `brand_messaging`, etc.
- Those titles do not include `StartupLabs`, so the detector falsely marks fresh rebuilt memory as stale every time.

There is also a secondary reset mismatch:
- The reset RPC only deletes startup-scoped Second Brain rows when a startup is selected.
- It does not clear/rebuild the current `venture_documents` rows, so the UI text saying “Reset assets & memory” overstates what is actually being reset.

## Plan

1. **Replace the title-name heuristic**
   - Remove the rule that says memory is stale when asset titles do not contain the current startup name.
   - Use reliable scope checks instead: memory is valid when `founder_brain_memory.snapshot_id` matches the selected startup.
   - Treat only unscoped legacy memory (`snapshot_id is null`) as potentially stale, not correctly scoped rows.

2. **Make stale detection evidence-based**
   - Update `detectVentureMismatch()` to return a warning only when there are legacy/unscoped asset or assessment memory rows for the user while a current startup is selected.
   - Show examples from those legacy rows only.
   - Do not flag current `snapshot_id` rows whose titles are framework/output names.

3. **Fix rebuild cleanup semantics**
   - Confirm `brain-reindex` wipes and rewrites the selected startup’s auto-derived memory before indexing.
   - Keep that behavior, but ensure the frontend invalidates all affected queries after a rebuild finishes: status, mismatch, graph memory, and graph docs.

4. **Clarify/reset behavior**
   - Update the reset success copy so it says what it actually did: reset Second Brain memory/chat/notes/jobs for the current startup.
   - Avoid implying generated startup assets were deleted unless the backend really deleted them.

5. **Optional backend hardening if needed**
   - Add or update a database function so reset can also remove legacy unscoped memory for the user when working inside a selected startup, because legacy rows are exactly what can pollute retrieval.
   - Keep current-startup data isolated by `snapshot_id`.

6. **Validation**
   - Check live database counts before/after logic: selected startup memory rows, legacy unscoped rows, and example titles.
   - Verify the warning disappears for fresh `StartupLabs` memory even when titles are `budget_pro_forma`, `paid_ads_starter_pack`, etc.
   - Verify warnings still appear only if genuinely unscoped legacy memory exists.