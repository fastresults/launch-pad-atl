# Fix stale hero copy in HomeFramework

## Problem
`src/components/home/HomeFramework.tsx` line 76 still says **"Twenty deliverables"**, but the framework was restructured to **34 deliverables across 8 categories** (see `src/lib/framework-deliverables.ts` and the updated grid copy lower in the same file). The hero paragraph contradicts the grid directly below it.

## Change
Replace lines 76–77 paragraph with copy aligned to the current framework:

> One morning. **34 deliverables built live for your startup** — positioning, offer, brand, site, the 90-day plan — and you walk out ready to execute on Monday. $197, yours to keep. **No upsell in the room.**

Leave the second paragraph ("Coffee's on us…") and the proof-point pills unchanged.

## Scope
- Single file edit: `src/components/home/HomeFramework.tsx` (paragraph at lines 76–77).
- No other files reference "Twenty deliverables." Grid section already uses the accurate "34 deliverables across eight categories" copy.
