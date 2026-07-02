## Problem

In the ad preview, the headline reads:

> "Within five years of the final whistle, nearly 80% of professional athletes face a financial or"

It cuts off mid-clause at "financial or". The SVG compositor already supports 4-line tiered rendering, but two upstream stages are chopping the text before it ever reaches the compositor:

1. `content-ad-director.ts` → `HEADLINE_CAP = { "1:1": 100, "4:5": 110, "9:16": 120 }` word-safely trims the hook to ~100 chars for square ads. That is why the sentence dies at "financial or".
2. `venture-parse-content-calendar` prompt asks for a `hook` with no length/line target, so the LLM writes hooks that only comfortably render as 2 lines. When a longer, more compelling hook comes through, it gets truncated at step 1.

## Fix

### 1. Raise the director caps so full sentences survive (`supabase/functions/_shared/content-ad-director.ts`)
- `HEADLINE_CAP` → `{ "1:1": 180, "4:5": 200, "9:16": 220 }` (roughly the char budget of 4 full lines at the compositor's min font size).
- Keep `truncateHeadline` as the safety net for pathological cases; with the new caps, real hooks will pass through untouched.

### 2. Tune the SVG tiering so it actually reaches for 4 lines (`supabase/functions/_shared/content-ad-svg.ts`)
- `targetLinesForLength` thresholds: `≤28→1`, `≤60→2`, `≤110→3`, `else→4` (was `≤28/≤55/≤90/else`). The current headline (~110 chars) will now start at tier 4 instead of walking up from 3.
- `sizeRangeForTier(4)` min font: drop from `32*s` to `28*s` so 4 lines of ~45 chars each fit inside the top band without emergency shrink.
- `maxBandPct("1:1")`: `0.42 → 0.46` so tier-4 has room without crowding the image.

### 3. Prompt the calendar to write 4-line-ready hooks (`supabase/functions/venture-parse-content-calendar/index.ts`)
Update the JSON-return instruction and field description so the LLM aims for the full band:
- Add explicit length guidance: "`hook`: 120–170 characters, one complete sentence or two tight clauses. Written to occupy 4 lines on a square ad — do not truncate, do not end mid-clause."
- Add a hard rule: "Never end a hook with a dangling conjunction ('and', 'or', 'but', 'because'). Complete the thought."

### 4. Regenerate note in the UI (`RegenerateAssetDialog.tsx`)
The "Headline on image" custom-override input currently reads the truncated hook back. After the cap change, seed the input with the untruncated `post.hook` so founders see and can edit the full sentence.

## Verification

- Re-open the affected asset → Regenerate with no changes → headline renders 4 lines ending in a period, no "financial or" cutoff.
- Regenerate on a short (~40 char) hook → still renders 1–2 lines large.
- Regenerate on a 9:16 story → tier picks up to 5 lines when needed.

No DB migrations, no new dependencies.