## Problem

The hero card on the Hub shows "Pick up where you left off — 34 of 50 done" with two buttons:

- **Primary**: `Generate Foundation (1 doc)` — only fires the next incomplete category
- **Secondary**: `Generate all 50` — opens an "unlock" confirmation dialog and re-runs *everything*, including docs already written

There is no single-click way to say "just finish the remaining 16." The user has to either walk category-by-category or trigger a full re-run through a gated dialog.

Good news: the backend already does the right thing. `venture-bulk-generate` builds a `completeSet` from existing docs and filters them out of each dependency layer, so a bulk call with `category: null` will only generate what's missing. The gap is purely UI/labeling.

## Fix

Replace the current secondary "Generate all N" button with a **"Generate remaining {N}"** primary-style action whenever `completeCount > 0` and `completeCount < total`. It calls the existing `bulk.mutate({ category: null })` directly — no unlock dialog, since nothing is being overwritten.

Rework the hero action layout in `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx` (around lines 1035–1050) for the "in progress" state:

- **Primary CTA**: `Generate remaining {total - completeCount} docs` → `bulk.mutate({ category: null })`
- **Secondary CTA**: `Just {nextCategory.cat} ({N} doc{s})` → `bulk.mutate({ category: nextCategory.cat })` (keeps the guided per-section option for users who want to review as they go)
- **Tertiary (text link)**: `Re-run all {total}` → still opens `setShowUnlock(true)`, since that path *does* overwrite completed docs

Update the subtitle line so the count of what's left is unambiguous: `34 of 50 done — 16 remaining. Next section: Foundation.`

When `completeCount === 0` (first run), keep today's behavior: primary generates the first category, secondary is the gated "generate all."

When `completeCount === total`, keep today's "kit is ready" state unchanged.

## Files touched

- `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx` — only the hero-card state machine (~15 lines around 1035–1050) and the button rendering block just below it to support a third action slot.

No backend, no migration, no changes to `venture-bulk-generate`, no changes to the unlock dialog. Purely a UI/labeling change that surfaces a capability the backend already has.

## Verification

- Load the Hub with a partially complete kit (34/50) and confirm the new "Generate remaining 16 docs" button appears and starts a job that only writes the 16 missing types.
- Confirm the guided per-section button still works.
- Confirm the "kit is ready" and first-run states are visually unchanged.