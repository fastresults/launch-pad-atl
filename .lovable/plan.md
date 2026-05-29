## Goal
Reverse the earlier "lunch on your own" copy. Lunch is now catered and included in the ticket, with a dedicated mid-day break for eating + discussion.

## Changes

1. **`src/components/value/PricingTiers.tsx`** (line 10, perks list)
   - From: `"Coffee + working tables (lunch on your own — options nearby)"`
   - To: `"Catered lunch + coffee + working tables"`

2. **`src/lib/schedule-data.ts`** (lines 79–80, schedule item)
   - Title from `"Lunch break — on your own"` → `"Catered lunch & discussion"`
   - Description → something like: `"Lunch is provided. Eat together, swap notes, and talk through what you're building with the group and instructors."`

3. **`src/routes/index.tsx`** (line 873, "By lunch..." intro)
   - Keep the "By lunch" framing (it's a time marker, still accurate), no change needed — unless you want it reworded. Leaving as-is.

4. **`.lovable/plan.md`**
   - Update the prior "lunch on your own" decision to reflect catered lunch included.

## Out of scope
- Pricing changes (lunch cost absorbed into existing tiers unless you say otherwise).
- Any other schedule or copy edits.

## Confirm before I build
- Wording OK? Specifically the schedule item title/description and the perks bullet.
- Any dietary-options callout needed (e.g., "vegetarian option available"), or keep it generic for now?
