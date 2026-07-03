## What's actually happening

Your only venture snapshot is **StartupLabs**, but `attendee_deliverables` still holds **34 rows from a previous venture ("Fancy's Foods")** — generated on 2026‑06‑26, before you switched. Those rows are per‑user (not scoped to a venture snapshot), so `brain-reindex` embeds all of them and the Second Brain answers from Fancy's Foods content.

Verified in the DB:
- `venture_snapshots` for your user → 1 row: `StartupLabs`
- `attendee_deliverables` for your user → 34 rows, every title says "Fancy's Foods"
- `founder_brain_memory` → chunks with titles like "Executive Summary: Fancy's Foods, LLC"

So the Second Brain is working correctly — it's just been fed the wrong (old) source of truth.

## Fix (two parts)

### 1. Immediate cleanup for your account
- Delete the 34 stale `attendee_deliverables` rows for your user (all Fancy's Foods entries; they don't correspond to any current snapshot).
- Delete all `founder_brain_memory` rows for your user so the next reindex starts clean.
- Trigger `brain-reindex`; verify chunks now reference StartupLabs.

### 2. Prevent recurrence

Add a user-visible **"Clear previous venture data"** control on `/dashboard/brain` (and surface it automatically when we detect a mismatch — see below).

Backend:
- New SECURITY DEFINER RPC `purge_stale_deliverables(_user_id uuid)` that deletes `attendee_deliverables` and `founder_brain_memory` for the user, keyed to "not tied to any current venture." Since deliverables aren't snapshot-scoped today, the safe rule is: if the user has snapshots and requests a purge, wipe all deliverables + brain memory and let the workflow re-generate.
- Auth check: `auth.uid() = _user_id OR is_admin(auth.uid())`.

Frontend (`src/routes/_authenticated/dashboard/brain.tsx`):
- Add a "Reset memory & deliverables" button in the existing rebuild card, with a confirm dialog explaining it wipes generated assets so they can be regenerated against the current venture.
- Detect mismatch: if any `attendee_deliverables.content_current.title` doesn't contain the current `venture_snapshots.company_name`, show a warning banner: *"Your Second Brain contains content from a previous venture. Reset to reindex against StartupLabs."*

### 3. Longer-term hardening (same PR)
- Add `snapshot_id uuid` column to `attendee_deliverables` (nullable, FK to `venture_snapshots`), backfilled to the user's current snapshot.
- Update the generation edge functions to stamp `snapshot_id` on write.
- Update `brain-reindex` to filter deliverables by the active snapshot (`content_current` only for rows matching the current snapshot).

This makes future venture switches automatically scope memory correctly.

## Files touched
- New migration: RPC + `snapshot_id` column + backfill + index.
- `supabase/functions/brain-reindex/index.ts` — filter by active snapshot.
- `src/lib/brain.functions.ts` — add `purgeStaleDeliverables()`.
- `src/routes/_authenticated/dashboard/brain.tsx` — reset button + mismatch banner.
- One-off cleanup SQL for your user (run as part of the migration or as a psql insert).

Ready to build this?
