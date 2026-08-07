# Close the gap between the three marks and the ideal

## The critique

The ideal mark (tree + three figures + roots, navy/gold/green roundel) and the three generated marks (gate-with-keyhole, lamp-and-book, café table in filigree) differ on six specific things. None of them are drawing quality — the drawing is fine now. They are art-direction failures.

1. **No people.** The ideal puts three human figures at the centre of the mark; you read "elders, together, sheltered" before you read anything else. All three generated marks depict *props* — a gate, a lamp, a table. Props describe a facility. Figures describe a life. The current pipeline never once requires a human presence in the form.

2. **No second read.** The ideal holds three ideas at once: canopy (shelter), figures (generations), roots (a long life, continuity). Each generated mark holds exactly one literal object. A single object is an icon, not an identity.

3. **The set has no shared law.** Mark 1 and 2 sit in a heavy circular counterform; mark 3 is an open filigree wreath at roughly four times the detail density. Three marks from one studio must share a container rule, a stroke weight and a detail budget, and vary only in subject.

4. **Colour is doing no work.** The ideal assigns roles — navy carries the type and one figure, gold carries the canopy, green carries the roots — so the palette encodes the structure. In the generated marks the dark green swallows 80% of the area and gold appears as a token stroke. There is no dominant/secondary/accent discipline and no focal colour on the subject.

5. **Detail beyond the size budget.** Ruled page lines, the lamp's fringe, and the wreath's scrollwork all close up well before 24px. The silhouette rule is in the prompt but is stated as a test, never as a hard cap on interior strokes.

6. **Register drift.** The ideal is warm, upright, dignified. The generated marks read cosy-boutique — a reading nook and a coffee bar. That is hospitality, not care.

## What changes

### 1. Human presence becomes a requirement, not an option

In the business read, add `human_figures` — how people appear in this business's mark (who, how many, in what relation: a hand supporting an arm, two figures side by side, a figure sheltered). Concepting must use it: at least two of the three concepts must contain a human figure or an unmistakable human gesture. A concept whose subject is only an object is killed.

### 2. Every concept must state a second read

Each concept gains `second_read` — the additional true idea the form carries beyond its literal subject ("roots = a long life"). Concepts with only one read are killed at scoring, alongside the existing `reads_as` gate.

### 3. Set coherence contract

The three render briefs share one generated `set_law` produced once per run: one container rule (contained roundel / open form / anchored baseline — chosen once), one stroke weight, one detail budget, one colour role assignment. All three briefs carry it verbatim, so the set reads as one studio's work.

### 4. Colour roles instead of a palette list

Replace the flat "palette led by X" clause with explicit roles: dominant (structure), secondary (mass), accent (the one focal element, usually the human figure). The accent must land on the subject that carries the meaning, never on decoration.

### 5. A hard detail cap

Replace the descriptive silhouette test with a countable rule: no interior stroke thinner than 1/12 of the mark's width; no repeated texture (ruled lines, hatching, scrollwork, fringe); the mark must survive being filled solid black. Keep the existing 24px test as the closing check.

### 6. Jury adds three criteria

`human_presence`, `second_read`, and `set_coherence` (judged against the run's `set_law`), each requiring 4+. New auto-fail: the mark depicts only an inanimate object with no human figure or gesture, when the business is one people live in or are cared by.

## Technical notes

- `supabase/functions/_shared/logo-business-read.ts` — add `human_figures` to `BusinessProfile`, the prompt, the parser and the profile block.
- `supabase/functions/venture-brand-assets/index.ts` — `generateLogoConcepts`: add `second_read`, the human-figure quota, the object-only kill rule; generate and persist `set_law` on the run so all three briefs share it.
- `supabase/functions/_shared/logo-render-prompt.ts` — colour-role clause replacing `paletteClause`; human-presence line; `set_law` line; countable detail cap replacing the adjectival silhouette paragraph.
- `supabase/functions/_shared/logo-jury.ts` — three new scores, the set-law comparison, the object-only auto-fail.
- `src/components/hub/brand-wizard/BrandWizard.tsx` — show `second_read` beneath the existing meaning line.

No change to the stage sequence, the three-concept limit, the one-inspiration gate, Select/Refine, the archive strip, or approve-then-vectorize.
