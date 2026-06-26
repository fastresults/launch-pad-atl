## Goal
Make Concept Studio and Epiphany Engine feel like two distinct, purposeful steps — not one continuous form — and explain to the founder *why* each exists and *when* to use it.

## Problem today
- Both modules live inside one undifferentiated card on the "Lock your concept" page.
- Epiphany Engine sits visually as a footer banner inside Concept Studio, so founders read it as just another button.
- No narrative explains the relationship: *Concept Studio = tighten what you have. Epiphany Engine = stress-test it with deep AI before you lock.*
- The "Lock concept" CTA shares the Concept Studio card, making Epiphany feel optional/ignorable rather than a deliberate detour.

## Proposed structure

```text
Lock your concept
One last look, then we start writing.

┌─ STEP 1 ─ Concept Studio ──────────── "Sharpen" ──┐
│ Tighten your 50–60 word north-star + value prop.  │
│ Use this when the concept is roughly right and    │
│ you just need to crisp the language.              │
│                                                   │
│ [Concept summary] [Value prop]                    │
│ Refine & innovate: Brainstorm / Push / Red-team   │
└───────────────────────────────────────────────────┘

  ── Optional deep pass ──

┌─ STEP 2 ─ Epiphany Engine ─── "Stress-test" ─ deep ┐  (distinct accent card)
│ Multi-pass AI mines your research, scores 3        │
│ vision-extending ideas on viability + attract-     │
│ iveness. Use this when you want to challenge       │
│ assumptions before locking.                        │
│                                                    │
│ Why it's separate: it rewrites your concept's      │
│ ambition, not just its wording. Takes ~60s.        │
│                                                    │
│ [ Find my epiphany ]                               │
└────────────────────────────────────────────────────┘

  ── Ready? ──

┌─ Lock & continue ─────────────────────────────────┐
│ 0 iterations · concept length OK                  │
│           [ Lock concept ]  [ Continue → ]        │
└───────────────────────────────────────────────────┘
```

## Visual differentiation
- **Concept Studio**: existing neutral card, sparkle icon, "Sharpen" pill.
- **Epiphany Engine**: promoted to its own full card with the amber/violet gradient accent already used for the "deep" badge, lightning icon, "Stress-test" pill, distinct border. Clearly outside the Concept Studio card.
- A short divider label between them ("Optional deep pass") signals they're sequential, not nested.
- **Lock & continue**: pulled into its own slim footer card so the lock action is no longer hiding inside Concept Studio.

## Copy additions (guidance microcopy)
- Concept Studio subhead: "Sharpen the wording of a concept you already believe in."
- Epiphany Engine subhead: "Challenge the concept itself — surface bigger swings you may have missed."
- Tiny "When to use this" line under each header.
- After an Epiphany result is applied, show a one-line trace in Concept Studio: *"Updated from Epiphany Engine · revert"*.

## Implementation scope
Frontend only — `src/components/hub/ConceptStudio.tsx` and its parent on `hub.$snapshotId.tsx`:
1. Extract the Epiphany Engine block out of `ConceptStudio.tsx` into a new sibling component `EpiphanyEngineCard.tsx` rendered after Concept Studio.
2. Extract the lock/iterations footer into a `ConceptLockBar.tsx` rendered after Epiphany.
3. Add step chips ("Step 1 · Sharpen", "Step 2 · Stress-test"), section subheads, and the "When to use this" microcopy.
4. Apply distinct accent treatment to the Epiphany card (gradient border + tinted background using existing semantic tokens — no hardcoded colors).
5. Keep all existing handlers/props intact; this is presentational restructuring.

## Out of scope
- No changes to generation logic, Edge Functions, or DB.
- No changes to the "Brainstorm / Push / Red-team" actions themselves.
