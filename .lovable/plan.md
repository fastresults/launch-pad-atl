## What "original startup briefs" means here

The founder's uploaded source materials — the docs/PDFs they dropped into the intake to generate the startup. Two backend sources:

1. **`venture_snapshots.source_materials`** (jsonb) — the canonical brief inputs. Shape: `{ documents: [{ filename, text, charCount }], urls: [...] }`. Each `filename` is the real file name to display.
2. **`attendee_documents`** (fallback / additional) — rows with `original_name`, `kind`, `snapshot_id`, `used_in_brief`. Also carries the file name.

These aren't in the mind map today, which is why the user's original PDFs/docs (e.g. `adam_anderson_resume.pdf`) don't appear.

## Plan

### 1. New cluster: "Source Briefs"

Add a cluster keyed `source` with:
- Label: **"Source Briefs"**
- Color token: new `--brain-source` (add to `src/styles.css`, in the same block as the other `--brain-*` tokens; pick a distinct hue — teal / amber — so it doesn't collide with the existing pink/blue/purple).

Register in `CLUSTER_META` in `src/lib/brain-graph.ts`. Add legend entry automatically (the legend maps over `BRAIN_CLUSTER_META`).

### 2. Fetch source-material rows in `BrainMindMap.tsx`

Two new `useQuery`s, both scoped to the current `snapshotId`:

- `venture_snapshots` → `select("source_materials").eq("id", snapshotId).maybeSingle()`
- `attendee_documents` → `select("id, original_name, kind, used_in_brief").eq("snapshot_id", snapshotId)`

Merge into a single `sources: { id, filename, kind, origin }[]` array (dedupe by lowercase filename so a doc present in both places renders once). `origin` is `"snapshot"` or `"upload"` for tooltip/drawer context. Include `urls[]` from `source_materials` as `filename = url`, `kind = "url"`.

Pass `sources` into `buildBrainGraph`.

### 3. Render nodes in `buildBrainGraph`

For each source entry:
- `id = "src:{id}"`
- `label = filename` (use `shortTitle` with max 60; keep the extension visible — briefs like `adam_anderson_resume.pdf` render as-is)
- `kind = "source"` (extend the `BrainGraphNode["kind"]` union)
- `cluster = "source"`, color = `var(--brain-source)`
- Slightly larger radius (5) so briefs read as first-class citizens next to assets
- `data = { filename, origin, kind }` for the drawer

Link each source node to the `source` cluster **and** to `root` with a light strength — briefs are foundational context, so they should sit near the center by default (matching the user's ask "appear in the default Mind map").

### 4. Drawer + "Ask about this"

Existing drawer already reads `selected.label`. No changes needed — clicking a brief will prompt "Tell me about adam_anderson_resume.pdf" in chat, which is the desired behavior.

## Files touched

- `src/styles.css` — add `--brain-source` in both `:root` and `.dark`.
- `src/lib/brain-graph.ts` — new `source` cluster, new `SourceRow` type, new loop, extend `kind` union.
- `src/components/brain/BrainMindMap.tsx` — two new queries, merge into `sources`, pass to `buildBrainGraph`.

No schema changes. No RLS changes. Chat view untouched.
