# Add "income potential" to every idea card

Right now each card shows what it costs to start. The user is right — prospects need to see the upside, not just the entry price. Below is the recommended treatment.

## What to display (per card)

A **two-stat bar** near the top of the card, side by side:

| Cost to start | Monthly income potential |
|---|---|
| Under $1,500 | $2k–$5k / month |

- **Cost to start** stays where it is (small, muted) — it removes fear.
- **Monthly income potential** is the new hero stat — bigger type, brand-gradient color, on its own line so the eye lands on it first.

Format the income as a realistic **range**, monthly:
- `$800–$2k / mo` (side hustle)
- `$3k–$8k / mo` (typical small operator)
- `$8k–$20k / mo` (route, retainer, or catering at scale)

Ranges (not single numbers) keep it honest and don't over-promise — important for the 20-year-coach voice and for the 7th-grade-reading audience.

Add a small footnote line on hover: *"Year-one range when you follow the plan."* Keeps expectations realistic and ties back to the 90-day plan from Stage 7.

## Visual layout per card (top → bottom)

1. Category chip + small icon (unchanged)
2. **NEW prominent stat block** — `Monthly potential` label in muted micro-caps, then a large gradient number like `$3k–$8k / mo`
3. Small "Starts under $X" line directly beneath it, muted, smaller
4. Business name (unchanged)
5. One-line offer (unchanged)
6. "First 10 from" line (unchanged)
7. Stage hint on hover (unchanged)

This makes the **income** the visual anchor of the card. Cost becomes a supporting detail under it instead of sharing equal weight.

## Section-level addition

Add one disclaimer line directly under the section subhead, in muted text:

> Ranges shown are realistic year-one numbers for solo operators who follow the seven-stage plan. Yours will depend on hours, pricing, and how many customers you keep.

This protects credibility without dampening the inspiration.

## Why this works for prospects

- **The dream is the headline.** "$3k–$8k / mo" is the first number the eye catches — that's the reason a prospect leans in.
- **The fear-killer stays.** "Starts under $1,500" sits right next to the dream — they see both at the same glance.
- **Ranges, not promises.** A range reads as "people like me, doing this honestly" instead of a get-rich-quick claim.
- **Hover footnote keeps it grounded.** Confirms it's tied to actually doing the work in Stage 7's 90-day plan.

## Files I'll touch

- `src/lib/business-ideas.ts` — add `incomePotential: string` to the type and to all 28 ideas with realistic per-month ranges per business type.
- `src/routes/index.tsx` `IdeaCard` — restructure the top of the card to lead with monthly potential; demote cost to a supporting line.
- `TheArtOfThePossible` — add the one-line disclaimer under the section subhead.

## Out of scope

- No changes to category filter, marquee, mobile rail, bridge card, or any other section.
- No annual figures, no "up to $X" caps, no testimonial-style claims — ranges only, monthly, honest.

## Verification

- Load `/` at 1384px and mobile; scan 5 random cards — the income number should be the most visible thing on the card.
- Confirm the disclaimer reads at a 7th-grade level and doesn't feel like fine print.
- Confirm ranges feel believable for a solo operator (no "$50k/mo" on a lawn-care card).

Say go and I'll ship it.