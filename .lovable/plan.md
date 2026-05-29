
## Goal

When a user pays and registers, the system should automatically:
1. Count the seat against the chosen cohort.
2. Lock the Founders tier once its seat cap is hit for that cohort and present the next user with the Cohort tier price.
3. Mark the cohort sold out once all paid seats are taken.

And:
- Let a super admin configure **per-cohort pricing and seat counts** for each tier (defaults to $679 / 7 + $997 / 13, but overridable per cohort).
- Surface those numbers live in the registration UI and in the confirmation email.
- Give a super admin a safe way to test the whole roll-over without burning real payments.

## Current state (what exists)

- `workshop_registrations` has `cohort_id`, `tier_interest`, `status` (default `'pending'`). No payment integration yet.
- `cohorts` has `status` and `seats_left`, manually edited by the super admin.
- `PRICING` (`src/lib/value-grid.ts`) hardcodes `founders.seats = 7 / $679`, `cohort.seats = 13 / $997`.
- The register form lets the user pick any tier; nothing enforces capacity. No payment step.
- No transactional email infrastructure yet.

## What we will build

### 1. Per-cohort pricing & seat config (admin-editable)

Extend `cohorts` with:
- `founders_price_cents int`, `founders_seats int`
- `cohort_price_cents int`, `cohort_seats int`

Defaults applied at insert: 67900/7 and 99700/13 so existing rows behave like today. `/admin/cohorts` (and the new-cohort form) gets four extra fields with inline help: "Founders price", "Founders seats", "Cohort price", "Cohort seats", plus a "Total capacity" computed preview. Validation: both seat counts ≥ 1, both prices ≥ 0.

### 2. Seat counting source of truth

Server function `getCohortAvailability(cohort_id)` returns:

```ts
{
  founders: { price_cents, capacity, taken, soldOut },
  cohort:   { price_cents, capacity, taken, soldOut },
  totalTaken, totalCapacity,
  nextTier: "founders" | "cohort" | null,   // null = full
  cohortSoldOut: boolean,
}
```

Counts `workshop_registrations` for that cohort where `status IN ('paid','confirmed')` grouped by `tier_interest`. Pending rows do not consume seats.

### 3. Atomic seat reservation on payment

Postgres function `public.reserve_cohort_seat(cohort_id, requested_tier)` runs inside a transaction with `SELECT … FOR UPDATE` on the cohort row, reads the per-cohort caps, and returns `(assigned_tier, price_cents)`:
- If founders has room and was requested → assign founders at that cohort's founders price.
- If founders is full → auto-assign cohort tier at that cohort's cohort price.
- If both full → raise "Cohort sold out".

A server fn `confirmRegistrationPayment({ registration_id })` (super-admin only for now, later called by the Stripe/Paddle webhook with the same contract) flips status `pending → paid`, calls `reserve_cohort_seat`, updates the denormalized `seats_left` / `status` cache, and triggers the confirmation email.

### 4. Register page reacts to availability + per-cohort prices

`/register` adds a `useCohortAvailability(cohortId)` query. UI changes:
- Pricing tier cards read price & capacity from the selected cohort, not from `PRICING` constants.
- "X of N Founders seats left at $P" live badge.
- Founders card greys out with "Sold out — N/N claimed" once founders is full; tier auto-switches to Cohort.
- Whole form is disabled with "This cohort is sold out — pick another date" when fully full.
- `CohortPicker` pill dots colored by the same availability data.
- Switching cohorts re-reads price/capacity so a $997/$1,200 cohort displays correctly.

### 5. Confirmation email (transactional)

After `confirmRegistrationPayment` flips a row to `paid`, the system sends a branded confirmation email to the attendee. The email clearly communicates the price they paid, the tier name, the cohort date, the venue (with the "different location" callout when it's not Norcross), and what to bring. Prerequisites are handled inside the same build pass (email domain + queue + transactional template scaffolded; details kept off-screen).

### 6. Super-admin test harness `/admin/cohorts/test`

End-to-end exerciser with no real money:
- Pick a cohort. Live panel mirroring what `/register` would show (per-tier price/capacity/taken).
- Buttons: **Simulate 1 paid registration**, **Simulate fill Founders**, **Simulate sell out**, **Reset cohort** (deletes rows tagged `referral_source='__test__'`).
- Send a **test confirmation email** to an admin-supplied address using a real cohort's data.
- Last-10-registrations table with one-click "Mark paid" / "Mark refunded" toggles for real entries.

### 7. Migrations needed

- `ALTER TABLE cohorts` add the 4 price/seats columns with defaults; backfill existing rows.
- Extend `workshop_registrations.status` to allow `'paid' | 'confirmed' | 'refunded' | 'cancelled'`.
- Index on `(cohort_id, status, tier_interest)`.
- `reserve_cohort_seat(...)` SQL function as above.
- Trigger (or app-side update) to keep `cohorts.seats_left` / `status` in sync with paid counts.
- GRANTs preserved for `authenticated` / `service_role` per existing pattern.

### 8. Out of scope for this plan

- Real Stripe/Paddle integration (the seat + email logic is provider-agnostic; webhook will call `confirmRegistrationPayment`).
- Per-tier waitlist UI when sold out.
- Refund-driven seat release admin UI (DB logic handles release; UI is a follow-up).

## Files we will touch

- new: `supabase/migrations/*_cohort_seats_and_pricing.sql`
- new: `src/lib/cohort-availability.functions.ts`; extend `src/lib/cohorts.functions.ts` (reserve/confirm, admin price/seat edits)
- new: `src/routes/_authenticated/_admin/admin.cohorts.test.tsx`
- new: confirmation email template + transactional send wiring
- edit: `src/routes/_authenticated/_admin/admin.cohorts.tsx` (price/seat fields)
- edit: `src/routes/register.tsx`, `src/components/value/PricingTiers.tsx`, `src/components/value/CohortPicker.tsx`
- edit: `src/lib/registrations.functions.ts` (return registration id; status stays `pending` until payment)
- edit: `src/lib/value-grid.ts` (keep defaults, but UI reads from cohort)

## Questions before I build

1. Until real payments are wired, should the register form keep creating `pending` rows (admin marks paid in the test harness), or should it immediately create `paid` rows so roll-over and the confirmation email fire on submit?
2. Land seat logic + per-cohort pricing + test harness + confirmation email first, and add Stripe/Paddle in a follow-up — okay?
