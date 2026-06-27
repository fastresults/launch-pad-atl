## Problem
In `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx`, the section action button only switches from "Generate this section" to "Regenerate this section" when **every** item in the category is complete (`catComplete`). In the screenshot, Finance is 4/5 — four deliverables are already written, but the button still reads "Generate this section", which misleads the user into thinking nothing has been generated and that pressing it is a safe first run (it would actually re-run all 5).

## Fix
Switch the label based on whether any deliverable in the category already exists, not whether all of them do.

1. In the category header (around line 1107–1120), compute `catHasAny = catDone > 0` (or check `docByType` for at least one `complete`/`generating` doc in that category).
2. Update the button render:
   - `catGenerating` → "Writing {cat}…" (unchanged)
   - `catHasAny` → `RefreshCw` icon + **"Regenerate this section"**
   - else → `Sparkles` icon + **"Generate this section"**
3. Keep the existing `variant` styling tied to `catComplete` (ghost when fully complete) so the visual hierarchy still reflects "all done" vs "in progress".
4. No behavior change to `bulk.mutate` — it already regenerates/fills the section either way.

## Out of scope
No changes to deck button, per-card Rewrite/Read, or backend generation logic.
