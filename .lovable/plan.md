# Show public (halved) seat counts everywhere on the public site

The `toPublicSeats` / `toPublicTaken` helpers in `src/lib/cohorts.ts` are already used by `PricingTiers`, but several other public surfaces still render the raw internal seat numbers (7 / 13 / 20). This plan finds every remaining leak and routes it through the same helpers so the marketing site consistently reads "first 4 / next 7 / 10 total" while admin + reservation logic keeps the real internal numbers.

## Leaks to fix

1. **Register page scarcity line** — `src/routes/register.tsx` ~lines 231–252
   - Currently: `{availability.founders.remaining} of {availability.founders.capacity} Founders seats left` (and the Cohort variant)
   - These read raw internal values from `availability` → screenshot shows "7 of 7 Founders seats left".
   - Fix: derive public capacity via `toPublicSeats(selectedCohort.foundersSeats)` (and cohort), public taken via `toPublicTaken(availability.founders.displayedTaken, selectedCohort.foundersSeats, publicCapacity)`, then render `publicCapacity - publicTaken` of `publicCapacity`.

2. **Register page "Seat tier" picker** — `src/routes/register.tsx` ~lines 345–380 (screenshot 1)
   - `const cap = ... foundersSeats : cohortSeats` then renders `First {cap} to register`, `Next {cap} seats`, `Sold out · {cap}/{cap} claimed`.
   - Fix: replace `cap` with `toPublicSeats(internalCap)`.

3. **TotalsBar "Your investment" card** — `src/components/value/TotalsBar.tsx` line 22 (screenshot 2)
   - Hardcoded `$997 after first 7 seats`.
   - Fix: import `toPublicSeats` and `PRICING` and render ``$${PRICING.cohort.price} after first ${toPublicSeats(PRICING.founders.seats)} seats``.

4. **Static PRICING subtitles** — `src/lib/value-grid.ts` lines 59–60
   - `subtitle: "First 7 to register"` and `"Next 13 seats"` are stale public copy hardcoded to internal seat numbers. They're not currently rendered (PricingTiers computes its own subtitle), but they're a footgun.
   - Fix: update the literals to the public numbers ("First 4 to register", "Next 7 seats") so any future reuse stays in sync, OR remove the `subtitle` field. Recommendation: update the strings.

5. **CohortPicker "Filling up · N Founders seats left" pill** — `src/components/value/CohortPicker.tsx` ~lines 36–43, 70–76
   - Uses `availability.founders.displayedRemaining` / `cohort.displayedRemaining`, which are raw internal counts.
   - Fix: convert with `toPublicSeats` + `toPublicTaken` on the cohort's internal capacities before rendering.

## Out of scope

- Admin UI (`admin.cohorts.tsx`, `admin.cohorts.test.tsx`) — must keep showing real internal numbers.
- `cohort-availability.functions.ts` — server still returns real numbers; scaling stays in the presentation layer (already the established pattern).
- `schedule-data.ts` — already uses `toPublicSeats`.
- Reservation logic, pricing, roll-over thresholds.

## Verification

- `/register`: scarcity line reads "X of {publicCap} Founders seats left" with publicCap = ceil(internal/2); seat-tier picker shows "First {publicCap} to register" / "Next {publicCap} seats"; sold-out badge shows `publicCap/publicCap claimed`.
- Home page "Your investment" card reads `$997 after first 4 seats` (or whatever `toPublicSeats(7)` resolves to).
- CohortPicker "Filling up" pill shows the halved remaining count.
- Admin cohort screens still show the true 7 / 13 / 20 numbers — unchanged.
- No raw internal number appears anywhere on the public marketing/register pages.
