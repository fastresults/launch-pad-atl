## Why it's slow today

`venture-document-image` calls `google/gemini-3-pro-image` (Nano Banana **Pro**) non-streaming. Pro typically takes 20–45s per image. The user waits for the entire round-trip before *any* pixels appear — no progressive preview, no placeholder swap, just a "Generating visual…" spinner.

Three independent levers can cut perceived time from ~30s to ~2–5s.

## Recommendations (ranked by impact)

### 1. Switch the default model to Nano Banana 2 (Flash) — biggest win
Swap `google/gemini-3-pro-image` → `google/gemini-3.1-flash-image` in `venture-document-image/index.ts`. Flash image is ~3–5× faster with near-Pro quality for editorial illustrations. Keep Pro as an opt-in "regenerate in HQ" action on the document viewer for users who want the premium render.

### 2. Stream the image with progressive previews
Today the edge function awaits the full JSON body, then the client polls/refetches. Switch to SSE streaming end-to-end:
- Edge function requests with `stream: true` and forwards the SSE body to the client (TanStack-style passthrough).
- `DocumentViewer` consumes `image_generation.partial_image` frames with the documented `eventsource-parser` + `flushSync` pattern, rendering each partial as a blurred `<img>` that sharpens on `completed`.
- First visible frame typically lands in 1–2s instead of 30s — the spinner disappears almost immediately.

### 3. Kick off generation earlier + cache aggressively
- **Pre-warm:** trigger `venture-document-image` the moment a document finishes generating (in `dashboard-pipeline-run`) instead of on first viewer open. By the time the user clicks View, the image is already in storage.
- **Optimistic placeholder:** while generating, render a brand-tinted gradient + the document title as an SVG placeholder (instant) rather than the empty card.
- **CDN cache headers:** add `cacheControl: "31536000, immutable"` to the storage upload (currently missing) and use long-lived signed URLs so repeat views are instant.

### 4. Smaller payload
Pro returns ~2–4MB PNGs. Add a post-generation step (sharp/`@squoosh/lib` in the edge function, or re-encode to WebP at 1600×900) to cut transfer size 60–80%. Optional — only matters on slow mobile networks.

## What I'd change in code

| File | Change |
|---|---|
| `supabase/functions/venture-document-image/index.ts` | Default model → `gemini-3.1-flash-image`; add `stream: true` passthrough variant; set `cacheControl: 31536000` on upload |
| `supabase/functions/dashboard-pipeline-run/index.ts` | Fire-and-forget `venture-document-image` after each document write |
| `src/components/hub/DocumentViewer.tsx` | Add `streamImage` helper + blurred partial-frame `<img>` swap; show SVG placeholder while pending |
| `src/lib/streamImage.ts` (new) | The `eventsource-parser` + `flushSync` snippet from the AI-image-gen guide |

## Expected result

- **First pixels visible:** ~30s → ~1–2s (streaming)
- **Final image ready:** ~30s → ~6–10s (Flash vs Pro)
- **Re-opens:** instant (pre-warm + CDN cache)
- **Quality:** indistinguishable from Pro for editorial style; Pro stays available as opt-in

Want me to implement all four, or start with #1 + #2 (the biggest perceived-speed wins) and leave pre-warm/cache for a second pass?
