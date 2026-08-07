# Fix: ad regeneration failing in the Content Studio

## What the logs show

The ad generator's logs for the last ~10 minutes contain only worker `booted` and
`shutdown` events — not a single line from the function's own logging, even
though it logs on both the success path (palette/QA/logo lines) and the error
path (`venture-content-ad error`). A direct probe of the function returns a
clean `400 {"error":"snapshotId required"}`, so the function boots and imports
fine.

Zero application logs plus healthy boots means the invocation is most likely
being killed by the runtime mid-run (CPU/wall limit or memory), which drops the
buffered logs and returns a non-2xx the client reports as a generic failure.
That is the leading hypothesis, not a confirmed cause — the plan verifies it
before optimizing.

Why it is plausible: the recent art-direction work stacked several CPU-heavy,
pure-JS passes into one invocation — pngjs decode of a 1536px plate
(`plate-sample.ts`), resvg wasm rasterization of the mark, imagescript
knockout/trim/tint pixel loops over the full logo, plus the image model call
itself (up to 110s) and a QA retry that can run the whole thing twice.

## Plan

### 1. Make the failure visible (first, before any fix)
- Add a breadcrumb log at each stage boundary in `venture-content-ad/index.ts`
  (request received, context loaded, prompt built, gateway call start/end,
  sampling, SVG composite, logo composite, upload, done) with elapsed ms.
- Log the caught error's `name`, `message` and `status` explicitly, and return
  a stable `code` in the JSON body so the toast is specific.
- Re-run one regeneration and read the logs to confirm which stage dies.

### 2. Fix per the confirmed stage
- **Runtime kill during compositing (expected):** cut CPU in the poster path —
  downscale the plate before pngjs decode for sampling (sampling only needs a
  small proxy, not 1536px), cache the rasterized/knocked-out vector mark per
  brand kit instead of rebuilding it for every ad, and bound the knockout/trim
  pixel loops with a stride.
- **Gateway timeout / 402 / 429:** surface the real status through to the UI
  rather than a generic "Generation failed", and skip the QA retry when the
  first pass already burned most of the budget.
- **Anything else the breadcrumbs name:** fix at that stage.

### 3. Make one run fit the budget
- Ensure the QA/signature retry cannot double the heavy work: run it only when
  the first pass finished well inside budget, otherwise save the first result.
- Keep the existing background-recovery path in `ContentStudio` intact so a
  slow-but-successful run still lands on the tile.

### 4. Client-side error clarity
- Map the new error codes in `ContentStudio` / `RegenerateAssetDialog` so a
  runtime kill reads as "the render ran out of time — retrying with a lighter
  pass" instead of a bare failure.

## Technical notes

Files touched: `supabase/functions/venture-content-ad/index.ts`,
`supabase/functions/_shared/plate-sample.ts`,
`supabase/functions/_shared/logo-compositor.ts`,
`supabase/functions/_shared/content-ad-svg.ts`,
`src/components/hub/ContentStudio.tsx`.

No schema changes. No change to the poster look — this is instrumentation plus
CPU reduction on the same rendering pipeline.
