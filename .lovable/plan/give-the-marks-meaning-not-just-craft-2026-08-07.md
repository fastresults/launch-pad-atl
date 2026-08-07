# Give the marks meaning, not just craft

The last run finally produced clean, well-drawn, on-palette shapes — an infinity ribbon, a leaf-book, a spiral. The craft rules worked. But all three are decorative abstractions: swap the colours and any of them could belong to a yoga studio, a consultancy, or a crypto fund. Nothing in them says elderly residence, family, care, or a life lived long.

The inspiration marks the founder uploaded do the opposite: figures gathered around a tree carries roots, growth, generations, shelter — all at once. That is what is missing. Purpose.

## Root cause

The pipeline currently optimises for two things: structural craft (fusion, curve quality, silhouette) and category relevance (a loose "does this relate to the business" score). Neither forces the mark to be *about something human*. The concepting stage draws from a `symbol_vocabulary` list of nouns from the trade, and the render prompt happily accepts "an integrated abstract symbol" as its subject. Abstraction is allowed to be the default, so the model — which finds abstraction easiest — always picks it.

## What changes

### 1. Read the human truth, not just the trade

The business read stage currently reports category, customer, register and symbol nouns. Add three fields that name the emotional stakes:

- `human_truth` — what is actually happening in a customer's life at the moment of need (a family deciding where a parent will spend their last years).
- `emotional_promise` — what the business promises that person (dignity, continuity, not being alone).
- `meaning_symbols` — 4-6 symbols that *carry* that truth, each stated as symbol plus the meaning it holds ("tree = roots, generations, shelter, long life"), not as a bare noun.

These are what the concepting stage will draw from, replacing the flat noun list as the primary source.

### 2. Concepting must state the meaning before the shape

Each surviving direction gains two required fields:

- `meaning` — one sentence: what this mark *means*, in human terms, to someone who sees it.
- `reads_as` — the literal subject a stranger would name on sight ("people sheltered under a tree"), with `"nothing recognisable"` as an explicit failure value.

Add a hard rule to the concepting brief: at least two of the three directions must be representational or semi-representational — a recognisable subject, stylised. Pure abstraction is allowed for at most one direction, and only when it carries an explicit second read. Any candidate whose `reads_as` is a shape description rather than a subject is killed before the survivors are returned.

Add `meaning_depth` to the internal scoring step (does it hold more than one true idea at once — the way the tree holds roots, growth, and shelter).

### 3. Render brief names the subject, not "a symbol"

In the emblem sentence, the subject clause is currently allowed to fall back to "a single integrated abstract symbol". Replace that fallback: the subject is always the concept's `reads_as` — a nameable thing. Add a short meaning line after the emblem sentence stating what the mark must communicate emotionally, and a rule that the mark must be recognisable as its subject at a glance, without explanation.

Keep every existing craft rule exactly as it is — fusion, exact shape count, curve quality, no decoration, silhouette test, no lettering. The craft is working; meaning gets layered on top of it, not traded against it.

### 4. Jury adds the naming test

Two new criteria, scored like the rest and requiring 4+:

- `meaning_read` — does the mark carry a human idea, or is it decoration?
- `subject_legibility` — name what you see in three words without being told. If the honest answer is "an abstract shape", score 1.

New auto-fail: if the mark would work unchanged for a business in an unrelated sector, it fails regardless of craft scores.

The jury's correction note stays a single imperative sentence driving one re-render, unchanged.

## Technical notes

- `supabase/functions/_shared/logo-business-read.ts` — add `human_truth`, `emotional_promise`, `meaning_symbols` to `BusinessProfile`, the prompt, the parser and `businessProfileBlock`.
- `supabase/functions/venture-brand-assets/index.ts` — `generateLogoConcepts`: add `meaning` and `reads_as` to the JSON contract, the representational quota rule, and the `meaning_depth` score; persist both fields on `brand_logo_directions.concept`.
- `supabase/functions/_shared/logo-render-prompt.ts` — subject resolved from `reads_as`; new meaning line; drop the abstract fallback.
- `supabase/functions/_shared/logo-jury.ts` — two new scores, the naming test wording, the cross-sector auto-fail.
- `src/components/hub/brand-wizard/BrandWizard.tsx` — show each concept's `meaning` line under its name so the founder can judge intent, not just shape.

No change to the stage sequence, the three-concept limit, the inspiration gate, Select/Refine, the archive strip, or the approve-then-vectorize flow.
