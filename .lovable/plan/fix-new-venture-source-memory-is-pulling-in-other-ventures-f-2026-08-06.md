# Fix: new-venture "source memory" is pulling in other ventures' files

## What's happening today

When anyone (super admin or founder) starts a new venture, Step 1 "Your source memory" lists **every file that account has ever uploaded** — including files already attached to a different venture — and silently pre-selects all of them.

Confirmed in the code:

- `src/routes/_authenticated/dashboard/hub.new.tsx` calls `listVentureSources()` with **no scope**. That query returns all `attendee_documents` rows for the user, regardless of whether the row is already tied to another venture.
- The same effect then auto-checks every row that has extracted text, so the other venture's material is carried into the new snapshot by default.
- Worse: `attachSourcesToSnapshot` **re-tags** the selected rows onto the new venture (`update snapshot_id`). A file that belonged to Venture A is moved to Venture B — Venture A loses it.

Second Brain materials themselves are already venture-scoped (`listBrainMaterials(userId, snapshotId)`), so the leak is isolated to this intake step.

## The intended model

- Second Brain memory belongs to **one venture**.
- Unassigned sources (founder bio, Startup Brief captures, files dropped before a venture existed) are **founder-level** and are legitimately available to a new venture.
- Files already attached to an existing venture must never be silently reused or moved.

## What to change

1. **Scope the list.** In `hub.new.tsx`, list only unassigned sources (`orphansOnly: true`) plus founder-level kinds (`founder_bio`, `brief_source`). Files with a `snapshot_id` are excluded from the memory row.
2. **Only auto-select what's safe.** Auto-check remains, but now applies only to the founder-level/unassigned set.
3. **Optional, explicit reuse of another venture's file.** Behind a collapsed "Reuse from another venture" control, show attached files grouped by venture name. Selecting one **copies** it into the new venture (new `attendee_documents` row pointing at the same storage path, with the cached `extracted_text`) instead of re-tagging, so the original venture keeps its memory.
4. **Never move an attached file.** `attachSourcesToSnapshot` gets a guard: it only re-tags rows whose `snapshot_id` is currently NULL. Anything already attached goes through the copy path.
5. **Copy on multi-use of founder-level files.** A founder bio reused across ventures should also be copied rather than moved, so the second venture doesn't strip it from the first.
6. **Label clarity.** Step 1 copy states that this is founder-level memory carried into this venture, not another venture's brain.

Behaviour is identical for super-admin ventures created at `/admin/hub/new`, since that page renders the same intake flow.

## Technical notes

- Files touched: `src/lib/venture-sources.ts` (scoped list helper, `copySourceToSnapshot`, NULL-only guard on attach), `src/routes/_authenticated/dashboard/hub.new.tsx` (list scope, auto-select set, optional reuse-from-venture picker, copy).
- No schema change required: the copy is a second `attendee_documents` row referencing the same `storage_path`; deletion of a copy must not remove the shared storage object when other rows still reference it — `deleteVentureSource` gets a reference check before the storage remove.
- No changes to `BrainMaterials` or `listBrainMaterials`; those are already snapshot-scoped.
