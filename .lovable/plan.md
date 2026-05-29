## Problem

The register page shows `20 seats per cohort` (and `All 20 seats … are claimed` when sold out), which is the true capacity (`founders_seats + cohort_seats` = 7 + 13). Public-facing copy should advertise half of that.

## Change

In `src/routes/register.tsx`, replace the two `selectedCohort.totalSeats` references in user-facing strings with a displayed value equal to `Math.ceil(selectedCohort.totalSeats / 2)` (10 for the default cohort).

- Line ~181: `{displayedSeats} seats per cohort`
- Line ~302: `All {displayedSeats} seats for {selectedCohort.dateLabel} are claimed.`

Compute `displayedSeats` once near the top of the component from `selectedCohort.totalSeats`.

## Out of scope

- No DB changes — real capacity, seat reservation, sold-out logic, and the cohort-availability "displayed remaining" math all stay on actual `totalSeats`.
- Admin views continue to show the true number.
- No change to the "1 founders seat left" / "filling up" pill — that already uses the display-floor system in `cohort-availability.functions.ts`.
