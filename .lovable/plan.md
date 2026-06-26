## Problem

In `deliverable_types`, only ~11 of 34 rows have `user_can_trigger = true` and `auto_runnable = true`. The other 23 are flagged `false`, which is why they render as locked "Coming soon" cards even though the banner says "All caught up." That mismatch is the bug.

## Fix

### 1. Database — unlock all 34 deliverables

Single migration that flips every active row:

```sql
UPDATE public.deliverable_types
   SET user_can_trigger = true,
       auto_runnable    = true
 WHERE active = true;
```

No schema change, no RLS change. The existing `depends_on_keys` graph stays intact, so order/sequencing during a "Run remaining" pass is preserved — items still wait for their upstream deliverables to finish, they just no longer sit behind a hard `Coming soon` gate.

### 2. UI — drop the "Coming soon" treatment

In `src/routes/_authenticated/dashboard/workflow.tsx` (and the admin mirror at `src/routes/_authenticated/_admin/admin.attendees.$userId.workflow.tsx`):

- Remove the `comingSoon` branch (lines ~210, 230, 245). Every card now shows either Generate / Regenerate, with the existing "Waiting on upstream" pill when `deps_met` is false but the user has not yet generated the upstream items.
- Keep the Generate button enabled even when `deps_met` is false — clicking it triggers our bulk runner, which already resolves dependencies in order.

### 3. Auto-kick generation for the locked ones

When the workflow page loads and detects deliverables that are now unlocked but never generated, call the existing `forceRunMyRemaining` loop once (silently, with the same sticky progress card we already built) so the user sees the remaining 23 deliverables start generating instead of having to press anything.

A one-time `localStorage` flag (`workflow.autokick.v1`) prevents it from re-triggering on every visit.

### 4. Banner copy

Replace the misleading "All caught up" pill with a live count:

- `X of 34 ready` when some are pending
- `All 34 ready` only when every deliverable has a generated document

## Out of scope

- No changes to `depends_on_keys`, RLS, edge functions, or the bulk-generation engine.
- Bonus Brand / Marketing / Social tracks are included in the unlock since they're part of the 34.
