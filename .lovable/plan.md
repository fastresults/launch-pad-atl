## Problem

Headline is being truncated with "…" (see `"…for a local service brand in 10…"`) because `fitHeadline()` in `content-ad-svg.ts` falls back to `truncateWords()` candidates when the full string won't fit at the min font size. That's the wrong behavior — long titles should shrink and wrap to more lines, never lose words.

## Root cause

In `supabase/functions/_shared/content-ad-svg.ts`:

```ts
const candidates = [clean, truncateWords(clean, 86), truncateWords(clean, 68), ...];
for (const candidate of candidates) { ... }
```

If the full string fails at `minSize` (34px) inside the 3-line cap on 1:1, the loop silently swaps in a truncated string. Combined with the tight `headlineBandPct` (0.24 of H) and `textH = bandH * 0.66`, medium-long titles hit the truncation path.

Also, upstream in `venture-content-ad/index.ts` / `content-ad-director.ts`, the headline is passed through without any length-tier logic, so the SVG layer is the only thing deciding layout.

## Fix plan

### 1. `content-ad-svg.ts` — never truncate, always fit

Replace the "shrink then truncate" strategy with a length-tiered "line count + size" strategy:

- **Classify by character length** (spaces included):
  - `≤ 28` chars → target **1 line**, larger size range
  - `29–55` chars → target **2 lines**
  - `56–90` chars → target **3 lines**
  - `> 90` chars → target **4 lines** (allow on 1:1 and 4:5 too, not just 9:16)
- **Expand `headlineBandPct` dynamically** to fit the required line count: base band % + `(targetLines - 2) * 0.04`, capped at 0.38 of H. This grows the band for longer titles instead of squeezing text.
- **Font-size ranges per tier** (auto-fit inside tier, don't jump tiers early):
  - 1 line: 72–96
  - 2 lines: 56–80
  - 3 lines: 44–64
  - 4 lines: 34–52
- **Remove `truncateWords()` fallback entirely.** Wrap loop shrinks size until the full string fits at the tier's line count. If it still overflows at the tier's min size, escalate to the next tier (more lines + smaller size) rather than truncating.
- **Absolute last resort** (only if 4 lines at 34px still won't fit — e.g. one word longer than the canvas): shrink below tier min down to 28px before giving up. Never insert "…".

### 2. `content-ad-director.ts` (or wherever the headline is picked) — cap author-side length

Add a soft cap so titles picked for image overlays stay ≤ ~100 chars. If a source title (from calendar/pillars) exceeds 100 chars, prefer a shorter derived form (subhead, first sentence, or trimmed at a clause boundary — comma/em-dash/colon), but **do not** append "…". This keeps the SVG layer from ever needing tier 4 emergency fallback.

### 3. Aspect-aware maxLines

Update `maxLines()` to return the tier ceiling for the aspect:
- `9:16` → up to 5 (tall canvas)
- `4:5` → up to 4
- `1:1` → up to 4

### 4. Verification

Regenerate three test posts covering short (`"Founder mistake #1"`), medium (`"How we found a market gap for a local service brand"`), and long (`"How we found a market gap for a local service brand in 10 minutes using a free tool"`). Each should render the full title, no ellipsis, band height adapting to line count.

## Files

- `supabase/functions/_shared/content-ad-svg.ts` — replace `fitHeadline`, `maxLines`, `headlineBandPct`; delete `truncateWords` usage.
- `supabase/functions/_shared/content-ad-director.ts` — add ≤100-char sanitizer for the overlay headline field.
- Redeploy `venture-content-ad`.
