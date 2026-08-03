## Goal

Today the snapshot modal only reads the idea as a metro Atlanta play. Many ideas (SaaS, e-commerce, digital products, wholesale, creator businesses) have regional, national, or international reach — the snapshot should say so and factor that upside into the potential.

## What changes

**1. The AI routine (`supabase/functions/atlanta-viability/index.ts`)**

Add a `reach` object to the JSON contract, placed right after `verdict`:

```text
"reach": {
  "tier": "local" | "regional" | "national" | "international",
  "headline": string,   // e.g. "Starts in Atlanta, sells nationwide"
  "why": string,        // 1 sentence on what makes it travel (or stay local)
  "beyond_atlanta": string,  // what the ceiling looks like past metro Atlanta
  "expansion_move": string   // the one first step that opens the wider market
}
```

Prompt rules added:
- Judge reach honestly — a mobile grooming van is local and should stay labeled local; a niche SaaS or Etsy product line is national/international. Do not inflate.
- Keep Atlanta as the starting point and the credibility anchor: Atlanta is where it gets built and proven first, reach is the ceiling beyond it.
- Where reach is beyond local, the `economics.steady_state` range and `basis` must reflect the broader market, not just metro demand — and `basis` states which market the range assumes.
- Add one of the 3 `signals` for non-local ideas covering where demand sits outside metro Atlanta.
- Keep the same no-invented-stats, ranges-not-promises, "startup" / "assets" language rules.
- Raise the output budget slightly (~1400 chars) to fit the new block.

**2. The modal (`src/components/home/IdeaSnapshotModal.tsx`)**

- Extend the `Snapshot` type with the `reach` shape.
- Add a compact **Reach** card between the verdict and the money panel: a tier pill (Local / Regional / National / International) with a matching globe/map icon, the headline in emphasis, then `why` and `beyond_atlanta` as short lines, and `expansion_move` as a single "first move that opens it up" line.
- Skeleton the card while streaming, same treatment as the money panel, so it doesn't pop in.
- When the tier is `local`, the card reads as a strength ("This one wins locally — here's why that's fine"), not a limitation, and hides the expansion line.
- Update the pinned header label from a hard-coded "Metro Atlanta read" to "Metro Atlanta read" for local and "Atlanta start · <Tier> reach" once a non-local tier streams in.

**3. Copy guardrails**

Nothing in the new copy calls the offer a plan/blueprint/roadmap; language stays "startup" and "assets" per the project copy standards.

## Technical notes

- The edge function streams SSE straight through, and the modal parses partial JSON — placing `reach` early in the key order means it renders before the money panel finishes, keeping the progressive reveal snappy.
- No database or schema changes; nothing persisted.
- The cached snapshot map keys on the idea string, so existing session caches simply refill with the new shape.
