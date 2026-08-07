# Stop social copy from getting cut off

The attached poster shows two separate failures happening at once: the headline text runs past the right edge of the canvas, and the sentence itself ends mid-thought ("...beats an"). Both are fixable in the poster copy + compositor layer, with a QA gate so a clipped poster can never be saved.

## What is going wrong

Confirmed in the code:

1. `_shared/content-ad-svg.ts` — `wrap()` returns `null` whenever a single word is wider than the text column. "Administrator-as-a-Service" is exactly that case. When every size fails, `fitDisplay()` falls back to `wrap(...) ?? [clean]` — one unbroken line at full length, drawn with no width clamp. That is the visible overflow.
2. `_shared/poster-copy.ts` — the fallback distillation (`firstClause`) hard-slices the hook at 60 characters and only trims trailing punctuation. It can stop on a dangling word ("beats an"). The AI path is also character-capped with `slice(0, 60)`, which truncates instead of rewriting.
3. `venture-content-ad/index.ts` — QA records contrast and logo metrics but nothing about whether the type actually fit. A clipped poster passes QA today.

## Fixes

### 1. Copy must always be a complete thought
- Replace the hard `slice()` cap with clause-aware distillation: cut at sentence/clause boundaries only, and if the result ends on an article, preposition, conjunction, or auxiliary verb, drop back to the previous boundary.
- Reject and re-ask the AI once when the returned headline exceeds the budget or ends on a dangling word, instead of silently truncating it.
- Tighten the headline budget per aspect (portrait columns are narrower than square) and express it in words as well as characters.

### 2. Type must always fit the column
- Add hyphen/slash-aware soft breaking in `wrap()` so long compound words ("Administrator-as-a-Service") can split at existing hyphens.
- Character-level break as a last resort for a single token that still exceeds the column.
- Remove the unbounded `?? [clean]` escape hatch. If nothing fits, shrink below the current minimum size and, failing that, drop the last line rather than draw an overflowing one.
- Add a padded safety factor to the width estimate so the estimator's error can only make lines shorter, never wider.

### 3. QA gate blocks clipped posters
- Compositor returns new metrics: `headline_lines`, `headline_fits`, `longest_line_pct` (widest line vs. available column), `copy_truncated`.
- `venture-content-ad` fails QA when `headline_fits` is false, `longest_line_pct` > 100, or the copy layer flagged truncation — and retries once with a shortened headline before saving.
- Metrics surface in the existing asset preview panel alongside the contrast numbers, so a bad run is visible rather than silent.

## Technical notes

Files touched:
- `supabase/functions/_shared/content-ad-svg.ts` — `wrap`, `fitDisplay`, `estWidth`, `PosterMetrics`
- `supabase/functions/_shared/poster-copy.ts` — `firstClause`, `clean`, AI prompt + validation/retry
- `supabase/functions/venture-content-ad/index.ts` — QA assertions and the one shortened-copy retry
- `src/components/hub/ContentStudio.tsx` — show the new fit metrics in the preview

No schema changes; the new values ride inside the existing `qa_notes` JSON.
