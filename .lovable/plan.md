
# New Yorker–style slide art for facilitator decks

## Goal
Give every slide in every facilitator deck a hand-drawn, *New Yorker*–style illustration — no titles, no subtitles, no embedded text in the artwork. Ship Foundation first end-to-end, then proceed deck by deck (Strategy → Social & Content) on approval.

## Visual direction (shared across all 64 illustrations)
- Style: classic *New Yorker* cartoon illustration — fine pen-and-ink linework, restrained crosshatching, soft muted watercolor washes, generous negative space, slightly wry editorial tone.
- Composition: single conceptual scene per slide. No words, labels, signs, captions, logos, or UI inside the image.
- Palette: warm off-white paper background, ink black, with one or two muted accent washes (sage, ochre, dusty rose, slate blue) — kept consistent across a deck so it reads as a set.
- Aspect: 3:2 landscape (1536×1024) so it sits cleanly inside the existing `max-h-[280px] rounded-2xl` slot without cropping faces.
- Generated via the agent-side `imagegen--generate_image` tool, `model: "premium.gemini"` (Nano Banana 2) for the editorial line quality, `transparent_background: false`. Each prompt will explicitly forbid text/letters/typography/watermarks.

## Foundation deck — 10 scenes
Each slide gets one illustration. Concepts chosen to match the slide's idea without duplicating its words.

1. **Cover** — A founder at a drafting table sketching a building's foundation blueprint; coffee cup, T-square, calm morning light.
2. **Stakes / why this exists** — A small house being lowered by crane onto a single concrete footing; bystanders watching from below.
3. **What breaks without it** — Three precarious towers of mismatched objects (chairs, books, a teapot) leaning at different angles on uneven ground.
4. **What good looks like** — A founder calmly answering four curious customers seated around a small café table.
5. **The four deliverables** — A craftsman's workbench with four neatly arranged hand tools laid out on a linen cloth.
6. **Deliverable 01 — Founder Profile** — A tailor measuring a founder for a bespoke jacket in front of a tall mirror.
7. **Deliverable 02 — Business Concept** — A gardener transplanting a young sapling from a paper cup into rich soil.
8. **Deliverable 03 — Value Proposition** — A lighthouse keeper aiming a single bright beam across a foggy harbor toward one small boat.
9. **Deliverable 04 — Positioning Statement** — A chess player thoughtfully placing one piece on an otherwise empty board.
10. **Recap / what's next** — A hiker pausing at a trail marker, looking up a long path that climbs into distant hills.

(Concepts for Strategy through Social & Content will be drafted the same way once Foundation is approved — 10 scenes per deck, total 70 more.)

## Implementation steps (Foundation)

1. **Generate art.** Call `imagegen--generate_image` 10× in parallel, saving to:
   ```
   public/decks/foundation/01-cover.jpg
   public/decks/foundation/02-stakes.jpg
   ...
   public/decks/foundation/10-recap.jpg
   ```
   Every prompt ends with: *"editorial pen-and-ink illustration in the style of a classic New Yorker cartoon, soft muted watercolor wash, warm off-white paper, generous negative space, no text, no letters, no typography, no captions, no signage, no watermark."*

2. **Add SlotImage to the 8 slides that don't have one.** Each new slot uses a distinct `field` so admin overrides keep working:
   - `what-breaks` → `<SlotImage field="image" defaultSrc="/decks/foundation/03-what-breaks.jpg" …/>` placed under the cards.
   - `what-good`, `deliverables-overview`, `recap` → same pattern, sized `max-h-[220px]` so it doesn't push content off-canvas.
   - `deliv-0..3` → extend `DeliverableSlide` with an optional `imageSrc` prop and a `SlotImage` rendered above or replacing the giant icon block; pass per-deliverable images from `foundation.tsx`.

3. **Wire defaults for the two existing slots.** Add `defaultSrc` (and `defaultAlt`) to the `cover` and `stakes` `SlotImage` calls pointing at the new files.

4. **Verify in the deck viewer.** Open `/admin/decks` → Foundation → Preview, page through all 10 slides at 1920×1080, confirm no text artifacts and that images sit within the canvas without overlap.

5. **Wait for approval, then repeat** for Strategy, Operations, Finance, Governance, Brand, Marketing, Social & Content — one deck per turn so we can adjust style or concepts between decks.

## Technical notes
- `SlotImage` already supports `defaultSrc`/`defaultAlt`; no schema changes needed. Admin AI re-generation via `deck-image-generate` continues to work because we're only setting defaults, not writing override rows.
- `DeliverableSlide.tsx` needs a small extension to accept an optional image and render it; the existing icon stays as a fallback when no `imageSrc` is passed, so other decks keep rendering until their art lands.
- Files live in `public/decks/<stage>/` so they're served as static assets with long cache lifetimes — no DB writes, no storage bucket churn.
- If any prompt is rejected by content moderation, retry once with a more abstract reframing (e.g. swap a human figure for an empty chair) before falling back to `premium.gpt`.

## Out of scope
- Animating the illustrations.
- Changing slide copy, layout grid, or the Slot system.
- Backfilling the admin override table — defaults are enough; admins can still swap any image per-slide.
