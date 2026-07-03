## Problem

Nodes on the Mind Map show generic placeholders ("Startup brief", "Asset") instead of the actual output names. Two root causes:

1. `venture_documents` nodes are labeled from a humanized `document_type` slug (e.g. `problem_solution` → "Problem Solution") instead of the real display name stored in `venture_document_types.name` ("Problem / Solution Brief").
2. `founder_brain_memory` chunks are stored with repeated generic titles ("Startup brief" × N, "Venture — The Athletes Prayer Foundation" × N). Every chunk becomes its own node with the same label, producing the visible clusters of identical "Startup brief" nodes in your screenshot.

## Fix

### 1. Load real deliverable names

In `BrainMindMap.tsx`, add a query for `venture_document_types` (`type`, `name`) and pass a `docTypeNames: Record<string,string>` map into `buildBrainGraph`.

### 2. Use real names for asset / assessment / hero nodes

In `src/lib/brain-graph.ts`:
- `buildBrainGraph` accepts `docTypeNames`.
- Asset label: `docTypeNames[d.document_type] ?? humanizeDocType(d.document_type)`.
- Assessment label: `"{name} — Assessment"`.
- Hero label: `"{name} — Hero Image"`.
- Store the resolved name on `node.data.name` so the side drawer and "Ask about this" prompt use it too.

### 3. Dedupe generic memory chunks

Memory rows are chunk-level, so N chunks of one brief produce N identical nodes. Collapse them:
- Group `memory` rows by `(kind, source_ref, title)`.
- Emit one node per group; if `count > 1`, append `" (×N)"` to the label.
- When `source_ref` matches a known `document_type`, resolve the label through `docTypeNames` too (so "Venture — …" chunks under `source_ref='problem_solution'` render as "Problem / Solution Brief — Memory").

### 4. Note / chat labels

Already derived from real content — no change, but bump `shortTitle` max from 40 → 60 so full names like "Problem / Solution Brief" aren't truncated.

## Files touched

- `src/lib/brain-graph.ts` — add `docTypeNames` param, real-name lookup, memory dedupe, longer label cap.
- `src/components/brain/BrainMindMap.tsx` — new `venture_document_types` query, pass map into `buildBrainGraph`.

No schema, RLS, or backend changes. Chat view untouched.
