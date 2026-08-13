# Fix PRD generation: exposed + parallax heroes, more images, real image copy

## Why it keeps shipping the same site

The rules already exist in the contract — the enforcement doesn't. Three verified defects:

1. **The craft checks can never fail.** `applyCraftContract` in `website-prd.ts` always appends `buildDepthAddendum(...)` into the master prompt, and that addendum literally contains the words "parallax", "0.25x", "prefers-reduced-motion", "scrim", "72%/56%/38%" and "gemini-3-pro-image". `craftVerdict` then greps the *whole document* for exactly those strings. So `parallax_hero`, `scrim`, `opacity_ladder`, `image_tier` and `type_contract` pass on boilerplate the pipeline itself injected — even when no route spec and no imagery row mentions them. The gate is self-satisfying.
2. **Nothing enforces image volume.** `prdQualityMetrics` counts `imageryRows` and records the number; no check reads it. Pass C (Sections 4b–7) writes the imagery table under a 12,000-token cap with no floor, so a thin or truncated table ships and the built site comes back sparse.
3. **No image is required to carry copy.** Section 4b asks for alt text and a generation prompt. Nothing requires the words that sit *next to* the picture — caption, credit, or the body paragraph the image is illustrating — so the builder drops images into bare sections.

## The fix

### 1. Region-scoped checks instead of whole-document grep

Split the document before checking: strip the injected addendum and the master prompt, then run the imagery and motion checks against **Section 4 (route specs) and Section 4b (imagery table)** only. New/rewritten checks in `craftVerdict`:

- `parallax_routes` — every route whose section list contains a hero or full-bleed band names its parallax treatment (plate 0.25x / midground 0.6x / type 1.0x) *in its own Section 4 subsection*.
- `hero_exposure` — every imagery row of visual type hero/full-bleed states a numeric luminance target (35–55%) and "CSS scrim / not baked".
- `no_baked_darkening` — no imagery prompt uses "dark", "moody", "near-black", "shadowy" without a paired exposure number.
- `image_density`, `image_copy` — see below.

Failures route through the existing `repairWebsitePrdCraft` Pro pass, which currently rewrites the whole doc; add a **targeted 4b repair** that regenerates only the imagery table plus the offending route subsections, so repair fits in one call.

### 2. More images, with a measured floor

- Section 4b spec gains a hard density rule: **minimum 3 image slots per route and at least one per named section**, plus the always-missed slots (proof/logo bar, every process step, every feature card, results/stats visual, one portrait per testimonial, closing full-bleed CTA band). Home floor 8 slots, interior routes 4.
- New machine check `image_density`: count imagery rows per route from the table and compare against the route list in Section 2. Under floor → repair pass that adds the missing rows rather than regenerating the document.
- Pass C's directive states the floor explicitly and its token cap rises so a full table fits; if pass C returns truncated (`finish_reason: length`), continue the table in a follow-up call instead of accepting a short one.

### 3. Copy that supports the images

Extend the Section 4b table with two required columns and enforce them:

- **Caption / on-page copy** — the real words printed with the image (caption, credit line, or the stat/quote it carries). "None" is only allowed for texture bands.
- **Narrative role** — the one sentence of body copy the image is illustrating, which must exist verbatim in that route's Section 4 copy.

Section 4's per-route spec adds: every visual slot names its caption and the paragraph it sits beside; a section that has an image and no surrounding copy is a failure. New check `image_copy` verifies both columns are populated on every non-texture row, and the Section 4 word floors rise for image-heavy routes so the copy grows with the picture count.

### 4. Keep the addendum honest

The depth addendum stays (the builder needs it) but is marked with its own delimiter so checks can exclude it, and the master prompt's imagery section restates the *per-route* parallax and exposure decisions from Section 4b rather than the generic paragraph — the builder sees route-specific instructions, not a wall of universal rules it can skim.

### 5. Surface it

`prdQualityMetrics` gains `imagesPerRoute`, `heroExposureOk`, `parallaxRoutes` and `imageCopyOk`, shown on the Generation Health card so a thin PRD is visible before the site is built.

## Technical notes

Files: `supabase/functions/_shared/website-prd.ts` (region splitter, rewritten `craftVerdict`, targeted 4b repair, pass C directive + continuation, metrics), `_shared/deliverable-prompts.ts` (Section 4 visual/caption rules, Section 4b columns + density floor, Section 8 subsection 6), `_shared/layout-contract.ts` (rule 10 restated per-route, new imagery-density line on the acceptance checklist), `_shared/image-craft.ts` (caption/narrative fields on the recipes). Tests extended in `_shared/website-prd-craft.test.ts` — including a regression test that a document with only the injected addendum **fails** the parallax and exposure checks. Redeploy `venture-generate-document`, then regenerate The Friendship House PRD and diff the imagery table row count and the hero rows.
