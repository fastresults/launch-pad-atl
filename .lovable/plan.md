## Goal

The landing hero currently says "3 seats. Zero cost." — accurate, but it reads like a discount, not an invitation. A visitor can't tell how big the room is, who else will be there, or what actually happens that morning. Fix: keep the scarcity, but make it feel like a small table you're being invited to sit at.

## Copy changes (landing page only — `src/components/landing/LandingFramework.tsx`)

**Offer card (the block in the screenshot)**

- Pill: `Free launch offer` → `Free launch offer · 3 seats left`
- Headline: `3 seats. Zero cost.` → `3 seats left at the table.`
- Sub-line under the location row (new): `One table. Three founders. Nobody watching from the back.`
- Body paragraph: open with the room size before the outcome — "It's three founders, one table, and one operator working through your business with you. You leave with the written foundation for a startup you can build on immediately — brand nailed, offer priced, marketing copy and website PRD written, operations mapped."

**Event meta strip**

- `Just 3 seats · free` → `3 seats left · one table · free`
- Add nothing else; the strip already carries date, place, and time.

**Hero deck (left column)**

- Add one intimacy line after the "Pull up a chair" deck: "No auditorium, no cohort of fifty, no pitch night. Three founders at one table for a single morning."

**"What's included" line (~line 411)**

- `A seat next to Adam and 2 other founders — coffee, snacks, and a small room building alongside you` → `A seat at a table of three — you, two other Atlanta founders, and Adam working through each business out loud, with coffee.`

**Closing CTA block (~line 636)**

- Lead with the table: "Three seats. One table. One morning." then keep the existing free/evaluation copy.

## What the attendee now knows above the fold

Room size (3 founders + Adam), format (one table, worked out loud, not lectured), duration (one morning, 8:45–11:30), and what gets produced (four written foundations). Scarcity reads as "3 seats left," not "we only sell 3."

## Notes

- Landing page only. The full-site homepage (`HomeFramework.tsx`, 20 seats) is untouched.
- `LandingInterestModal.tsx` copy ("3 Atlanta entrepreneurs") stays consistent with "three at one table" — I'll adjust its lead line to match tone only, no logic change.
- Pure presentation copy — no schema, form, or email changes. Seat count stays the hardcoded `seats: 3` constant; not wiring it to live reservation counts unless you want that.
