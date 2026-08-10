# Per-venture Style System export

Today's `style-system.md` / `style-system.css` were hand-written from the Startup Labs marketing site. That's wrong: a style system must be generated from each venture's own locked brand kit — starting with The Athletes Prayer Foundation — and be downloadable from that venture's Brand Studio and its shareable link.

## What the user gets

In Brand Studio (and on the shareable link), a **Style System** asset alongside the other collateral, with:

- **Download .md** — the portable spec, paste-into-another-Lovable-project document.
- **Download .css** — the drop-in stylesheet (Tailwind v4 tokens + a v3 fallback block).
- **Copy prompt** — one click copies "Apply this style system to my app…" plus the spec.
- **Regenerate** and **Delete**, matching every other collateral piece.

## What the generated system contains

Everything is read from the venture's own record, never invented:

- **Colours** — the locked palette (bg, fg, muted, accent, primary, secondary) converted to OKLCH, with a derived light/dark counterpart for every token so both themes work. Contrast is checked with the existing WCAG helpers; any pair that fails is nudged until it passes and the adjustment is noted in the doc.
- **Typography** — the kit's heading/body Google fonts, weights, the exact `<link>` tag, tracking and scale.
- **Logo rules** — which mark to use on light vs dark surfaces, using the existing contrast-aware logo logic, with clear-space and minimum-size numbers.
- **Voice** — tone words, dos/donts, CTA labels from the kit's voice block, so copy written in the target project stays on brand.
- **Imagery** — art-direction notes and 3–4 mood board frames referenced as URLs.
- **Component conventions and hard rules** — radius, elevation, surfaces, "tokens only, never hardcoded colours", light/dark parity checklist.

## Technical notes

- New edge function `supabase/functions/venture-style-system/index.ts`. It loads the venture snapshot + `venture_brand_kits` row via the existing `venture-context` helpers, calls `ensureBrandKit` so a venture with no locked kit still gets a derived one, then renders both files deterministically (no model call needed for the CSS; a short model pass only writes the prose rationale sections).
- Colour maths reuses `_shared/color-spaces.ts`; logo surface selection reuses `_shared/logo-ink.ts`. Nothing new is invented for contrast.
- Output is stored as two rows in `venture_brand_collateral` (kind `style-system-md`, `style-system-css`) so it inherits the existing regenerate/delete sweep (`sweepKind`) and the "regenerate means replace" storage cleanup.
- Owner/admin auth follows the same pattern as `venture-collateral` (owner or `admin` role bypass).
- UI: a new card in `src/components/hub/brand/BrandCollateral.tsx` (reusing `CollateralPieceCard`) and a section entry on `src/routes/v.$token.tsx` fed by `venture-share`, so the shareable link exposes the same downloads plus the existing export menu.
- The current `public/style-system.md` / `public/style-system.css` stay as the Startup Labs house system; they're no longer presented as a venture asset.

## Verification

Generate for The Athletes Prayer Foundation, download both files, and confirm: tokens match its locked palette, the dark-surface logo is the legible variant, contrast checks pass in both themes, and the CSS drops into a fresh Tailwind project without edits.
