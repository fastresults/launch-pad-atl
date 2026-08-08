# Living mind map in the shared link

Make the showcase mind map feel alive: orbs that breathe and bob, connectors that curve and drift, and light pulses that travel outward from the venture to each asset — showing the direction the data flows.

## 1. Bouncing orbs

- Every node gets a gentle, continuous float: a small per-node sine offset (unique phase + speed seeded from its id) so nothing pulses in lockstep.
- Node radius breathes slightly (±6%); the root and cluster nodes breathe slower and wider than item nodes.
- Soft radial glow behind root/cluster orbs, brightening on hover.
- Hover: the orb scales up, its neighbours stay lit, everything else dims — so the branch you're pointing at reads clearly.

## 2. Fluid, floating connectors

- Straight lines become gentle curves (per-link curvature, slightly animated) so the web looks organic rather than wiry.
- Link opacity and width subtly drift over time; links attached to the hovered node brighten and thicken.
- Softer force tuning (slightly weaker charge, longer link distance, a light "float" jitter) so the layout keeps drifting slowly instead of freezing solid after settling.

## 3. Directional flow dots

- Animated particles travel along each link in the direction of the data: root → cluster → asset.
- Particle count and speed scale by depth — a steady stream on the trunk links, slower single dots on the leaves.
- Particles tint to the cluster colour and speed up on the hovered branch.

## 4. Performance and comfort

- The animation runs off the graph's own render loop (no extra timers), and the simulation stays warm at low energy rather than re-heating each frame.
- Respects `prefers-reduced-motion`: orbs, drift, and flow dots all stop; static graph remains fully usable.
- On small screens the particle counts drop to keep it smooth.

## Technical notes

- All work is in `src/components/share/ShareMindMap.tsx` (share-payload driven; no new data or backend calls).
- Use `react-force-graph-2d` built-ins where possible: `linkDirectionalParticles`, `linkDirectionalParticleSpeed`, `linkDirectionalParticleColor`, `linkCurvature`.
- Add a `useRef` clock advanced inside `nodeCanvasObject` (via `onRenderFramePre`) for the bob/breathe phase; keep `cooldownTicks={Infinity}` with a low `d3AlphaDecay`/`d3VelocityDecay` so motion persists without CPU spikes.
- Store per-node phase/speed once when the graph is built, alongside `radius`/`color`.
- Same motion language can later be applied to the internal `BrainMindMap`; this plan changes only the public share map.
