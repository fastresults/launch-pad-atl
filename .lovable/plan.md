# Per-page mark selection for multi-page pieces

Today a mark choice is made once per piece (business card, presentation, guidelines) and every page of that piece uses it. That is wrong for multi-page work: a presentation cover wants the full stacked lockup centred, an interior slide wants the small symbol in the corner, a dark section divider wants the inverse. The same is true of the card front vs back and the guidelines cover vs interior.

This adds a named **mark slot** for every place a logo lands, lets an admin choose the mark per slot, and gives each slot an automatic recommendation scored for lockup symmetry.

## What the admin sees

On any multi-page piece, the **Generate** chevron opens a **Marks** panel listing each slot on that piece, for example:

```text
Presentation
  Cover (large, centred, brand ground)      Auto → Stacked · Inverse     [change]
  Section divider (large, dark ground)      Auto → Horizontal · Inverse  [change]
  Running corner (small, light ground)      Auto → Symbol · Colour       [change]
  Closing (large, centred)                  Stacked · Colour             [change]
```

- Every slot defaults to **Auto**, which shows the recommended cell and a one-line reason ("centred hero — stacked reads symmetrical").
- "Change" opens the existing 8-cell form x tone matrix, with unsupplied cells greyed.
- **Apply to all slots** for admins who want one mark everywhere.
- Choices persist per venture and are reused on the next run.
- After generation each page reports the mark it actually carried, and flags any slot that had to be repaired for contrast.

## The symmetry logic

A slot declares its own geometry: box aspect, alignment (centred or edge-anchored), scale (hero or chrome), and ground (light, dark, photographic). Every supplied form x tone cell is scored against it:

- **Aspect fit** — how far the artwork's own ratio is from the slot's box, on a log scale, so a stacked mark is not judged against a horizontal slot's shape.
- **Axis symmetry** — centred slots reward marks with a vertical axis (symbol, stacked); edge-anchored bands reward horizontal lockups.
- **Optical presence** — chrome-scale slots reward the symbol, since a full lockup at running-header size is unreadable.
- **Tone** — inverse art on dark grounds, colour on paper, with the contrast authority already in place as the tiebreak.

The winner and its reason surface in the UI. This is deterministic scoring, not a model call, so it adds no generation latency and is unit-testable; a model pass would put a network round trip inside an already timeout-sensitive worker.

## Technical outline

1. **`supabase/functions/_shared/collateral-marks.ts` (new)** — slot registry per kind (`business_card: front | back`, `presentation: cover | section | running | closing`, `proposal: cover | header | signoff`, `guidelines: cover`, single-page pieces: `primary`), each with geometry metadata, plus `recommendMark(slot, inventory)` returning `{ form, tone, reason, score }` and the ranked runners-up.
2. **`collateral-svg.ts`** — `CollateralCtx.markPick` becomes `markPicks: Record<SlotId, ResolvedPick>`; `markAt` and `markSvgFor` take the slot id; every template call site passes its slot. Specimen and misuse tiles in the guidelines stay hard-wired, as they demonstrate named treatments.
3. **`venture-collateral/index.ts`** — accepts `markChoice[kind].slots`, resolves each slot through the existing fallback ladder, and returns `marks: [{ slot, requested, used, fallback, recoloured, recommended }]`.
4. **Persistence** — `venture_brand_kits.collateral_mark_choice` gains a `slots` object per kind; the current flat shape is read as "same cell for every slot", so existing choices keep working with no migration.
5. **UI** — `CollateralPieceCard.tsx` gains the slot list, the auto row with its reason, and per-slot badges after a run; single-page pieces keep the current one-line control.
6. **Tests** — recommendation scoring per slot archetype, the legacy-shape read path, and slot resolution with a partially supplied logo set.

## Scope

Print and presentation collateral only. Social and ad assets keep their single automatic mark; say the word and the same slot model extends to them next.
