# Force the delivery decision on the shared link

Today the runway replaces itself with the choice cards when no mode is set — the founder sees a bare gate with no sense of what's behind it, and on the hub side the same screen appears. The decision needs more pressure and more pull: they should see the runway they're about to unlock, locked, with only two ways forward.

## What changes

**Locked peek.** When no delivery decision exists, the Operationalize view renders the real runway underneath a blur-and-dim veil — milestone cards, day counts, progress ring, all faintly visible and non-interactive (no scroll-jacking, no clicks reaching through). Floating over it, centered and sticky in view, sits the decision card:

- **I'm building it** — free. One click unlocks the runway immediately.
- **Startup Labs builds it** — shows the retainer price ($1,997/mo · 4-month term) and opens the kickoff intake. No card, no charge today.

There is no third way out. No dismiss button, no "skip for now", no escape key. The only other affordance is "Compare the two side by side", which expands the existing comparison (heavy lifting, work split, platform add-on) inside the same locked state.

**Committing to Startup Labs.** Choosing the paid path opens the kickoff form rather than silently flipping a database flag. On submit: the engagement request saves and emails the team, the mode is set to retained, and the runway unlocks in a **pending kickoff** state — a banner across the top reads that the kickoff call is being scheduled and specialist steps are already assigned to the team. Closing the form without submitting leaves the gate up, so the choice can't be half-made.

**Changing your mind later** stays available from the delivery band at the top of the runway, exactly as it works now.

**Everywhere.** The same locked gate applies on the hub (`/dashboard/hub/:id/operations`) so an owner and a share viewer see identical behavior. A read-only viewer with no edit rights sees the locked peek plus the price, and the buttons route to the engagement page instead of writing state.

## Technical details

- `src/components/ops/OpsDashboard.tsx`: replace the early `return <DeliveryModeGate/>` at the top with a wrapper that renders the normal dashboard tree inside a `aria-hidden`, `pointer-events-none`, `blur-sm opacity-40` container plus an overlay layer holding the gate. Keep the existing `gateOpen` path (explicit "compare" from the band) as-is, with its Back button — the difference is the un-decided state has no Back.
- New `src/components/ops/DeliveryGateOverlay.tsx`: the veil + centered decision card; owns the `showCompare` toggle that swaps the compact card for the full `InvestmentCompare`.
- `src/components/ops/InvestmentCompare.tsx`: keep as the expanded comparison; its "Startup Labs builds it" button routes through the same commit handler rather than choosing the mode directly.
- Commit flow: reuse `EngageIntakeDialog` from `src/components/ops/engage/`. On success call `requestEngagement(auth, input)` then `setDeliveryMode(auth, "retained")`. Wire from `ShareOpsRunway.tsx` (share auth) and `hub.$snapshotId.operations.tsx` (owner auth) via a new `onCommitRetained` prop so the dashboard stays presentational.
- Pending-kickoff banner: derived from `venture_ops_engagements` — extend the `list` action in `supabase/functions/venture-ops/index.ts` to return the latest engagement request (status + created_at) alongside the state, and render the banner when a request exists and no start date is set. No schema change.
- Blur veil must not trap scroll: the overlay is `position: sticky` within the section, not `fixed`, so the page still scrolls and the mobile bottom nav keeps working.
