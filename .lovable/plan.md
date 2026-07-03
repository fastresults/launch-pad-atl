# Second Brain — Visual Mind Map View

## Goal
Approximate the attached reference: a dark-canvas, force-directed constellation where each colored node is a piece of the founder's startup (assets, assessments, notes, chat topics, memory chunks), grouped into "suites" (clusters) by category, with faint edges showing relationships. Users can pan/zoom, hover for labels, and click a node to open its content and pipe it into the chat.

## What we'll build

### 1. New "Mind Map" tab on `/dashboard/brain`
Add a top toggle: **Chat | Mind Map | Notes** (Chat stays default). Mind Map fills the same viewport currently used by chat, so nothing existing is displaced.

### 2. Graph data source (client-side, no new tables)
Reuse what's already loaded / queryable:
- `founder_brain_memory` → each row = node (kind: deliverable, assessment, note, brief, chat)
- `founder_brain_notes` → node
- `venture_documents` → node (asset), plus 1 hero-image sub-node when `hero_image_status='ready'`
- `founder_brain_messages` → the last ~20 user questions become "topic" nodes
- Central "You / {Company}" root node in the middle

Build a `useBrainGraph(snapshotId)` hook that composes these into `{nodes, links}`:
- Cluster/color by `kind` (7-color palette from design tokens — no hard-coded hex)
- Node radius = f(importance): assessed assets bigger; unread notes medium; chat topics small
- Links:
  - root → every cluster centroid
  - cluster centroid → its nodes
  - asset ↔ assessment of same `source_ref`
  - note ↔ asset it references (regex/keyword match on title)
  - chat topic ↔ top-1 memory citation from that turn

### 3. Rendering
Use **react-force-graph-2d** (Canvas, WebGL-optional, ~40kb). Handles:
- d3-force physics out of the box
- pan/zoom/drag
- custom node paint (colored circles + glow ring on hover)
- labels on hover / zoom-in threshold (matches reference where only large nodes show text at zoom-out)

Package: `react-force-graph-2d` + `d3-force` (peer). Renders inside a `<Card>` sized to `h-[calc(100vh-14rem)]`.

### 4. Interactions
- **Hover** — node scales, label appears, related links highlighted (dim others to 15% opacity)
- **Click** — opens a right-side drawer (`Sheet`) with the item's title, snippet, and two actions:
  - "Ask about this" → prefills chat input with `"Tell me about {title}"` and switches back to Chat tab
  - "Open asset" (assets only) → routes to `/dashboard/hub/$snapshotId` scrolled to that card
- **Double-click** — centers & zooms on node
- **Search box** top-left — fuzzy match by title; matches pulse, non-matches fade
- **Legend** bottom-left — kind → color chips, click to toggle visibility of that layer
- **Regenerate layout** button — reheats the simulation

### 5. Empty / loading states
- If memory is empty → show the existing "Rebuild memory" CTA overlaid on the canvas
- While indexing job is running → show a small "Indexing…" pill in the top-right; new nodes fade in as they arrive (poll every 3s, already implemented)

### 6. Visual language (matches reference)
- Background: `bg-background` (already dark in this app)
- Edges: `hsl(var(--primary) / 0.25)` thin lines
- Nodes: 7 semantic tokens from `src/styles.css` (add `--brain-node-{asset,note,chat,brief,assessment,memory,hero}` if not present) — no raw hex
- Subtle constant rotation of the whole simulation at 0.02 rad/s for the "living" feel (optional, respects `prefers-reduced-motion`)

## Files to touch

**New**
- `src/components/brain/BrainMindMap.tsx` — the canvas + interactions
- `src/components/brain/BrainNodeDrawer.tsx` — click-to-inspect side panel
- `src/lib/brain-graph.ts` — pure fn `buildGraph({memory, notes, docs, messages, company})`
- `src/hooks/use-brain-graph.ts` — React Query composition of the four sources

**Modified**
- `src/routes/_authenticated/dashboard/brain.tsx` — add tab switcher, mount `BrainMindMap`
- `src/styles.css` — 7 new semantic node color tokens (light + dark)
- `package.json` — add `react-force-graph-2d`, `d3-force`

**No backend changes.** Everything derives from data we already fetch.

## Technical notes
- Graph library is pure client-side; SSR-safe by dynamic-importing inside `useEffect`.
- Simulation runs on the main thread; capped at 500 nodes with LOD (hide labels < 0.4 zoom). Beyond 500 we sample the lowest-importance nodes out.
- Force params tuned to reproduce the reference's loose-cluster look: `charge -80`, `linkDistance 40`, `centerStrength 0.05`, `collideRadius node.r + 2`.
- Persist last camera position + selected node id in `localStorage` per snapshot so returning feels stateful.

## Out of scope (call out for later if wanted)
- Manual node editing / repositioning that persists
- Cross-venture super-graph
- 3D view (`react-force-graph-3d` exists but heavier; can add as a toggle later)
- AI-generated semantic links via embedding cosine similarity between memory rows (nice upgrade — needs a new SQL RPC)
