# Photo headers for every startup-idea card

## What ships
- One horizontal photorealistic image per idea in `src/lib/business-ideas.ts` — **67 images total**.
- Added as a new `image` field on each `BusinessIdea`, so the card component picks it up automatically and existing filters/marquee logic stay untouched.
- `IdeaCard` in `src/components/home/HomeBusinessIdeasScroller.tsx` gets a top image band (roughly 16:9, `object-cover`), category/income chips overlap the image or move just under it, headline + offer sit beneath. Card widens slightly on desktop (~340px) so the photo reads.

## Image spec
- Format: **JPG**, 1024×576 (16:9 horizontal), `fast` quality tier.
- Style rules baked into every prompt for a coherent look across 67 cards:
  - Photorealistic, natural daylight, shallow depth of field, no text/logos/watermarks, no people's faces front-and-center (subject or hands-only where a person is needed), color grade leaning warm-neutral to match the site's dark UI, no stock-photo cheesiness.
- Prompts derived per idea from `name` + `offer` (e.g. *"Mobile car detailing"* → "Detailer's hands wiping a wet black sedan hood at a suburban driveway, morning light, water beads, microfiber cloth, shallow depth of field, photorealistic, no text").
- Files: `src/assets/ideas/<slug>.jpg` (slug from idea name). ES6-imported into `business-ideas.ts` so Vite hashes and lazy-loads them.

## Data + component wiring
1. Add `image: string` to `BusinessIdea` type.
2. Add an `image:` line to each of the 67 entries pointing at the imported asset.
3. Update `IdeaCard`: image band on top (rounded top corners, `aspect-video`, `object-cover`, `loading="lazy"`), overlay category chip top-left and income chip top-right on a subtle gradient scrim; name + offer stay in the body.
4. Bump card width from `w-[280px] sm:w-[320px]` to `w-[300px] sm:w-[340px]` so the photo has room without breaking marquee rhythm.

## Execution
- Generate all 67 in parallel batches via `imagegen--generate_image` (fast tier, 1024×576, JPG).
- After generation, spot-check ~6 across categories; regen individual ones only if a prompt clearly missed.
- No backend, no schema, no route changes.

## Cost / scope callout — one confirmation before I burn credits
Generating 67 photorealistic images (fast tier) is the expensive part of this task. Two things worth confirming so I don't spend twice:

1. **All 67 in one pass, or start with one category (e.g. Online, 16 cards) as a style test first, then greenlight the rest?** Starting with 16 costs ~1/4 and lets you veto the visual direction before I generate the other 51.
2. **Quality tier — `fast` (default, cheapest, good for card thumbnails) or `standard` (higher fidelity, ~3–4× cost)?** At the size these render on the marquee, `fast` is almost certainly enough — but if you want them to hold up on a Retina laptop at close range, `standard` is the safer call.

Default if you don't answer: **`fast`, all 67 in one pass**, using the style rules above.
