# Collateral run stopped again: fix the false contrast block, then stop single failures from ending a run

## What the logs show

The regeneration run did not fail broadly. One page failed, repeatedly, and it took the piece down with it:

```text
[collateral qc blocked] guidelines-2-logo
  RENDERER_BUG: a logo specimen was drawn in #21c0ff on #F5F5F5 — too little contrast to be visible.
collateral failed guidelines Error: QUALITY_GATE_FAILED — guidelines-2-logo: RENDERER_BUG ...
```

Copy generation succeeded on every attempt, imagery loaded, and no compute-limit errors appear in this run — the earlier `WORKER_RESOURCE_LIMIT` work is holding. The break is a quality-gate disagreement, plus a blast radius that is far too wide.

### Cause 1 — the renderer and the judge describe the mark differently

`markAt` in `collateral-svg.ts` records one `data-mark-ink` value per specimen, but it picks that value two different ways:

- Recolourable artwork: it reports the **first** fill found in the file.
- Non-recolourable artwork: it reports the **worst-contrast** fill.

The guidelines "Primary — full colour on light" tile asks for the logo as-is on paper. A multi-colour mark passes the renderer's own legibility test because at least one of its fills reads on paper, so no repair is applied — correctly, the mark is visible. But the tile then reports the cyan fill as *the* ink, and `collateral-qc.ts` judges that single value against the 2.4 floor and fails a page that is actually legible.

That is why the reason says `RENDERER_BUG`: the gate is correct that the two disagree, and the disagreement is real, but the page is not broken.

### Cause 2 — one page ends the whole kind

`generateKind` quarantines the slice and throws `QUALITY_GATE_FAILED` if any verdict fails. Nothing from that kind is stored, and there is no repair attempt between the failed verdict and the throw — even though the repair authority (`resolveInk`) already exists and is used elsewhere in the same file.

## The fix

### 1. Report the specimen the way the gate measures it

One rule for both paths: the recorded ink is the fill a reader would struggle with most on that ground, and the specimen additionally records whether *any* fill clears the floor. QC then asks the question it actually means — "is this mark visible on this tile?" — instead of "is every fill in this mark visible?". A two-tone mark with a legible primary shape stops being a failure.

### 2. Repair before gating, never after

When a specimen's worst fill is below the floor and the artwork can be recoloured, `markAt` routes it through `resolveInk` against its ground before drawing, exactly as the reversed and mono tiles already do. Non-recolourable artwork keeps its plate fallback. The gate stays at 2.4 and stays a backstop.

### 3. A failed page fails a page, not a piece

`generateKind` promotes every page that passed and records the failed page as a per-page block with its reason. The kind reports partial completion instead of throwing away good work. Only a kind with zero passing pages counts as failed.

### 4. The run reports itself honestly

The client loop in `collateral.functions.ts` already collects `failed` and `qcIssues` per kind. Surface them in the Brand Studio as a per-piece status list — completed, blocked with reason, retry — so an admin sees "11 of 12 pieces published, guidelines page 2 blocked" rather than a run that "broke".

### 5. Regression coverage for this exact shape

Extend `brand-legibility.test.ts` with multi-fill mark fixtures: two-tone mark on paper, single bright fill on paper, white-only mark on paper, raster mark on light and dark. Each asserts the recorded specimen ink matches what QC will measure, and that a mark with a legible fill is not blocked.

## Technical notes

- `supabase/functions/_shared/collateral-svg.ts` — unify `drawnInk` selection in `markAt` (worst-contrast fill on both branches); add `data-mark-visible` from the any-fill check; apply `resolveInk` when the worst fill fails and the artwork is tintable.
- `supabase/functions/_shared/collateral-qc.ts` — gate on the visibility flag plus the worst-fill ratio; keep the `RENDERER_BUG` class for genuine post-resolution failures.
- `supabase/functions/venture-collateral/index.ts` — promote passing pages, collect per-page blocks, only throw when nothing passed; keep the existing `logGenEvent` outcomes (`blocked` vs `failed`) accurate to that distinction.
- `supabase/functions/_shared/brand-legibility.test.ts` — multi-fill fixture matrix.
- Brand Studio collateral panel — per-piece status and per-page block reasons.

Also worth cleaning while in the Hub: the console shows unmapped asset keys (`brand_guidelines_pdf`, `content_strategy_pillars`, `community_engagement_playbook`, `influencer_partnership_brief`) defaulting to the Action track in `src/lib/asset-tracks.ts`, and duplicate React keys in the generate step list. Neither breaks generation; both are noise that hides real errors.
