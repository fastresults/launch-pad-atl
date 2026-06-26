
# Facilitator decks — Strategy through Social & Content

Author seven new decks that mirror the Foundation deck's rhythm and polish, one stage per turn so you can review each before the next. Every deck stays editable from `/admin/decks/:slug` via the existing slot system — no new infrastructure.

## Sequence (one per turn)

1. Strategy (5 deliverables)
2. Operations (4)
3. Finance (5)
4. Governance (3)
5. Brand — bonus (5)
6. Marketing — bonus (1, adapted pattern)
7. Social & Content — bonus (7)

After each deck lands, the next one becomes the active turn. You can pause, redirect, or request edits at any boundary.

## Deck blueprint (per stage)

Each deck = 10 slides (Marketing collapses to 8 because it has one deliverable). Same `SlideLayout`, same kicker pattern (`NN · STAGE NAME`), same dark cover + dark recap bookends, every text/image wrapped in `SlotText` / `SlotImage` so admins can edit.

```text
1.  Cover (dark)              — stage number, name, one-sentence promise, hero image slot
2.  Why this stage exists     — the stakes; what compounds if you nail it
3.  What breaks without it    — 3 destructive-tone cards (stage-specific failure modes)
4.  What good looks like      — 3–4 plain-language questions a founder can now answer
5.  The N deliverables        — grid of all items in the stage with icons from framework
6.  Deliverable 1 detail      — uses existing DeliverableSlide
7.  Deliverable 2 detail
8.  Deliverable 3 detail
9.  Deliverable N detail      — slides 6..(5+N), pageLabel auto-counts
10. Recap + what's next (dark)— hands off to the next stage by name
```

Marketing variant (1 deliverable): cover, stakes, what breaks, what good, the deliverable detail (full slide), a "what your site must do" companion slide, recap → 7 slides. Final deck still ends in the dark recap pointing to Social & Content.

## Stage-specific content

For each stage I'll write fresh, workshop-grade copy in the same voice as Foundation — founder-friendly, concrete, no jargon, Atlanta/Main-Street aware. Specifically per stage:

- **Strategy** — failure modes: random marketing, copycat positioning, no GTM sequence. Good = can name buyer, wedge, first 90-day motion, one-line brand promise.
- **Operations** — failure modes: hero-mode delivery, no repeatable sale, marketing as guesswork. Good = workflow a hire can run, repeatable close, channel mix with ROI.
- **Finance** — failure modes: cash surprises, mispriced unit economics, wrong capital source. Good = defensible P&L, payback math, funding plan, bank-ready budget, pitch spine.
- **Governance** — failure modes: wrong entity, uninsured risk, no accountability. Good = entity + contracts set, risks mapped, advisor cadence.
- **Brand** — failure modes: logo without strategy, inconsistent voice, redo loop. Good = strategy → messaging → visual → voice → guidelines that anyone can apply.
- **Marketing** — failure modes: $20K agency quotes, vaporware sites, copy that doesn't convert. Good = PRD an AI builder can ship in a weekend.
- **Social & Content** — failure modes: random posting, stale profiles, paid spend with no payback. Good = audited presence, pillars, 90-day calendar, launch kit, community + partnerships + paid starter.

The "what breaks" and "what good looks like" copy lives co-located inside each stage's slide file (small `STAGE_BREAKS` / `STAGE_QUESTIONS` arrays) so each deck is self-contained and easy to edit. No changes to `framework-deliverables.ts`.

## Wiring

- Add `src/components/workshop-slides/slides/strategy.tsx` (this turn) exporting `strategySlides: Slide[]`.
- Register in `registry.ts`: `strategy: strategySlides`. The existing slug map already expects it, so the deck flips to `available: true` and the workflow page unlocks it once Foundation is complete.
- Repeat per turn for `operations.tsx`, `finance.tsx`, `governance.tsx`, `brand.tsx`, `marketing.tsx`, `social-and-content.tsx`.

## Out of scope

- No schema or edge-function changes.
- No edits to the admin editor, DeckDialog, or slot system — they already handle any new deck the moment it's registered.
- No regeneration of Foundation's content.

## This turn delivers

Strategy deck (10 slides) + registry entry. Review it in the modal at `/dashboard/workflow` → Strategy → "Open facilitator deck", then say "next" (or give edits) and I'll build Operations.
