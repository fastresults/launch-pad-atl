# Addressing Adam's feedback — v2 (public-vs-internal seat counts)

## NEW: Public seat count = ½ of internal capacity

**Internal (admin / DB / registration pipeline):** real capacity stays at 20 per cohort (founders 7 + cohort 13, or whatever super admin sets). We continue onboarding up to that real number.

**Public (marketing site / register page / hero / pricing cards):** display HALF of internal capacity, rounded. With 20 internal → 10 public. With 16 internal → 8 public.

Tier split is **percentage-based**, not absolute, so public and internal stay proportional:

- Internal: `foundersSeats = 7`, `cohortSeats = 13` → founders is ~35% of capacity.
- Public view: `Math.round(20 / 2) = 10` total; founders = `Math.round(10 * 7/20) ≈ 4`; cohort = `10 − 4 = 6`.
- Tier transition (founder → cohort price) still triggers at the real 7-seat mark internally; the public-facing "X of 10 founder seats left" derives from the same percentage so the public counter ticks down at half-speed.

### Code changes

1. **Add a single helper** in `src/lib/cohorts.ts`:
   ```ts
   export const PUBLIC_DISPLAY_DIVISOR = 2;
   export function toPublicSeats(internal: number) {
     return Math.max(1, Math.round(internal / PUBLIC_DISPLAY_DIVISOR));
   }
   export function toPublicTaken(internalTaken: number, internalCapacity: number, publicCapacity: number) {
     if (internalCapacity <= 0) return 0;
     return Math.min(publicCapacity, Math.round((internalTaken / internalCapacity) * publicCapacity));
   }
   ```
2. **`src/lib/cohort-availability.functions.ts`** — when building the availability payload returned to the public site, compute and return BOTH:
   - `founders.capacity` / `cohort.capacity` → public values (via `toPublicSeats`)
   - `founders.displayedTaken` / `cohort.displayedTaken` → scaled via `toPublicTaken`
   - `founders.soldOut` / `cohort.soldOut` → derived from internal counts (true sold-out fires when the real seats are gone, not the public-display ones — so we never oversell)
3. **`src/components/value/PricingTiers.tsx`** — already consumes `cohort.foundersSeats` / `cohort.cohortSeats` for the badge text. Pass public values into the public-facing component; keep internal values for admin views.
4. **Admin pages** (`src/routes/_authenticated/_admin/admin.cohorts.tsx`, `admin.registrations.tsx`, `admin.cohorts.test.tsx`) — continue to show the **real** numbers (e.g., "5 / 20 taken"). Add a small subline like "Public site shows 10 seats" so admins aren't confused.
5. **Hero / CTA copy** in `src/routes/index.tsx`:
   - Hero subtitle: "Just 10 seats — intimate and hands-on." (uses public number)
   - CTA: "Claim one of 10 seats" (public)
   - Source the "10" from `toPublicSeats(cohort.foundersSeats + cohort.cohortSeats)` rather than hardcoding, so if Adam changes capacity in admin, copy updates.

### What does NOT change

- `DEFAULT_PRICING` in `src/lib/cohorts.ts` stays at founders 7 / cohort 13 (total 20 internal).
- `reserve_cohort_seat` DB function — unchanged. Pricing tier still flips at the real 7-seat threshold.
- Registration form, payment flow, `workshop_registrations` table — unchanged. We onboard up to 20.
- No DB migration needed for the seat-count change.

---

## Unchanged from v1 (still in scope)

### 1. Reframe "everything to launch" copy

- `src/routes/index.tsx` hero subtitle (line 23): "…you'll walk out **operationally ready to launch**…" + caveat "*(Anything physical your business needs — space, equipment, inventory — is on you.)*"
- `src/routes/index.tsx` "You leave with a company" paragraph (line 76): append same caveat.
- `src/routes/index.tsx` eyebrow (line 113): "revenue-ready" → "operationally launch-ready".
- `src/lib/cohorts.ts` `EVENT_DETAILS` / `DEFAULT_DESCRIPTION`: same softening.

### 2. Lunch + "by dinner"

- `src/components/value/PricingTiers.tsx` PERKS: "Lunch + coffee + working tables" → "Coffee + working tables (lunch on your own — options nearby)".
- `src/lib/schedule-data.ts` lunch break: "Lunch provided" → "Lunch break — on your own. Options within a short drive."
- `src/routes/index.tsx` og:description (line 29): "by dinner" → "by 4:30 PM".

### 3. Website inclusion in pricing perk list

- `src/components/value/PricingTiers.tsx` PERKS: add "Complete 4-page website — branded, written, SEO-configured, delivered live within 2 weeks".
- Price values themselves: **flagged for Adam to set**. I will NOT change `foundersPriceCents` / `cohortPriceCents` until you give numbers.

---

## Open questions for Adam

1. **Founders/cohort internal split** at 20 — keep 7/13, or rebalance? (Affects what the public sees: 7/13 → public 4/6; 10/10 → public 5/5.)
2. **Website-inclusive prices** — what should founders and cohort tiers be now that the website build is explicitly included?

(Lunch is settled: on-your-own.)

## Out of scope

- No curriculum, schedule timing, or venue changes.
- No pricing-card redesign.
- No changes to past/sold-out cohorts in the database.
