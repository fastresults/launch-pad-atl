# Higgsfield-Led Logo Concepts + Brand-Infused Website PRD

Two connected pieces of work:

1. Replace the "AI draws SVG from scratch" concept step with **Higgsfield image renders first, then vectorize** — so the four concepts look art-directed before any vector math happens.
2. Add an **Update Website PRD** action that bakes the finished brand (logo, colors, type, moodboard) into the PRD so a pasted prompt builds an on-brand site with a working logo URL.

## Part 1 — Higgsfield-first logo concepts

### How the flow changes

```text
BEFORE:  strategy -> 4 concept briefs -> AI writes SVG primitives -> critique -> retry
AFTER:   strategy -> 4 concept briefs -> HIGGSFIELD renders each mark (raster)
                                       -> jury picks/approves the render
                                       -> vectorize render into clean SVG
                                       -> critique vs. the render -> retry
```

Each of the four concepts becomes a real designed image first. The vector step's job changes from "invent a mark" to "faithfully reproduce this approved mark as clean paths," which is a much easier job and is where the current output falls apart.

### Steps

1. **Credentials.** Higgsfield is not in Lovable's connector catalog, so it is a direct API integration. I'll request `HIGGSFIELD_API_KEY` and `HIGGSFIELD_API_SECRET` as backend secrets (headers `hf-api-key` / `hf-secret`).

2. **Shared client** (`_shared/higgsfield.ts`): submit a Soul text2image job, poll `/requests/{id}/status` with timeout + backoff, return image URLs. Surfaces the provider's real status/body on failure (no generic 500s). Includes a lightweight capability probe so an unavailable model or expired plan reports a clear message instead of a silent retry loop.

3. **Logo render prompt builder** (`_shared/logo-render-prompt.ts`): converts each concept brief into a Higgsfield prompt that carries the human truth, craft move, brand palette hexes, and moodboard direction — with hard constraints for logo work: flat vector-style mark, solid background, single centered symbol, no mockups, no 3D, no text/lettering in the image, no drop shadows or gradients.

4. **New pipeline stage `render_concept`** in `venture-brand-assets`, inserted into the existing job ledger between concept briefs and `develop_vector`. It writes the raster to the brand assets bucket, stores its path on the direction row, and moves the row forward. Timeouts, leases, and the existing retry engine work unchanged because it is just another atomic stage.

5. **Vectorize stage** replaces the freehand draw: the approved render is passed as vision input to the vector model with the instruction to trace it — same `logo-geometry` primitives, same construction contract, but now anchored to a target image. The critique pass compares the SVG against its source render and fails on drift, so retries converge instead of wandering.

6. **Fallback.** If Higgsfield is unreachable or the account lacks model access, the direction falls back to today's draw-from-brief path and is flagged in the row so the UI can say why.

7. **UI** (`BrandWizard.tsx`): concept cards show the Higgsfield render as the primary visual with the vector version beside it, plus a per-concept "re-render" action.

## Part 2 — Brand-infused Website PRD

1. **Durable logo URL.** New public `brand-logo` edge function serving a published logo at a permanent path (`/brand-logo/{snapshotId}/{logoId}.svg`), replacing 7-day signed URLs that would break inside an external builder.

2. **Brand block in context.** `_shared/venture-context.ts` gains a locked-brand section: stable logo URL, hex palette, type pairing, moodboard tiles, and voice — formatted for consumption by a site builder.

3. **Update Website PRD button** in both `BrandStudio.tsx` and the PRD `DocumentViewer` header. It regenerates the `website_prd` deliverable with the locked brand kit injected, preserving existing structure and content decisions.

4. **Paste-ready prompt.** The PRD's final master prompt section explicitly carries the color tokens, fonts, and an `<img src="...">` logo reference so the generated site is on-brand on first build.

## Technical notes

- Higgsfield base: `https://platform.higgsfield.ai`, auth via `hf-api-key` + `hf-secret` headers, async job + status polling. All calls are server-side only from edge functions.
- No schema migration needed beyond adding render-tracking fields to `brand_logo_directions` (render path, render status, provider used).
- Existing cancel/watchdog logic (`venture-job-watchdog`) covers the new stage since it operates on the same ledger rows.

## Sequencing

Part 1 ships first (steps 1-7), then Part 2. Part 2 depends only on a published logo existing, not on Higgsfield specifically.
