
# Deepen the Founder Roadmap — Customer, Competition, Purpose

Three new chapters folded into the existing roadmap workflow. No new buttons, no new components, no schema changes — just a richer prompt and a dialog that knows how to render the new sections.

## What the founder will see

Inserted into the existing roadmap, in this order:

- **Chapter 2 — Who You're Building For** (new) — a vivid human portrait of the ICP, not a persona table.
- **Chapter 4 — The Field You're Entering** (new) — the competitive landscape, written as a narrative read of the market, not a feature matrix.
- **Chapter 10 — Why This Matters** (new) — the purpose chapter: why this venture is worth a founder's years, where it sits in a bigger shift, and what changes in the world if it works.

Existing chapters renumber and shift accordingly. The cover, stat strip, "The One Thing," and Closing Note stay in place.

## New chapter specs (added to the system prompt)

### Chapter 2 — Who You're Building For
Open with one paragraph naming the ICP segment in plain English. Then a vivid 4–6 sentence **day-in-the-life vignette** of one named archetype (job title, context, what their Tuesday morning actually looks like, the moment your product enters their day). Follow with three short labeled blocks:
- **What they're trying to do** — the job-to-be-done in their words.
- **What they've already tried** — current workarounds and why those fall short.
- **What "good" looks like to them** — the outcome they'll pay for.
Close with a markdown table: **Trigger | Buying moment | Where to find them | What they need to hear first** — 3–4 rows grounded in icp_personas and go_to_market.

### Chapter 4 — The Field You're Entering
Open with one paragraph that reads the market like a strategist would: who's already there, what shape the market is in (fragmented / consolidating / dormant / hot), and where the white space sits. Then:
- **The players you'll be compared to** — narrative paragraph naming 3–5 real competitors from the kit (competitor_research / market_research), one line each on how they actually compete (price, channel, brand, depth).
- **Where you win** — markdown table: **Competitor | How they win today | Where they're weak | Your move**. 3–5 rows.
- **The shift in your favor** — one paragraph on the macro trend, regulation, behavior change, or tech shift that makes this the right moment.
- **What would have to be true for them to copy you** — 2–3 sentences honestly assessing defensibility.

### Chapter 10 — Why This Matters
Open with a personal-tone paragraph addressed to the founder by first name about why this work is worth their years. Then:
- **The bigger shift you're part of** — one paragraph placing the venture inside a larger movement, industry change, or human need.
- **Who is better off if you win** — a short list (3–5 lines) naming customers, employees, partners, family/community — concrete beneficiaries, not slogans.
- **The story you'll get to tell in 5 years** — a 3-sentence forward-looking narrative, written as if the founder is recounting it on a stage. Specific, grounded in the kit's pricing/scale assumptions.
- Close with a single italic line: *This is why it's worth the next 1,000 days.*

## Updated chapter order in the prompt

```
Cover & Verdict
Stat Strip
Chapter 1  — What You've Built
Chapter 2  — Who You're Building For        (NEW)
Chapter 3  — Why This Can Win
Chapter 4  — The Field You're Entering      (NEW)
Chapter 5  — The Honest Fight Ahead
Chapter 6  — Your First 45 Days
Chapter 7  — Your First Year
Chapter 8  — Money & Runway, In Plain English
Chapter 9  — How to Talk About This
Chapter 10 — Why This Matters               (NEW)
Chapter 11 — Your Operating Cadence
Chapter 12 — Read Next From Your Kit
The One Thing
Closing Note
```

The 45-day → 12-month continuity rule still applies (Chapter 6 → Chapter 7). All tone rules, "real names from the kit," and the QUALITY_SCORE trailer are preserved.

## Context bundle additions (edge function)

To make the new chapters specific, the existing `PROTECTED_TYPES` list (which keeps these docs un-truncated in the prompt) gains the doc types the new chapters lean on:

- `competitor_research` / `competitive_landscape` (whichever exist in `venture_document_types`)
- `market_research`
- `brand_strategy` / `brand_positioning` (for the purpose chapter voice)

The bundle already passes all completed docs, so the model has access; protecting these from truncation just guarantees the new chapters get real material to synthesize from. I'll first read `venture_document_types` to use the exact type slugs that exist before editing the protect list.

## Dialog changes

`FounderRoadmapDialog.tsx` already renders any `Chapter N — Title` H2 with the eyebrow and accent rule, so the three new chapters render correctly with **no code change required**. The sidebar nav auto-picks them up.

Two tiny touches:
- The `chapterEyebrow` matcher already handles `Chapter N — …`; confirm "Why This Matters" still renders the eyebrow (it will, since the prompt forces the `Chapter 10 — ` prefix).
- No change to cover/stat-strip parsing.

## Files touched

- `supabase/functions/venture-generate-roadmap/index.ts`
  - Rewrite `SYSTEM_PROMPT` to insert the three new chapters and renumber the rest. Tone rules, format rules, QUALITY_SCORE trailer unchanged.
  - Extend `PROTECTED_TYPES` with the competitor/market/brand doc-type slugs that actually exist (verified against `venture_document_types` first).

No other files change. No migration. No new components. No card copy change.

## Verification

1. Regenerate the roadmap on the current snapshot.
2. Open the dialog and confirm 15 H2 sections including the three new chapters at positions 2, 4, and 10, with eyebrow labels rendered.
3. Spot-check **Chapter 2** for a real ICP vignette (named role, Tuesday-morning specifics, not generic).
4. Spot-check **Chapter 4** for 3–5 real competitor names from the kit and a populated "Where you win" table.
5. Spot-check **Chapter 10** for the founder's first name and a concrete "in 5 years" story tied to real numbers.
6. Confirm the 45-day → 12-month continuity (Chapter 6 → Chapter 7) still holds.
7. Export to .docx and Print → all three new chapters render cleanly.

## Out of scope

- No new chapters beyond these three.
- No new "share with customer" or "share with investor" flows.
- No schema changes, no new edge function, no new component files.
