# French tricolour palette + moodboard for The Friendship House

Re-base the brand kit on the French flag — bleu, blanc, rouge — and rebuild the mood board and logo art direction against it.

## Where things stand

The kit for this venture is `status: auto`, step 3, with a derived palette called "Franco-American Unity" (`primary #0A2463`, `secondary #C8A2C8` lilac, `accent #E63946`, `bg #F5F5F5`) and 9 mood board tiles generated from it. Typography is locked-feeling and stays: Montserrat 700 headings, Lora 400 body. Nothing is `locked`, so the palette can be replaced without breaking a lock.

## 1. New palette — "Tricolore"

Official flag values, adapted so text pairings still pass WCAG AA:

| Token | Hex | Role |
| --- | --- | --- |
| `primary` | `#0055A4` | Bleu — headlines, primary buttons, nav |
| `onPrimary` | `#FFFFFF` | |
| `secondary` | `#002654` | Deep navy bleu (flag blue darkened) — institutional surfaces, footers |
| `onSecondary` | `#FFFFFF` | |
| `accent` | `#EF4135` | Rouge — critical actions and callouts only |
| `onAccent` | `#FFFFFF` | |
| `bg` | `#FFFFFF` | Blanc — the third stripe carries the whole surface |
| `surface` | `#F4F6F9` | Cool off-white for panels, so blanc stays a brand colour |
| `fg` | `#1A1D23` | |
| `muted` | `#5A6472` | |
| `border` | `#DCE1E8` | |

Contrast notes to enforce, not assume: `#EF4135` on white is ~3.7:1, so rouge is never used for body copy or small text — only fills, rules and icons, with white text on top. Same discipline for `#0055A4` as a fill. The existing contrast-audit step re-runs and records the pairings.

The lilac `#C8A2C8` is retired — it is the one colour pulling the identity away from the flag.

## 2. Mood board rebuild (9 tiles)

Regenerate all 9 tiles with an art direction that reads as French civic warmth, not flag clip-art:

- Château-Thierry stone façades, shutters, a French doorway and its numberplate
- A tricolour on a mairie in flat morning light — one tile only, never five
- Café table, shared meal, mixed French/American company
- Prefecture paperwork and stamps shot beautifully, not bureaucratically
- Blue-white-red as *material* — enamel plaque, painted shutter, linen — rather than as a flag
- One abstract tile: the three stripes as a spatial device (threshold, corridor, banner edge)

Guardrails written into the direction: no Eiffel Tower, no berets or baguettes, no waving-flag stock, no US/FR flag mashups, no gradients. Tiles must sample the exact three hexes.

## 3. Logo art direction, revised to the tricolour

The earlier direction assumed terracotta and sage. Rewrite it around bleu/blanc/rouge:

- Metaphor stays **the threshold** — a house/door form; the tricolour supplies the ink, not the idea.
- Two-ink rule: bleu + rouge on white, with the white stripe read as *counterform* inside the mark (the "blanc" is negative space, not a printed colour).
- Reductions specified: one-ink bleu, one-ink black, knockout white on `#002654`.
- Explicit ban on literally drawing the flag or a flag-in-a-house.
- Lockup: Montserrat 700 wordmark, tightened tracking, "The Friendship House" always in full; clear space and 150px / 1.5in minimums carried over from the existing guidelines.

## 4. Documents that must follow

`brand_guidelines_pdf`, `brand_strategy_framework` and `brand_voice_tone_guide` all name `#0A2463` / `#E63946` / Franco-American Unity in prose. These get regenerated so the written brand and the stored tokens agree — otherwise every downstream asset (collateral, website brief, ads) re-inherits the old hexes.

## Technical notes

- Update `venture_brand_kits.palette` for snapshot `0ca32be1…`: new `colors`, `name: "Tricolore"`, `rationale`, `source: "user-directed"`, and re-run the contrast audit so `palette.contrast.pairings` is truthful.
- Trigger the existing mood board regeneration path (`venture-brand-wizard` / `useMoodboard`) with the tricolour art direction so all 9 tiles are re-rendered.
- Regenerate the three brand documents through the normal document pipeline once the palette is saved.
- Write the revised logo brief to `.lovable/art-direction/friendship-house-logo.md`.

No schema changes, no UI changes.
