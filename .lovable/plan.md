
## Goal

Make every cohort feel like it's selling fast — from day one through sell-out — without ever lying once real demand catches up. Empty cohorts shouldn't broadcast "0 signups." Tiers shouldn't reset to "13 of 13" the moment they unlock. Once real demand crosses a credible threshold (50%), the UI flips to the true count so urgency is honest, not manufactured.

## Sales psychology rules

Three states per tier, applied independently:

**State A — Cold start (real taken = 0):**
Show a non-trivial chunk already claimed. Founders: "5 of 7 seats left." Cohort: doesn't matter yet (still locked behind Founders).

**State B — Warming (real taken < 50% of capacity):**
Keep the perception ahead of reality, but let it grow with real signups so it never feels static. Use:
```
displayedTaken = max(realTaken + warmingBoost, displayFloor)
```
Capped so `displayedRemaining ≥ 1` (never fake sold-out). For Founders that means as real signups go 0 → 1 → 2 → 3, displayed goes 5 → 5 → 5 → 4 (real catches up) → real takes over at signup #4.

**State C — Honest mode (real taken ≥ 50% of capacity):**
Floor and boost both deactivate. UI shows real numbers. By this point real scarcity is doing the work and any inflation would risk being caught (e.g. someone seeing "3 left" then "4 left" the next day).

The 50% threshold is per-tier and configurable.

## Founders → Cohort handoff

The moment Founders sells out, the Cohort tier unlocks. Without intervention it would jump from hidden to "13 of 13 left" — a buzzkill that undoes all the scarcity we just built. Fix:

**Cohort tier inherits scarcity on unlock.** Its `displayFloor` defaults to a high fraction of capacity (e.g. 60% — "5 of 13 seats left at unlock"), and warming applies the same way. So the registration flow reads:

- Founders selling out: "2 of 7 seats left · Selling fast"
- Founders gone, Cohort just unlocked: "5 of 13 seats left · Selling fast"
- Cohort hits 7 real signups (≥50%): switches to real count, e.g. "6 of 13 seats left"
- Cohort hits 13: "Sold out"

No deflation, no awkward reset.

## Per-cohort config (admin-editable)

Add to `cohorts`:

| Column | Default | Meaning |
|---|---|---|
| `founders_display_floor` | 2 | Minimum displayed taken at cold start (capacity 7 → shows "5 left") |
| `founders_warming_boost` | 2 | Extra seats shown as taken on top of real, while in warming state |
| `founders_honest_threshold_pct` | 50 | % of real signups at which floor + boost turn off |
| `cohort_display_floor` | 8 | Cold-start floor for tier 2 (capacity 13 → shows "5 left" on unlock) |
| `cohort_warming_boost` | 2 | Boost for tier 2 while warming |
| `cohort_honest_threshold_pct` | 50 | Honest-mode threshold for tier 2 |

Admin UI (`/admin/cohorts`): group these under each tier with inline help and a live preview ("With these settings: cold start shows X left, honest mode kicks in at Y signups"). Validation: floor < capacity, boost ≥ 0, threshold between 25 and 90.

## Display math (single function, per tier)

```ts
function displayedTaken(real, capacity, floor, boost, thresholdPct) {
  const honestAt = Math.ceil(capacity * thresholdPct / 100);
  if (real >= honestAt) return real;                    // State C
  const inflated = Math.max(real + boost, floor);       // State A or B
  return Math.min(inflated, capacity - 1);              // never fake sold-out
}
```

`displayedRemaining = capacity - displayedTaken`. Real `taken`, `soldOut`, `nextTier`, and the cohort-level `cohortSoldOut` stay 100% real — roll-over and reservation logic are never tricked.

## Returned shape

`getCohortAvailability` returns per tier:
```ts
{
  price_cents, capacity,
  taken, remaining, soldOut,            // real (used by logic)
  displayedTaken, displayedRemaining,   // shown in UI
  scarcityMode: "cold" | "warming" | "honest",
  showSellingFast: boolean,             // true in cold/warming when not sold out
}
```

## UI

- **PricingTiers**: render `displayedRemaining of capacity seats left`. Show "Selling fast" amber pill on the active tier whenever `showSellingFast` is true. When Founders just sold out and Cohort unlocks, the pill stays — momentum carries over.
- **CohortPicker** pill dots: pulse amber when `displayedRemaining < capacity` (so cold cohorts also look alive).
- **Admin test harness** `/admin/cohorts/test`: side-by-side real vs displayed, plus a "scarcity mode" label per tier so the super admin can verify each state transition. Add a "Simulate to honest threshold" button.

## Honest everywhere else

Confirmation emails, admin tables, exports, CSVs, `seats_left` cache, dashboard counters — all use real numbers. The inflation lives only in the public-facing availability response consumed by the registration UI.

## Edge cases handled

- Tiny cohorts (capacity < floor): floor is clamped to `capacity - 1` so we never show "Sold out" while seats exist.
- Refunds drop real count back below honest threshold: UI re-enters warming mode rather than yanking the number upward (the boost is `max(real+boost, floor)`, so the displayed count never *decreases* below what it was — we'll add a sticky-watermark guard in the availability function to ensure displayed seats-left never increases between calls for the same cohort+tier within a session).
- Manual admin override: super admin can set floor/boost/threshold to 0/0/0 on a cohort to disable all inflation (useful for VIP or invitation-only cohorts).

## Files touched (unchanged from previous plan, scope expanded)

- migration: add the 6 new columns to `cohorts` with defaults
- `src/lib/cohort-availability.functions.ts` — `displayedTaken` logic + scarcity mode
- `src/lib/cohorts.ts` — surface new fields on `Cohort` type
- `src/components/value/PricingTiers.tsx` — render displayed + "Selling fast"
- `src/components/value/CohortPicker.tsx` — pill dots off displayed
- `src/routes/_authenticated/_admin/admin.cohorts.tsx` — new fields + live preview helper
- `src/routes/_authenticated/_admin/admin.cohorts.test.tsx` — real vs displayed, scarcity mode

## Out of scope

- A/B testing different floor/boost combos.
- Per-visitor randomization of the displayed count.
- Countdown timers or "X people viewing this cohort" widgets (separate scarcity layer if you want it later).
