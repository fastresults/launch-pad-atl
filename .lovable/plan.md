# Operationalize copy audit — kill the duplication, say the specific thing

## What's actually wrong in the screenshot

Three consecutive major moves — "Sharpen the offer", "Set the headline price", "Publish the one-page offer sheet" — carry the **identical two sentences**. That isn't a writing accident, it's how the line is assembled:

- The first sentence comes from a criticality lookup. Every step marked "required to sell" gets the same string: *"You cannot reliably take money until this one is done."*
- The second sentence comes from a keyword match on the step slug. `offer`, `price`, and `offer-sheet` all hit the same rule, so all three print *"offer design and pricing — what the market will actually pay."*

Meanwhile each of those steps already has a specific, well-written line written into the runway data that the collapsed card never shows:

- Set the headline price → *"You cannot sell, invoice, or forecast without a number."*
- Publish the one-page offer sheet → *"It becomes the proposal, the site section, and the DM."*

So the fix isn't new copy — it's showing the copy we already wrote and demoting the generic filler.

## Other duplication on the same card

| Repeated signal | Where it shows | Recommendation |
| --- | --- | --- |
| Ownership stated twice | "Adam's team leads" badge **and** an "Adam's team" chip in the meta row | Drop the meta chip on major moves; the badge already says it |
| "Major move" said three ways | Purple eyebrow + glyph plate + large card + ring | Keep the eyebrow, drop the ring; the card size carries it |
| Criticality said twice | "Needed to sell" chip **and** the sentence that explains the same thing | Chip stays, sentence becomes the step-specific line |
| "Foundation" | Category chip on every row, but the header also says "Foundation complete" meaning delivered assets | Rename the category chip to the lane it belongs to (Offer, Legal, Money…) so it stops colliding with the foundation-complete language |
| Category chip on every row | Every row in a day repeats the same lane | Show once at the day header, not on each row |
| Same vocabulary, two forms | Chip says "Needed to sell", dialog says "Required to sell" | Pick one — "Required to sell" everywhere |

## The copy rules going forward

1. **Specific before generic.** A card shows the step's own reason. Derived boilerplate only appears when a step has no written reason.
2. **Say a thing once per card.** If a badge states it, the sentence doesn't repeat it.
3. **No repeated sentence inside a day.** If a derived line would print twice in the same day, the second one is suppressed.
4. **Agency expertise is named once per day, not per step.** "Where our experience saves you: offer design and pricing" belongs at the day header covering the whole offer block — not stamped on three cards in a row.
5. **The collapsed card answers: what is this, why it can't wait, who's doing it, when.** Everything else lives behind the expand.

## What each card reads like after the change

```text
DAY 2 · Sharpen the offer                    Adam's team leads this day
Where our experience saves you: offer design and pricing —
what the market will actually pay.

  MAJOR MOVE
  Set the headline price
  You cannot sell, invoice, or forecast without a number.
  Required to sell · About an hour · Aug 12

  MAJOR MOVE
  Publish the one-page offer sheet
  It becomes the proposal, the site section, and the DM.
  Required to sell · About an hour · Aug 12
```

## Technical detail

- `src/lib/ops-significance.ts` — `milestoneNote()` becomes a fallback rather than the default; add a `dedupe` helper so a derived line can't render twice within one day group. `agencySkillNote()` moves from per-row use to a day-level summary.
- `src/components/ops/OpsTaskRow.tsx` — collapsed major-move subtitle renders `task.why` (already present on every seeded task) and falls back to `milestoneNote()` only when `why` is empty; remove the owner chip and the `ring-1 ring-primary/10` when the lead badge is shown; hide the category chip when the parent day header already shows the lane.
- `src/components/ops/OpsChecklist.tsx` — day/stage header gains the one-per-day lane label and the single "Where our experience saves you" line, computed from the day's agency-led steps.
- `src/lib/ops-criticality.ts` — collapse `short` to match `label` so the chip and the explainer use the same words.
- Category labels: map the `Foundation` seed category to a founder-facing lane name so it stops reading as the delivered foundation.
- Everything is presentation-layer; no schema change, no edge function change, and the share link inherits it since `ShareOpsRunway` renders the same dashboard.

## Not in scope

No changes to task data, ordering, delivery mode, or the platform add-on. This pass is wording and what each card chooses to show.
