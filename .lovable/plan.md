# Ensure logo is always large enough to read

## Problem
The logo compositor sizes the logo chip as a square at ~16–20% of the canvas's shortest edge, then letterboxes the logo inside with 12% inner padding. For wide wordmarks like `startuplabs`, the wordmark's height ends up ~3–4% of the canvas — visually tiny (see the attached YouTube thumbnail). The chip shape ignores the logo's true aspect ratio, and there is no user-facing size control.

## Fix strategy
Make the logo target a **minimum readable size** measured on the logo's dominant axis (not the chip), aspect-aware, with a user override in the Regenerate / Preview modals.

### 1. Aspect-aware, minimum-height sizing (`supabase/functions/_shared/logo-compositor.ts`)
- After decoding the logo, compute its aspect ratio `ar = logo.width / logo.height`.
- Replace fixed-square `targetBoxFor` with an aspect-aware box:
  - **Corner placements** (`banner-corner`, `thumbnail-lockup`): target a minimum **logo height** as a % of canvas shortest side, then derive box width from `ar` + padding. Tiers:
    - `sm` → 6% min height
    - `md` → 9% min height (new default, up from effective ~3–4%)
    - `lg` → 13% min height
  - Wide wordmarks (`ar > 3`) also enforce a min width of 22/30/38% of canvas width so they don't shrink to a stripe.
  - Square/badge logos (`ar` ~1) cap at 18/22/28% of shortest side.
  - `avatar-center` unchanged (already large).
- Cap chip width so it never exceeds 45% of canvas width (safe zone).
- Reduce inner padding from 12% → 8% so the readable glyphs get more of the chip.

### 2. Plumb a `logoSize` option through the pipeline
- `compositeLogo(..., opts: { placement, surfaceHex, logoSize?: 'sm'|'md'|'lg' })` — default `md`.
- `venture-social-cover/index.ts` and `venture-style-preview/index.ts`: accept `logoSize` from the request body, forward to `compositeLogo`, and log the resolved size next to headline logging.
- Persist last choice on the asset row (`last_logo_size` column, similar to `last_headline`) so regeneration keeps the user's preference.

### 3. Prompt-side reinforcement (`supabase/functions/_shared/cover-art-director.ts`)
- Add a `LOGO SAFE ZONE` block to the prompt telling the model to reserve a clean rectangle at the chosen placement of `~{H}% height × {W}% width` filled with `surfaceHex`, so the composited chip lands on flat background instead of on top of a face/detail. Values match the tier the compositor will use.

### 4. UI controls
- `RegenerateAssetDialog.tsx`: add a **Logo size** segmented control (Small / Medium / Large) next to Headline, with a helper caption ("Recommended: Medium for wordmarks").
- `AssetPreviewDialog.tsx`: surface current logo size as a chip with an **Edit** shortcut that opens Regenerate scrolled to the Logo size section (reuse the `focusSection` mechanism already added for headlines).
- `SocialAutopilot.tsx`: pass `logoSize` through `regenerateSingle` and initial `generateAll` calls; default `md`, remember per-asset from `last_logo_size`.

### 5. Migration
- `ALTER TABLE venture_social_assets ADD COLUMN last_logo_size text;` (+ same on style previews if applicable), backfill NULL, no RLS changes required.

### 6. QA
- Verify with three logo shapes (wide wordmark, square badge, tall glyph) that the composited chip's rendered logo height on a 1280×720 canvas is ≥ ~65px on Medium, ≥ ~95px on Large.
- Confirm chip never overlaps the headline safe zone at bottom-left of thumbnails.

## Files touched
- `supabase/functions/_shared/logo-compositor.ts` (sizing + padding + new option)
- `supabase/functions/_shared/cover-art-director.ts` (safe-zone prompt block)
- `supabase/functions/venture-social-cover/index.ts` (accept + persist `logoSize`)
- `supabase/functions/venture-style-preview/index.ts` (accept `logoSize`)
- `src/components/hub/social/RegenerateAssetDialog.tsx` (Logo size control + focus section)
- `src/components/hub/social/AssetPreviewDialog.tsx` (display + Edit shortcut)
- `src/components/hub/social/SocialAutopilot.tsx` (thread option through)
- New migration for `last_logo_size`
