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

### B. Streamlined: the three concepts are vector from the start
Instead of approving a raster and then converting it, the concepting stage produces the three marks as SVG directly. The image the founder sees on each card is simply that SVG rendered to a PNG preview — so what you approve *is* the final artwork. Nothing is redrawn or re-interpreted later.

- Concepting builds each of the three marks as a clean, layered SVG on the brand palette (flat fills, no gradients, no embedded raster), using the existing business-read, craft spec and moodboard context that already drives the concepts.
- Each concept is rasterised for the card preview and for the jury/vision critique, so quality gating happens before the founder ever sees a bad mark — same standard as today, just applied to the vector.
- "Approve & vectorize" becomes **"Approve & finalise"**: it locks the chosen mark, generates the horizontal / stacked / mono / knockout lockups from the already-existing vector, writes usage rules, and sets it as the primary logo in the Live Brand. No model call, no redraw, near-instant.
- The vector spec and its rendered preview are stored together so the card image and the downloaded SVG can never diverge.
- Refine-this-mark edits the stored vector spec and re-renders the preview, so refinement stays lossless too.

### C. What this removes
- No raster-to-vector trace step and no separate tracing module.
- No second model pass at approval time, which also removes the timeouts, retries and stuck `vectorizing` states that stage was causing.
- Higgsfield-rendered rasters (where used) become inspiration/reference material feeding the concept, not the artwork of record.

## Technical notes

- Front end: `src/components/hub/brand-wizard/BrandWizard.tsx` — per-row pending checks via `mutation.variables?.id === row.id`; relabel the action to "Approve & finalise"; show it only on the selected mark.
- Backend: `supabase/functions/venture-brand-assets/index.ts` — concepting stage stores an SVG plus a rasterised preview per direction; stage 6 collapses to lockout/variant assembly from the stored vector (reuse `buildLogoVariants`), dropping the `developVectorSpec` model call.
- `logo-render-prompt.ts` / `logo-geometry.ts` carry the drawing instruction into concepting, with the existing lint + jury gate run per concept before the cards render.
- Asset payload keeps its shape (`variants`, `usage`), with `render` now pointing at the preview rasterised from the same SVG.
- Trade-off to accept: concept previews are drawn from vector geometry rather than a photoreal image model, so they read as flat brand marks — which is what a logo should be, but it is a visible change from the current previews.

