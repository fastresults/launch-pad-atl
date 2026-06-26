## Problem

When the user clicks "Run remaining" on `/dashboard/workflow`, the request succeeds (a bulk run is queued) but the UI throws:

```
Cannot read properties of undefined (reading 'total')
```

## Root cause

`runMyRemaining()` in `src/lib/userPipeline.functions.ts` queues a bulk pipeline run and returns `undefined` (no body). But the mutation's `onSuccess` in `src/routes/_authenticated/dashboard/workflow.tsx` (line 37) reads `r.total - r.failed` / `r.total`, which blows up when `r` is undefined.

The shape with `{ total, failed }` only ever existed on `adminRunForUser`, which runs synchronously. The user-facing path is async (queue-based), so those fields don't apply.

## Fix

1. `src/lib/userPipeline.functions.ts` — return a small status object from `runMyRemaining()` (and `runMyDeliverable()` for consistency): `{ queued: true }`.
2. `src/routes/_authenticated/dashboard/workflow.tsx` — update the `runAll` mutation's `onSuccess` to show a "Queued — generating remaining deliverables" toast instead of referencing `r.total`. Keep `qc.invalidateQueries` so the list refreshes; the existing 3–5s `refetchInterval` on `getMyWorkflow` / `getMyRecentRuns` will surface progress as runs complete.
3. No DB, RLS, or edge-function changes required.

## Verification

- Click "Run remaining" → see "Queued…" toast, no runtime error.
- Recent runs panel begins showing the queued runs within a few seconds.
