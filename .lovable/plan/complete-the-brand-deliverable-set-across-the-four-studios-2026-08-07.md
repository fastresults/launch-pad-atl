# Complete the brand deliverable set across the four studios

Goal: make the Founders Hub output everything a paid identity engagement includes — minimum, standard, and premium — without duplicating what the four studios already do.

## Where things stand today

- **Brand Wizard** (5 steps): DNA → palette → typography → moodboard/logo → voice + style guide markdown.
- **Logo Studio**: AI design interview producing an approved vector mark plus a lockup family (mark, horizontal, stacked, mono, knockout) and a stable public logo URL.
- **Social Studio**: per-platform avatars/banners, channel setup, cover art.
- **Content Studio**: editorial posters, captions, 90-day calendar.

Already covered: vector + raster logo, lockup variants, color/black/white (mono/knockout), palette (HEX only), typography specs, voice notes, style guide (markdown, on-screen), social profile/banner kit, post templates.

Missing: business card, letterhead, envelope/notecard, email signature file, favicon export, CMYK/Pantone/RGB values, web font fallbacks, brand guidelines **PDF**, presentation template, invoice/proposal templates, motion logo, icon/pattern set, photography direction, web design-system spec, physical mockups.

## Duplicates to eliminate first

1. **Avatar/profile mark** is produced by both the logo lockup family and Social Studio avatar generation. Make the locked logo the single source; Social Studio crops/pads it per platform instead of generating a new image.
2. **Cover/banner art** exists in Social Studio (CoverArtTab) and in the brand asset generator (`social_cover`). Keep CoverArtTab; retire the duplicate kind.
3. **Style guide** exists as wizard markdown *and* the on-screen Visual Brand Guide. Keep one source of truth (the kit) and make the PDF a render of it, not a second document.
4. **Launch post** exists in both the brand asset generator and Content Studio. Content Studio wins.

## Recommended approach

Build collateral **deterministically from the locked kit** (SVG compositor → PNG/PDF), the same way the poster compositor already works — not with an image model. Business cards, letterhead, and invoices must have exact type, alignment, bleed, and real vector logo ink; a diffusion model cannot do that reliably. Reserve AI generation for the things that genuinely need imagery: photography direction boards, pattern/icon exploration, and mockup scenes.

## Build order

### Phase 1 — Brand foundations (fills the "minimum" gaps)
- Extend the palette model with RGB, CMYK, and nearest-Pantone values, computed at lock time; show all four in the Visual Brand Guide and the export.
- Add web-safe font fallback stacks to the typography step.
- Add favicon (16/32/180/512) to the logo export bundle, derived from the mark.
- New **Brand Collateral** tab inside Brand Studio with deterministic templates: business card (front/back), letterhead, #10 envelope, notecard, email signature (HTML + PNG, reusing the existing signature compositor).
- One-click **Download brand kit** ZIP: logo SVG/PNG variants, favicons, palette swatches, fonts list, collateral PDFs.

### Phase 2 — Standard add-ons
- **Brand guidelines PDF**: render the existing kit + guide markdown into a paginated, on-brand PDF (cover, logo usage, misuse, palette with all color spaces, type, voice).
- **Presentation template**: 6–8 master slides as SVG → PDF/PPTX-compatible export.
- **Invoice and proposal templates** with founder/venture fields prefilled from the venture record.
- **Social media kit**: consolidate under Social Studio, sourced from the locked logo (removes the duplicate generation path).

### Phase 3 — Premium tier
- **Motion logo**: scripted SVG/CSS build-in, exported as MP4/WebM/Lottie.
- **Icon + pattern set**: 12 icons and 3 patterns drawn from the mark's geometry.
- **Photography style direction**: an art-direction board (do/don't, lighting, subject, grade) reusing the moodboard pipeline.
- **Web design system**: component specs (buttons, forms, cards, spacing scale) plus design tokens as CSS variables and JSON.
- **Mockups**: signage, apparel, packaging, vehicle — logo composited into stock scenes.

### Gating
Minimum unlocks when the kit is locked. Standard unlocks once collateral exists. Premium sits behind an explicit "Go deeper" action per item so nobody burns generation credits by accident.

## Technical notes

- New shared module `supabase/functions/_shared/collateral-svg.ts` following the `content-ad-svg.ts` pattern; reuses `poster-fonts.ts`, `logo-lockup.ts`, `palette-rules.ts`, and `signature-compositor.ts`.
- New edge function `venture-collateral` (action-based: `card` | `letterhead` | `envelope` | `notecard` | `signature` | `invoice` | `proposal` | `deck` | `guidelines`), writing to the existing brand-assets storage path and asset table with a `collateral` kind so the Media Hub picks them up automatically.
- PDF output via SVG → PDF in the function; ZIP assembled client-side from signed URLs.
- Color-space conversion and Pantone matching are local math plus a bundled lookup table — no API dependency.
- Premium image work reuses the existing image gateway and QA gate; motion logo is generated as SVG + CSS keyframes, then rasterised to video.
