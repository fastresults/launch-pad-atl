# Why the collateral isn't informed by the venture — and the fix

## What I found

I traced the generation path for the brand collateral and presentation master and checked the actual venture record (The Athletes Prayer Foundation). The venture brain is rich — problem, solution, customer, four differentiators, six market facts, and real numbers ($485k year-one target, $750k seed ask, 1,500 athletes). The deck does not use almost any of it. Three concrete reasons:

**1. The copy writer is fed a thin slice of the brain.**
The collateral copy step passes only company, tagline, one-liner, problem, solution, customer, and four differentiators. It never passes `market_facts`, `known_numbers`, `business_model_summary`, `banned_assumptions`, the snapshot's concept summary / value proposition / differentiation statement, the founder-uploaded source materials, or the intake brief. So the model writes from a paragraph when a full dossier exists.

**2. Real numbers are explicitly thrown away.**
The prompt tells the model to return "—" for any figure it wasn't given — and no figures are given. That's why the numbers slide reads "Add your figure" three times while the brain holds three defensible numbers.

**3. Every template silently falls back to placeholder text when the copy call fails.**
The copy call has no logging, no hard retry, and returns `null` on any error. On `null`, the templates draw canned lines — "Where we are today", "Point headline", "Supporting detail…", "Week 1 / Get the offer and the page live", "Add your figure". The quality gate checks overlaps and contrast but has no idea these strings are placeholders, so a fully generic deck passes QC and publishes.

**4. No venture imagery is ever placed.** The split slide draws an empty tinted rectangle labelled "Image". Mood board tiles, hero art, and portraits that already exist for this venture are never referenced by any collateral page.

## The fix

### A. Feed the whole dossier
Extend the copy input to carry the full brain (market facts, known numbers, business model, banned assumptions), the snapshot's concept/value-prop/differentiation lines, industry and location, and short excerpts from founder-uploaded source materials. Pass the banned assumptions as hard "never claim" rules.

### B. Use the real numbers
Hand the known numbers to the stats slide as candidate figures with their labels. "—" stays as the fallback only when the venture genuinely has no numbers — not as the default.

### C. Placeholder text becomes a build failure
- Log every copy attempt (fields received, model, ok/fail, reason). Right now a silent failure is invisible in logs.
- Retry the copy call (second attempt, stronger model) before giving up.
- Add a placeholder scan to the existing quality gate: a known set of canned strings, plus the "—" stat pattern, fail the run with a clear reason instead of publishing a generic deck. If the copy step cannot produce venture-specific text, the founder sees "couldn't write your deck copy — retry" rather than a Lorem-grade deck.

### D. Put the venture's own imagery on the slides
Load approved mood board / hero imagery for the snapshot and place it in the split slide's image well, the cover, and the section divider (luminance-aware, using the same dark/light logo rules already in place). When no imagery exists, draw an art-directed graphic panel built from the brand palette and motif — never a grey box labelled "Image".

### E. Apply the same treatment across all collateral
Proposal scope lines, invoice terms, notecard, and guideline voice pages come from the same copy call, so they inherit the same thin input and the same silent-failure path. All four benefit from A–C with no extra work.

## Technical notes

- `supabase/functions/_shared/collateral-copy.ts` — widen the input type and prompt; add retry, logging, and a numbers channel.
- `supabase/functions/venture-collateral/index.ts` — build the copy input from the full `loadVentureContext` result (brain + snap + brief + sources), not seven fields; load venture imagery for the compositor.
- `supabase/functions/_shared/collateral-svg.ts` — image well accepts real artwork; placeholder fallbacks tagged so the gate can detect them.
- `supabase/functions/_shared/collateral-qc.ts` — add the placeholder-copy check to the existing `QUALITY_GATE_FAILED` path.
- Verify by regenerating the presentation master and guidelines for this venture and confirming the slides carry its actual facts and figures.
