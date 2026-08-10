# Presentation Master — Tier-One Overhaul

The deck master is currently four slides (cover, section, three-card content, closing) with several fixed-percentage baselines (`H * 0.62`, `H * 0.46`, `H * 0.17`) and only three copy fields. That's why it reads thin next to the new 8-page brand guidelines. Same treatment as the guidelines: real measured layout, a fuller page set, correct logo-for-background, and the quality gate enforced.

## 1. Expand the master to 10 slides

| # | Slide | Purpose |
|---|-------|---------|
| 01 | Cover | Mark, company, tagline, date/year |
| 02 | Section divider | Numbered chapter break |
| 03 | Agenda / contents | 4-6 numbered rows, measured stack |
| 04 | Statement slide | One large pull-quote sized to fit |
| 05 | Three-column content | Existing card grid, kept |
| 06 | Two-column text + image well | Copy left, image/placeholder plate right |
| 07 | Data slide | 3 stat blocks (figure, label, footnote) |
| 08 | Timeline / process | 4 measured steps on a rule |
| 09 | Quote / testimonial | Attributed quote, mark reversed |
| 10 | Closing | Thank-you, contact line, mark |

Every slide gets the same running chrome: slide-number folio, company footer, and a mark placed in the safe corner.

## 2. Measured layout, no guessed baselines

Replace percentage-of-height baselines with `T.flow()` measured stacks (the same typesetter cursor used for the guidelines and invoice fixes) for all headline/subhead/body groups, agenda rows, stat blocks and timeline steps. Panels and cards size from the tallest measured child, clamped to the safe area, so short copy no longer leaves dead space and long copy no longer collides.

## 3. Right logo for the right background

Slides 04, 09 and 10 use dark grounds. Route every mark through the existing luminance path so the reversed/mono-white variant is used on dark surfaces and the untintable-raster plate fallback applies. No invisible knockouts.

## 4. Richer specimen copy

Extend the deck copy schema in `collateral-copy.ts` from `{section, sectionSub, points[3], closing}` to also produce: agenda items, a statement line, three stats with labels, four timeline steps, and a quote with attribution — all venture-specific, brand-voice-driven, with sane length caps and non-placeholder fallbacks.

## 5. Quality gate

Extend `collateral-qc.ts` coverage to the deck: type floor per slide spec, zero text overlaps, and contrast check on every mark specimen against its tile. A failing slide blocks publication of the deck (same quarantine/promote behaviour as the guidelines) rather than shipping a broken master.

## Technical notes

- `supabase/functions/_shared/collateral-svg.ts` — rewrite `presentation()`; add slide specs to the spec resolver for the six new slide names.
- `supabase/functions/_shared/collateral-copy.ts` — widen the deck JSON schema, sanitizers, and fallbacks.
- `supabase/functions/_shared/collateral-qc.ts` — multi-specimen contrast + overlap checks already exist; wire deck slides into them.
- Local render test across all 10 slides (zero overlaps, type at/above floor, all marks passing contrast) before redeploying `venture-collateral`.
- Regeneration sweep already deletes superseded rows/objects, so old 4-slide decks are replaced cleanly.
