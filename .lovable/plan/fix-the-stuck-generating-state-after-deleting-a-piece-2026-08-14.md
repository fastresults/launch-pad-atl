# Fix the stuck "Generating…" state after deleting a piece

## What the evidence shows

Function logs for `venture-collateral` over the last run show repeated boots and repeated `[collateral copy] writing for "The Friendship House"` entries roughly every 10 seconds, one `QUALITY_GATE_FAILED` on the proposal, and no matching completion for several of those attempts. So the client was mid-run when pieces were deleted.

In `src/components/hub/brand/BrandCollateral.tsx` the run state is a single mutation plus one `busyKind` string:

- A card shows "Generating…" when `busyKind === k.kind || (busyKind === "all" && gen.isPending)`. The first half is **not** gated on `gen.isPending`, so any path that leaves `busyKind` set without a live mutation pins that card on "Generating…" forever.
- Every card's Generate button is `disabled={!locked || gen.isPending}`, so one in-flight or hung run disables regeneration across the whole library — which is exactly the reported "cannot regenerate".
- Deleting a piece (`wipe.mutate(kind)`) does not touch `busyKind`, the run report, or the in-flight generate loop. The card the founder just cleared keeps rendering the busy placeholder.
- `invokeEdge` (`src/lib/edge-invoke.ts`) has no timeout or abort. If an edge invocation never returns, `gen.isPending` stays true indefinitely and nothing in the UI can recover without a page reload.

## Build plan

### 1. Busy state must always be tied to a live run

- Track the in-flight kinds in a `Set`, cleared in `onSettled` and on error.
- Compute a card's `busy` as "a run is actually in flight **and** this kind is in it" — never from a leftover string alone.
- Disable a card's Generate only while that card (or an all-run) is in flight, not for every card in the library.

### 2. Deleting a piece clears its run state

- On delete success, remove that kind from the in-flight set, drop its row from the last-run report, and clear its remembered mark-used badge.
- If a delete lands while a run is in flight, the card returns to "Not generated" with Generate enabled rather than staying on the placeholder.

### 3. No request can hang forever

- Give each collateral invocation a bounded timeout with `AbortSignal`; on timeout, fail that slice with a clear message ("Timed out — retry this piece") instead of leaving the mutation pending.
- Make the per-kind loop continue past a failed/timed-out piece and record it in the run report so the rest of the library still publishes.

### 4. A run is always escapable

- While a run is in flight, offer a **Stop** control that aborts the current invocation and resets all busy state.
- Reset run state when the contact-details dialog is dismissed without verifying, so an abandoned confirm never leaves the library disabled.

## Technical scope

- `src/components/hub/brand/BrandCollateral.tsx` — replace `busyKind: string | null` with an in-flight kind set, gate `busy`/`disabled` on it, clear on delete, add Stop.
- `src/components/hub/brand/CollateralPieceCard.tsx` — placeholder copy only when genuinely busy; keep Generate reachable otherwise.
- `src/lib/collateral.functions.ts` — per-call timeout/abort, per-kind error capture instead of aborting the whole loop.
- `src/lib/edge-invoke.ts` — pass through an optional `signal`/timeout so other callers can adopt the same guard.

No backend or generation-logic changes; this is UI run-state handling.
