# Yes — one concept is stuck, and it can't recover on its own

## What the data shows

The latest logo run (version 10) has three concepts:

| Slot | Status | Stage | Render |
|---|---|---|---|
| 0 | needs_review | complete | ready |
| 2 | needs_review | complete | ready |
| 1 | **queued** | **vectorize** | ready |

Slot 1 has a good Higgsfield render and no error message, but it sits at
`queued / vectorize` with a `retry_at` that passed at 02:57 (it is now 03:08).
The run itself is already marked `completed_with_review`.

## Why it will never move

Nothing in the system polls for stalled work. Vectorizing only happens when
either the run loop is driving the run or the founder clicks "Approve &
vectorize" on a card. Slot 1 fits neither: the run loop has already exited
(the run is terminal), and the card only shows the vectorize button for
concepts in `ready` / `needs_review`, so a `queued` card renders as a
permanent spinner with no action on it.

The row was left in this state by the earlier cleanup that cleared the
`rasterizeSvg is not defined` error and requeued the row — the requeue had no
worker behind it.

## The fix

1. **Unstick this row now.** Set slot 1 back to `needs_review` with stage
   `render_concept` so its approved render is presented like the other two and
   the "Approve & vectorize" button appears.
2. **Make a stalled concept visible and actionable in the wizard.** Any
   direction whose status is `queued` / `vectorizing` / `retry_wait` with a
   `retry_at` (or lease) in the past renders as "Paused — resume" instead of an
   endless spinner, with a button that calls the existing
   `logo_retry_direction` path.
3. **Have the run loop reclaim stalled work before it exits.** At the end of
   `processLogoRun`, sweep for directions that have a render but are not in a
   terminal status and drive them once, so a row cannot be orphaned by the run
   finishing.
4. **Never requeue without a driver.** Any future error cleanup sets the row to
   `needs_review` (actionable in the UI) rather than `queued`.

## Technical notes

- Row fix: migration on `brand_logo_directions` for the one affected id.
- UI: `src/components/hub/brand-wizard/BrandWizard.tsx` — pending-card branch
  around line 1095 gains a stalled state; `processLogoRun` gains the final
  sweep.
- No edge-function contract changes; `logo_vectorize` / `logo_retry_direction`
  already accept these rows.
