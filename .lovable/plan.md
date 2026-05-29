# Addressing the 4 pieces of feedback

## 1. Capacity: 20 → 10 (intimate, hands-on)

Reduce cohort size so the day reads as a hands-on, high-touch experience — not a production line.

- `src/lib/cohorts.ts` — `DEFAULT_PRICING`: change `cohortSeats` from 13 → 3 so total (founders 7 + cohort 3) = 10. (Alternative split: founders 5 / cohort 5 — flag for confirmation.)
- `src/lib/schedule-data.ts` — `buildEvent.capacity`: 20 → 10.
- `src/routes/index.tsx`:
  - Line 23 hero description: "20 seats" → "10 seats".
  - Line 138 CTA: "Claim one of 20 seats" → "Claim one of 10 seats".
- Search the codebase for any other "20 seats" / "20 attendees" strings and update.
- **Database**: existing cohort rows in `cohorts` table store their own `founders_seats` / `cohort_seats`. Add a migration to update upcoming (unsold) cohorts to the new split, leaving past cohorts untouched.

## 2. Reframe "everything needed to launch" → operational/soft-skills framing

Make it unambiguous that the workshop delivers the *operational* foundation, not physical assets (kitchen, storefront, inventory, equipment).

Targets and proposed rewrites:

- `src/routes/index.tsx` line 23 (hero subtitle):
  - From: "…you'll have a formed business, a website ready to publish, a complete creative kit, and a signed 30/60/90 launch plan."
  - To: "…you'll walk out **operationally ready to launch** — a formed business, a website ready to publish, a complete creative kit, and a signed 30/60/90 launch plan. *(You handle anything physical your business needs — space, equipment, inventory.)*"
- `src/routes/index.tsx` line 76 ("You arrive with a spark. You leave with a company."): add a one-line caveat — "Everything **operational** to launch. Physical assets (space, equipment, inventory) are on you."
- `src/lib/cohorts.ts` line 87 (`DEFAULT_DESCRIPTION`): replace "revenue-ready business" with "**operationally launch-ready** business" and add the same caveat.
- Audit any other "everything you need" / "ready to launch" phrasing (register page, schedule page, meta descriptions) and apply the same softening.

## 3. Lunch + "by dinner" wording

Two fixes — one factual, one tonal.

- **Lunch**: `src/components/value/PricingTiers.tsx` line 9 currently lists "Lunch + coffee + working tables" as a perk, and `src/lib/schedule-data.ts` line 79 says "Lunch provided." **Confirm with Adam**: is lunch actually provided?
  - If yes: keep, but add a line on the schedule page making it explicit ("Lunch is included — [menu/style]").
  - If no: change perk to "Coffee + working tables (lunch on your own — short break, options nearby)" and change schedule break to "Lunch break — on your own. Options within walking distance."
- **"By dinner"**: `src/routes/index.tsx` line 29 meta description: "…one filing-ready business **by dinner**." → "…one filing-ready business **by 4:30 PM**." (Dinner is not provided; remove the word entirely from public copy.)

## 4. Website inclusion — pricing acknowledgement

Adam's note: the workshop includes a website built/delivered in the following 2 weeks, which is an additional cost the pricing should reflect.

- This is a **pricing decision**, not just copy. Recommend Adam set the new founders/cohort prices before we ship. Proposed placeholder bump (for confirmation): founders $X → $X+$Y, cohort $X → $X+$Y, where $Y reflects the website build cost.
- Once confirmed: update `DEFAULT_PRICING.foundersPriceCents` / `cohortPriceCents` in `src/lib/cohorts.ts` AND migrate upcoming cohort rows in the DB.
- Add a line in `src/components/value/PricingTiers.tsx` PERKS array: "Complete 4-page website — branded, written, SEO-configured, **delivered live within 2 weeks**" so attendees see it as included value.
- Verify the value-grid line for the website (`src/lib/value-grid.ts` line 36) still reads correctly given the 2-week delivery window — adjust `postWorkshop` copy if needed.

## Open questions for Adam (need answers before build)

1. **Capacity split** at 10 total — keep founders 7 / cohort 3, or rebalance to 5/5?
2. **Lunch** — provided or on-your-own?
3. **New prices** — what should founders and cohort tiers be now that the website is explicitly included?

## Out of scope

- No changes to curriculum, schedule timing (still 8:00 AM – 4:30 PM), or venue.
- No redesign of the pricing card layout — only copy/perk-list and price values.
- No changes to past/sold-out cohorts in the database.
