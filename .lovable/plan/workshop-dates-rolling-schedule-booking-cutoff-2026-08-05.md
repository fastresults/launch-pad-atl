# Workshop dates: rolling schedule + booking cutoff

## Current behavior (verified)

`getUpcomingSessions()` in `src/lib/build-workshop-schedule.ts` regenerates every session from a recurring rule on each render and skips any whose start time is already in the past. So yes — passed dates never show a Reserve option. The screenshot is correct.

Two issues to fix.

## 1. Schedule stops after Dec 2026

The generator loops from the current year through a hard-coded `2026`. Once the last 2026 session passes, every build workshop's "Upcoming dates" section returns empty and hides itself — no dates, no reserve path anywhere on the page.

Change: generate a rolling window of roughly the next 14 months from today instead of stopping at a fixed year. The schedule never runs dry, with no yearly maintenance.

## 2. Sessions stay bookable until the minute they start

Someone can reserve a seat 10 minutes before the room opens, with no time to prep.

Change: hide a session once it is within 48 hours of starting. Applies everywhere the schedule is read (homepage workshop stack, `/build/:slug`, and the register page's date list), since they all call the same function.

## Technical notes

- Single file changes the behavior: `src/lib/build-workshop-schedule.ts`.
  - Replace the `year <= 2026` bound with a computed horizon (`now` + 14 months).
  - Replace the `startISO <= now` skip with `startISO - 48h <= now`.
  - Export the cutoff as a named constant so it is easy to tune later.
- `getUpcomingSessions(slug, now, limit)` keeps its signature, so no callers change.
- Verify: `/`, `/?w=brand-identity`, `/build/brand-identity`, and `/register?workshop=brand-identity` all list the same set, with Aug 11 no longer offered inside the 48h window on the day.
