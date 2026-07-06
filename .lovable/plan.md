## Goal

Rename **"The Anderson Method"** → **"The Anderson Framework"** everywhere it appears, and eliminate any sentence that stacks two "method" words back-to-back.

## Why

Two sequential "method"s (e.g., *"The 14-Day Launch Method is The Anderson Method…"*) read as a stutter. Reframing the brand handle as **The Anderson Framework** gives us three phrases with three distinct sounds — Method (offer), Framework (brand/authority), done-with-you (category) — that never collide in a single sentence.

Note: this override applies only to the branded phrase **"The Anderson Framework"**. The existing chatbot guardrail — "framework" as a generic stand-in for the offer is still discouraged — stays intact.

## The three phrases (updated)

| Phrase | Job |
|---|---|
| **The 14-Day Launch Method** | Offer name — what you buy |
| **The Anderson Framework** | Brand / authority handle — whose playbook it is |
| **the done-with-you method replacing accelerators, courses, and raw AI** | Category descriptor / positioning line |

## Files to edit

**Straight rename** — replace `Anderson Method` with `Anderson Framework`:
- `src/routes/webinar.tsx` (line 40)
- `src/routes/services.tsx` (line 45)
- `src/routes/one-on-one.tsx` (line 85)
- `src/routes/build.tsx` (line 21)
- `src/lib/chatbot-knowledge.ts` (lines 201, 207) — also update the guardrail text about never inventing variants (list "Anderson Method," "Adam's Framework," "Anderson system" as banned variants)

**Homepage rewrite (`src/components/home/HomeFramework.tsx`, line 100)** — currently: *"The 14-Day Launch Method is The Anderson Method in one focused morning — the done-with-you playbook…"*  
Rewrite as: *"The 14-Day Launch Method is **The Anderson Framework** in one focused morning — the done-with-you playbook quietly replacing accelerators, courses, and raw AI. The way modern founders skip the year of guessing and land their first paying customer in two weeks. Run live by Adam, the operator who built it. $297 once, yours forever."*

**Chatbot guardrail housekeeping (`src/lib/chatbot-knowledge.ts` line 214)** — the existing line reads: *"The word 'framework' may be used only to describe a component inside the Method (e.g. 'the pricing framework we run in the room') — never as the top-level offer."*  
Add a one-clause exception: *"…never as the top-level offer. The only capitalized exception is the proper-noun brand handle **The Anderson Framework**."*

## What does NOT change

- Meta titles, URL slugs, buttons, pricing labels, agenda headers stay on **The 14-Day Launch Method**.
- The done-with-you positioning tagline stays verbatim.
- Component `HomeFramework.tsx` filename stays (internal identifier, per project memory on framework/template naming).
- Funnel report untouched.
- No visual, layout, or component changes.

## Verification

1. `rg "Anderson Method" src` returns zero hits.
2. `rg "Anderson Framework" src` shows the six placements.
3. Home hero paragraph reads cleanly with no two consecutive "method" words.
4. Chatbot guardrail block reflects the exception.

## Out of scope

- Adding "Anderson Framework" to new locations beyond the current placements.
- Editing pages that don't already use the brand handle (schedule, register, facilitator).
- Renaming the offer or restructuring pages.
