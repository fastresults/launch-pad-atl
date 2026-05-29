# Scope scarcity to the active cohort only

## Problem
Right now, every future cohort shows inflated "selling fast" numbers via the per-cohort `display_floor` / `warming_boost` columns. That breaks credibility — a prospect browsing cohort #4 six months out shouldn't see "5 of 7 founder seats left" when reality is 0.

Scarcity psychology only works on the cohort a buyer can act on **right now**: the next chronologically open cohort. Future cohorts should show honest zero-state numbers ("7 of 7 seats available") until they become the active one.

## Rule
A cohort qualifies as **active for scarcity** when:
1. Its `cohort_date` is the earliest non-sold-out cohort with `status != 'sold_out'` and date ≥ today, AND
2. It is the cohort currently being viewed / queried.

All other cohorts (every later date, plus past/sold-out ones) bypass the floor and boost — they render real numbers.

## Changes

### 1. Server: `src/lib/cohort-availability.functions.ts`
- When computing availability for a cohort, first determine whether it is the active cohort:
  - Query the cohorts table for the earliest cohort where `cohort_date >= today` AND `status != 'sold_out'`, ordered by `cohort_date, sort_order`.
  - If that cohort's `id === requested cohort id` → apply scarcity (current behavior).
  - Otherwise → force `displayedTaken = realTaken`, `scarcityMode = 'honest'`, `showSellingFast = false`, and `displayedRemaining = realRemaining`.
- Return a new flag `isActiveCohort: boolean` so the UI can label/preview correctly.

### 2. Admin preview: `src/routes/_authenticated/_admin/admin.cohorts.tsx`
- In the scarcity-config block, show a small badge next to each cohort:
  - "Active cohort — scarcity live" (amber) for the one active cohort.
  - "Future cohort — honest numbers" (muted) for all later cohorts.
  - "Sold out / past" (muted) for the rest.
- Keep the floor/boost/threshold inputs editable for all cohorts (they still take effect once that cohort becomes active), but add a one-line note: *"These values only display once this cohort is the next available one."*

### 3. Admin test harness: `admin.cohorts.test.tsx`
- Add an "Active?" column showing which cohort is currently the scarcity-active one.
- Show real vs displayed counts as today, but for inactive cohorts the two columns will match.

### 4. No other changes
- `PricingTiers.tsx`, `CohortPicker`, registration flow: no code change. They already consume `displayedRemaining` / `showSellingFast` from the server, which will now correctly return honest values for non-active cohorts.
- Reservation, `seats_left` cache, emails, exports: untouched.
- Migration: none — we're using existing columns differently, not adding new ones.

## Edge cases
- **All cohorts sold out**: no active cohort exists → every cohort renders honest (sold-out) numbers. Correct.
- **Active cohort flips mid-session**: when the current active cohort sells out, the next one becomes active on the next query; its inflated numbers kick in automatically. No manual admin step needed.
- **Admin manually marks a cohort `sold_out`**: it drops out of the active pool, and the next-date cohort inherits scarcity on the following load.
- **Two cohorts on the same date**: tie-break by `sort_order` then `id` so exactly one is active.

## Out of scope
- A/B testing scarcity copy.
- Showing scarcity on the cohort picker for non-active dates.
- Changing the threshold math itself (50% honest cutoff stays).

## Files to touch
- `src/lib/cohort-availability.functions.ts` (main logic)
- `src/routes/_authenticated/_admin/admin.cohorts.tsx` (active badge + note)
- `src/routes/_authenticated/_admin/admin.cohorts.test.tsx` (active column)
