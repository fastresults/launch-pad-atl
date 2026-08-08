# Second Brain, featured inside the shareable link

Right now the public showcase has a small chat bubble in the corner. This makes the venture's Second Brain a first-class, obvious tool on the share page — chat plus the mind map — and adds a 300-word executive summary that ties every asset together.

## 1. Featured Second Brain panel

The share page gets a dedicated, always-visible entry point instead of a floating bubble only:

- A "Second Brain" card pinned at the top of the sidebar and a matching hero button in the masthead ("Ask this venture anything").
- Clicking opens a full-height panel with two tabs, mirroring the internal experience: **Chat** and **Mind Map**.
- Chat keeps voice + text input, starter questions tailored to a visitor ("What is this business?", "What's the offer and pricing?", "What's already built?", "What happens in the first 30 days?").
- The Second Brain is also its own first item in the table of contents, so it's reachable from anywhere in the 75-asset set.

## 2. Mind map on the public page

The internal map reads private tables directly from the browser, which a signed-out visitor cannot do. So the map is served through the existing token-gated endpoint:

- `venture-share` gains a `graph` action that assembles nodes/edges server-side, scoped to the share's snapshot and filtered by the same excluded-keys rules the sections use. Nothing outside the shared venture is reachable.
- The map only exposes public-safe clusters: the venture root, its assets by category, brand/visual assets, and hero images. Private founder notes, memory fragments, chat topics, and source briefs stay out.
- Clicking a node jumps the reading pane to that asset, or asks the chat about it.

## 3. Correct venture, guaranteed

Every call — payload, chat, graph — is keyed only by the share token, resolved server-side to that token's `snapshot_id`. No client-supplied venture ID is ever trusted, and the panel is remounted on token change so state cannot bleed between two showcases open in one browser.

## 4. 300-word executive summary

A new "Executive Summary" is generated for the venture and shown as the first section of the showcase (and available in the hub):

- Written from the full asset set — brief, strategy, brand, marketing, operations, sprint — not just the concept.
- Exactly ~300 words, three beats: what the business is and who it serves; what has been built (naming the asset families and why each matters); how to use the package over the first 30 days.
- Generated once and cached on the venture, with a "Regenerate" control for the owner so it refreshes after new assets land. It's also produced automatically by the same background sweep that fills header art, so a share link is never missing it.

## Technical notes

- Edge: extend `supabase/functions/venture-share/index.ts` with `action: "graph"`; new `venture-exec-summary` function (owner-auth + internal-key) writing to a `executive_summary` column on `venture_snapshots`; `venture-share` returns it in the payload; `venture-share-chat` gets the summary prepended to its context.
- Shared graph builder: lift the cluster/edge logic from `src/lib/brain-graph.ts` into a share-safe server assembly so both surfaces stay consistent.
- Client: new `src/components/share/ShareBrain.tsx` (tabbed shell) reusing `ShareChatPanel` for chat and a public `ShareMindMap.tsx` (react-force-graph-2d, dark scope, no direct Supabase queries); wired into `src/routes/v.$token.tsx` sidebar + masthead; `ShareSidebar` gets the pinned entry.
- Owner side: `ShareVentureDialog` gains a toggle for the mind map and a "Regenerate summary" action; the hero sweep also backfills the summary.

## Build order

1. Executive summary generation + storage + display in share and hub.
2. `graph` action on `venture-share` with token-scoped, public-safe nodes.
3. `ShareBrain` tabbed panel: chat first, then mind map, wired into the share page.
4. Owner controls (map toggle, regenerate summary) and sweep backfill.
