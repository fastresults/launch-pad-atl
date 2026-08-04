# Workshop-specific homepage: hide Foundation, deepen pain, retune the hero

Right now every workshop shows Foundation's sections below the fold, and the hero keeps rotating Foundation's "Now building: Coffee shop" imagery no matter which chip is selected. This makes the homepage workshop-aware end to end.

## 1. Hide the Foundation-only sections

When any chip other than Foundation is selected, these disappear:

- The Foundation copy block under the video wall
- The four-foundations framework section
- The honest roadmap section
- The rotating startup-ideas scroller

What stays on every workshop: the workshop stack (cost, artifacts, morning, formats, fit, objections, decision), video testimonials, the facilitator, the services teaser, the venue, and the final CTA. Selecting Foundation restores everything exactly as it is today.

## 2. Ten pain points per workshop

Each of the eight build workshops (brand, website, sales, email/CRM, social, content, AI ops, legal & money) gets a written set of ten specific, named pains — the things a founder in that lane actually feels, in their language, each paired with the fix the morning delivers.

- The page keeps showing the three sharpest pains in the cost section. No new page length.
- All ten drive the hero rotation and the caption under the prompt.
- Foundation keeps its existing pain set and its business-idea rotation.

Written to the same standard as the rest of the site: name the real artifact, no plan/blueprint/roadmap language for the offer itself.

## 3. Workshop-tuned hero rotation

The hero becomes ten pain-tied images per workshop instead of the shared 107-scene founder library.

- Ten new cinematic images per workshop, matched to that workshop's ten pains and shot in the same midnight-navy style as the existing scenes (1600x1000). Eighty new images total.
- The caption under the prompt mirrors the Foundation pattern exactly — white label, gold subject:

```text
NOW FIXING: A SITE NOBODY BOOKS FROM
```

- Rotation is randomized per visit, same cadence, same Ken Burns drift, same three-image window so memory stays flat.
- Foundation is untouched: it keeps "Now building: <business>" and the 107-scene founder rotation.
- Switching chips swaps the image set cleanly with a crossfade, no flash of the previous workshop's image.

## Build order

Because eighty images is a lot of generation, this runs in phases and each phase leaves the site working:

1. **Structure** — hide the Foundation sections, add the workshop pain data layer (all ten per workshop), and make the hero read its scene set and caption from the selected workshop. Until a workshop's images exist, it falls back to the current founder scenes, so nothing breaks.
2. **Website workshop images** — generate the first ten, review the look and the caption together.
3. **Remaining seven** — brand, sales, email/CRM, social, content, AI ops, legal & money, ten each, in batches.

## Technical notes

- `src/lib/workshop-pains.ts` (new): ten `{ id, pain, fix, caption, imagePrompt }` records per workshop slug, keyed off the existing catalog slugs.
- `src/lib/workshop-scenes.ts` (new): maps each slug to its ten imported scene images and captions; exposes a `getWorkshopScenes(slug)` that falls back to `founderScenes` when a set isn't generated yet.
- `CinematicHero.tsx`: replaces the hardcoded `founderScenes` with the selected workshop's set, keys the rotation on slug so the window and decode-ahead reset on switch, and renders the "Now fixing" caption for non-Foundation workshops.
- `HomeFramework.tsx`: gates `HeroCopy`, `Framework`, `HonestRoadmap`, and `HomeBusinessIdeasScroller` on `workshop.slug === FOUNDATION_SLUG`.
- Images land in `src/assets/scenes/<slug>/` at 1600x1000, matching existing naming and style.
- The workshop stack's three-pain cost section keeps reading `PRODUCT_META`; the ten-pain set is additive, not a rewrite of existing copy.
