## What's confusing today

One line in the "What others are starting in 2026" section reads:

> …using the same seven stages. **Under $10,000 to start.** A focused 90 days to launch.

Sitting right next to the workshop pitch, that "$10,000" reads like a workshop price tag. It needs to go. The workshop fee and whatever a founder later spends to launch *their* business are two different conversations, and the website shouldn't mix them.

## Plan

### 1. Remove the section-level capital line (`src/routes/index.tsx`, ~line 769)

Rewrite the lead paragraph under the section headline so the only promise is the workshop's deliverable — a built business and a 90-day plan. No dollar number attached.

Before:
> Scroll through for inspiration. **Yours doesn't have to be on this list — it shouldn't be.** You walk in with your idea, and we build the business around it using the same seven stages. Under $10,000 to start. A focused 90 days to launch.

After:
> Scroll through for inspiration. **Yours doesn't have to be on this list — it shouldn't be.** You walk in with your idea, and we build the business around it using the same seven stages — so you leave with a formed business and a 90-day plan you can run on Monday.

### 2. Audit the rest of the funnel for the same conflation

I searched the codebase for "$10,000", "ten thousand", "under $", "to start", "capital", and "invest" across `src/routes/`, `src/components/site/`, and the schedule/register pages. The only workshop-adjacent capital reference is the line above. The hero, schedule, register form, footer, and value-by-the-numbers section don't bundle startup capital with workshop messaging — no other edits needed there.

### 3. The per-card "Starts under $X" line — recommend KEEP, flagging for your call

Each idea card shows two stat lines together:
- **Monthly income potential** — e.g., "$10k–$25k / mo"
- **Starts under $X** — e.g., "Starts under $1,500" (idea-specific; ranges from $100 to $9,500 across the 60 cards — none say "$10,000")

These are factual data points *about each business idea*, the way a real-estate card shows beds and baths. Income without a cost anchor is hard to read — "$10k/mo" means very different things if it takes $100 vs. $9,500 to launch. None of these labels reference $10,000 or imply the workshop costs anything.

**Recommendation:** keep the per-card "Starts under $X" — it's per-idea context, not a workshop claim. If you'd rather remove or relabel them too (e.g., move to a hover/expanded view, or drop them entirely), say so and I'll do that pass in the same turn.

## Files touched

- `src/routes/index.tsx` — one paragraph in `TheArtOfThePossible` (lines ~760–770).

## Verification

- Reload `/`, scroll to "What others are starting in 2026," read the lead paragraph: no dollar amount appears.
- Grep the repo for `10,000` and `to start` — only matches should be the per-card "Starts under $X" labels (which are idea-specific, not workshop-adjacent).
- Hero, register page, schedule page, and footer remain unchanged.
