# Deepen the copy the Website PRD writes

The imagery side is now strictly specified; the *words* are not. Three verified causes in `_shared/deliverable-prompts.ts`:

1. **The copy instruction is one line.** Section 4 asks for "H1/H2/H3, sub-headline, 1–2 body paragraphs, bullets, microcopy, button labels" per section. No word floors, no per-section-type recipes, no rules about specificity — so the model writes two short generic sentences and moves on.
2. **The word budget is too small for the route list.** Section 2 mandates ~13 routes. The total target is 2,800–3,800 words *including* Sections 1–3 and 5–8 and a 1,800–2,400 word master prompt. That leaves roughly 100 words of real page copy per route — structurally impossible to write deep copy inside.
3. **Nothing enforces copy depth.** `_shared/identity-guard.ts` checks name, logo, imagery rows, exposure columns, portrait recipe and archetype. There is no check for thin page copy, so a shallow draft passes the gate and is persisted.

Token budget is not the constraint: both generators already allow 24,000 output tokens for a PRD (~18,000 words), against a current target of roughly 6,000.

## The fix

### 1. A copy craft contract — new `_shared/copy-craft.ts`
The same treatment imagery got, for words. Per section-type recipes the prompt injects verbatim:

- **hero** — H1 ≤ 10 words naming the outcome, subhead 20–35 words naming audience + mechanism + proof, 40–70 word body, two CTA labels with verbs.
- **problem / stakes** — 90–140 words written in the customer's own language, with a named cost of inaction.
- **offer / feature card** — each card: label, 12–18 word benefit line, 45–80 word body saying what it *is* and what changes.
- **process step** — per step: what happens, what the customer does, what they get, how long it takes.
- **proof / results** — a real metric with context, not a bare number.
- **pricing tier** — who it's for, what's included as full sentences, what's excluded, the guarantee line, objection handled inline.
- **FAQ answer** — 60–110 words each, answering the objection behind the question, minimum 8 questions.
- **case study** — situation, intervention, result, quote — 350–500 words total.
- **blog launch post** — 700–1,000 words with a real argument, not an announcement.
- **about** — founder narrative with specifics: origin, belief, credential, what they refuse to do.

Each recipe carries a word floor, a specificity rule (name the audience, the number, the timeframe, the artifact), and a never-do list: no "empower", "seamless", "unlock", "elevate", "solutions", "cutting-edge"; no sentence that would be true of any competitor; no CTA reading "Learn more" or "Get started".

### 2. Rewrite the copy sections of the PRD prompt
In `_shared/deliverable-prompts.ts`:

- Raise the PRD target to **6,000–8,500 words**, with Section 4 alone at 3,500+ and the master prompt still 1,800–2,400. State explicitly that Section 4 is the longest section in the document.
- Replace the single "Full copy per section" bullet with the injected copy contract, plus a per-route word floor table (Home 900+, /about 600+, service detail 550+, /pricing 600+, case study 400+, blog post 700+, /faq 700+, others 300+).
- Add a **Voice calibration** block to Section 1: three sentences written *in the brand voice* that the rest of the document must match, derived from the brand kit's voice rules and banned words.
- Add to Section 8 a copy contract subsection restating the word floors so the builder cannot summarise the copy back down.

### 3. Guarantee the length with a copy expansion pass
`_shared/website-prd.ts` already has `expandWebsitePrdMasterPrompt` for a short master prompt. Add a sibling `expandWebsitePrdPageCopy`: when Section 4 lands under its floor, re-run Section 4 alone on the Pro model with the copy contract and the existing route list, then splice the deepened Section 4 back into the document. Runs at most once, same 180s timeout.

### 4. Enforce it in the guard
Extend `checkIdentity` in `_shared/identity-guard.ts` with copy checks and matching correction text:

- `copyThin` — Section 4 word count below floor, or any route subsection under 250 words.
- `copyGeneric` — banned-phrase hits above a small threshold, or fewer than N sentences containing a concrete number/name/timeframe.
- `faqThin` — fewer than 8 FAQ answers, or a mean answer under 50 words.

Failures trigger the existing single corrective regeneration.

## Technical notes

Files touched: new `supabase/functions/_shared/copy-craft.ts`; edits to `_shared/deliverable-prompts.ts`, `_shared/website-prd.ts`, `_shared/identity-guard.ts`, and the two call sites `venture-generate-document/index.ts` and `venture-bulk-generate/index.ts` (pass copy thresholds, wire the expansion pass).

No schema or UI changes. Generation gets slower and more expensive per PRD (longer output, occasional extra Section 4 pass). Verification is regenerating a PRD for an existing venture and confirming total words, Section 4 words, per-route floors, FAQ count and absence of banned filler.
