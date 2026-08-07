# Fix: vectorize buttons all spin, and vectorizing redraws the logo

## What's actually happening

**1. All three "Approve & vectorize" buttons go active at once.**
The vectorize action is one shared mutation. The buttons read `vectorizeDirection.isPending` — a single global flag — so the moment any one card is approved, all three cards render the spinner and disable together. It's purely a UI wiring bug; only the approved mark is really being processed.

**2. Vectorizing changes the design.**
Today "vectorize" does not trace the approved image. It sends the concept brief plus a reference image to a language model and asks it to *re-draw* the mark as geometric primitives, then lints and re-juries the result. That is a redraw, not a trace — the model reinterprets the mark, so the porch/umbrella emblem comes back as a different drawing. The approved raster is only a hint the model may ignore.

## The fix

### A. Per-card button state
- Scope every pending/disabled check to the row being acted on (compare the mutation's target id to the card's id), for select, refine, retry, remove and vectorize alike.
- Only the card actually running shows a spinner; the others stay clickable.
- Once a mark is selected as primary, the other two cards show "Select" only — vectorize is offered on the selected mark, since vectorizing a mark you didn't choose is wasted work.
- Cards already vectorized show "Vectorized" with a re-run option instead of a live-looking button.

### B. Fidelity: trace the approved render, don't redraw it
Replace the model redraw with a real raster-to-vector trace of the exact approved PNG:

- New shared module `logo-trace.ts`: decode the approved render, quantize it to the small set of brand colours actually present in the image, and trace each colour region's contours into SVG paths (marching-squares boundary walk + curve smoothing/simplification). This reproduces the shape the founder approved, edge for edge.
- Colour handling: snap traced regions to the nearest brand token so the SVG stays on-palette without shifting shapes; keep a flat, layered fill structure (no gradients, no embedded raster).
- Clean-up pass: drop specks below a minimum area, close small gaps, and merge same-colour regions so the file stays tidy and scalable.
- Build the horizontal / stacked / mono / knockout lockups from that traced mark (mono = single-colour flatten, knockout = inverted), so all variants share the approved geometry.
- Vision check changes role: instead of re-judging the mark as a concept, compare the traced SVG against the approved render and report a similarity note. Low similarity flags the trace for review rather than silently shipping a different logo.
- Keep the approved raster attached to the asset as the reference of record, so the original is always recoverable.

### C. Fallback and transparency
- If tracing is unavailable, fall back to the current model redraw but label the result clearly in the UI as "redrawn, not traced" so a design change is never a surprise.
- Surface a small "Traced from your approved render" badge on successful traces.

## Technical notes

- Front end: `src/components/hub/brand-wizard/BrandWizard.tsx` — replace global `isPending` checks with per-row comparisons via `mutation.variables?.id === row.id`.
- Backend: `supabase/functions/venture-brand-assets/index.ts`, stage 6 (`logo_vectorize` / `logo_draw_vector` / `logo_retry_direction`) — swap `developVectorSpec` + `buildLogoVariants` for the new trace path; keep the lease/claim, retry and error handling exactly as-is.
- New file: `supabase/functions/_shared/logo-trace.ts` (PNG decode, colour quantize, contour trace, path simplify, variant assembly). Reuses the existing resvg wasm helper pattern for any raster round-trips.
- Asset payload keeps its current shape (`variants`, `usage`, `render`) plus `trace: { method, similarity, source_path }`.
