## Problem

`/register` and any page using `useEvent()` show "No upcoming cohorts scheduled yet" and fall back to a hard-coded fallback cohort, even though admin has 12 real cohorts in the database. Confirmed via network capture: `listCohorts` is never called on page load.

## Root cause

`useQuery({ initialData: [], staleTime: 60_000 })` makes the query "fresh on mount" because `initialData` defaults its updated-at to now. `queryFn` is never invoked, so the real cohorts are never fetched.

## Fix (two files, one-line each)

Add `initialDataUpdatedAt: 0` to both queries so the query is considered stale immediately and actually fetches on mount, while still rendering instantly with an empty array (no flicker/crash).

1. **`src/routes/register.tsx`** — the `useQuery<Cohort[]>` at ~line 89 (queryKey `["cohorts"]`).
2. **`src/lib/use-event.ts`** — the matching `useQuery<Cohort[]>` (queryKey `["cohorts"]`) used by the home/schedule/hero pages.

After the fix, `CohortPicker` will receive all 12 cohorts and the hero's "10 seats per cohort" line will derive from the real selected cohort instead of the fallback.

## Verification

- Reload `/register` → cohort pill rail shows Jun 17 (sold out, strikethrough), Jul 23 (active/Scarcity), then Aug → May 2027.
- Network panel shows a `_serverFn` call for `listCohorts` returning 12 rows.
- No copy or layout changes anywhere else.

## Out of scope

- No DB changes (data is correct).
- No changes to `CohortPicker`, scarcity logic, or admin.
- No styling changes.
