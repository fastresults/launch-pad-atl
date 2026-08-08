# One Second Brain map everywhere

The radial map in the first screenshot (venture at center, colored category branches, fanned-out leaf nodes) is the correct and only mind map. The force-directed cloud on `/dashboard/brain` — the one with "Startup Assets", "Hero Images", overlapping labels and drifting nodes — gets deleted and replaced by the same renderer.

## What changes

1. **Promote the good map to a shared component.**
   The showcase map (`ShareMindMap`) becomes a generic `RadialMindMap` that takes a simple model instead of a share payload:
   - a center node (name + brand color)
   - branches (label + color)
   - leaves under each branch (title + optional click key)
   All existing behavior is preserved: deterministic layout, curved dashed links, wheel/pinch zoom, pan, branch dimming on hover, zoom in/out/reset controls, reduced-motion support.

2. **Shared-link view keeps working identically.**
   A thin adapter converts the share payload into the model. No visual change on the public showcase — this is a refactor there, not a redesign.

3. **Dashboard Second Brain uses the same map.**
   `/dashboard/brain` drops `react-force-graph-2d` and `d3-force`. The existing brain data (memory fragments, notes, assets, assessments, briefs, hero images, chat topics, sources) is mapped into the same branch model:
   - Center = venture/company name
   - Branches = the brain clusters, using the existing `--brain-*` colors resolved to real values
   - Leaves = the individual items in each cluster, capped per branch so labels stay legible
   Clicking a leaf keeps its current behavior (select node / "Ask about this"), and the cluster show/hide filter + search stay, now driving which branches render.

4. **Cleanup.** Delete `BrainMindMap.tsx` and the force-graph dependencies once nothing imports them.

## Technical notes

- New `src/components/brain/RadialMindMap.tsx` (moved from `src/components/share/ShareMindMap.tsx`), props: `{ center, branches, onSelect, onOpenItem }`.
- New adapters: `shareToMindMap(payload)` and `brainGraphToMindMap(graph)` in a small `src/lib/mind-map-model.ts`.
- `src/components/share/ShareMindMap.tsx` becomes a 10-line wrapper so `ShareBrain` and `MindMapBoundary` are untouched.
- CSS-var colors (`var(--brain-asset)`) are resolved to concrete hex at adapter time, since the SVG renderer expects literal colors.
- Remove `react-force-graph-2d` and `d3-force` from package.json after the swap.
- No backend, schema, or edge-function changes.
