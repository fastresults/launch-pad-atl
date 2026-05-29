# Percentage-based scarcity floor for Founders

## Problem
The Founders display floor is currently an absolute integer (default 2, shown as "5 of 7 left"). If admin changes Founders capacity to 20, the cold-start state still shows "18 of 20 left" — no scarcity. We need the floor to scale with capacity so the cold-start always shows roughly 25% of seats remaining, regardless of size.

Examples (target: ~25% remaining at cold start):
- Capacity 7 → show ~2 left ("5 of 7 left")
- Capacity 13 → show ~3 left ("10 of 13 left")
- Capacity 20 → show 5 left ("15 of 20 left")
- Capacity 40 → show 10 left ("30 of 40 left")

## Rule
Replace the absolute `founders_display_floor` (integer count of "fake taken") with `founders_display_floor_pct` (integer percent of capacity that should appear **remaining** at cold start). Same change for Cohort tier so admin behavior stays consistent.

Computed at request time:
```
displayedRemainingFloor = ceil(capacity * pct / 100)        // at least 1 when pct > 0
displayedTakenFloor     = capacity - displayedRemainingFloor
```

Then feed `displayedTakenFloor` into the existing `computeDisplayedTaken(real, capacity, floor, boost, thresholdPct)` math — cold / warming / honest modes all keep working unchanged.

Default value: **25** (percent remaining).

## Changes

### 1. Migration
- Add `founders_display_floor_pct INTEGER NOT NULL DEFAULT 25`
- Add `cohort_display_floor_pct INTEGER NOT NULL DEFAULT 25`
- Backfill from existing absolute floors where sensible, then we can leave the old `*_display_floor` columns in place (unused) or drop them. Simpler: **drop** `founders_display_floor` and `cohort_display_floor` since nothing user-facing depends on the old values yet.

### 2. Server: `src/lib/cohort-availability.functions.ts`
- Read the new `_pct` columns.
- Compute `displayedTakenFloor` from pct + capacity before calling `computeDisplayedTaken`.
- Keep the existing sequential gate (Founders first, Cohort only after Founders sells out) and the active-cohort gate untouched.

### 3. `src/lib/cohorts.ts` / `cohorts.functions.ts`
- Replace `foundersDisplayFloor` / `cohortDisplayFloor` fields on the `Cohort` type and DTO with `foundersDisplayFloorPct` / `cohortDisplayFloorPct`.
- Update upsert payload validation: pct must be 0–90 (capping at 90 prevents "0 of N left" cold start).

### 4. Admin: `admin.cohorts.tsx`
- In the `ScarcityFields` component, rename the floor input to **"Cold-start remaining %"** with a suffix `%`, range 0–90, default 25.
- Update the live preview helper text: "At cold start, visitors see X of N left (≈ {pct}% remaining)" computed from current capacity.
- Update the default in `emptyForm()` to `25` for both tiers.

### 5. Admin test harness: `admin.cohorts.test.tsx`
- No structural change. The existing "shown as N" diff already reflects whatever the server returns.

## Edge cases
- **Capacity 1–3 with 25%**: `ceil(3 * 0.25) = 1` → shows "1 left" (still credible).
- **Capacity 0**: skip the floor entirely (tier disabled).
- **pct = 0**: no cold-start inflation; behaves like honest mode from the start.
- **pct = 90 on capacity 7**: shows "1 left" cold (we clamp displayed taken to `capacity - 1` already, so it never fakes sold-out).

## Out of scope
- Per-cohort overrides beyond the pct itself.
- Warming boost and honest threshold — unchanged.
- Any UI/copy change on the public pricing card beyond the numbers it already renders.

## Files to touch
- New migration to add `founders_display_floor_pct`, `cohort_display_floor_pct`, drop old `*_display_floor` columns
- `src/lib/cohort-availability.functions.ts`
- `src/lib/cohorts.ts`
- `src/lib/cohorts.functions.ts`
- `src/routes/_authenticated/_admin/admin.cohorts.tsx`
