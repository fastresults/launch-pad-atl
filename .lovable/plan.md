# Fix the missing "E" + add stacked logo variants

## Why the E disappears (confirmed, not guessed)

I downloaded The Friendship House primary SVG and re-ran the pipeline's own
background-stripping logic against it. Exactly one shape gets deleted:

```text
M2305.12,308.01v-102.49h77.45v19.03h-53.88v64.42h55.78v19.03h-79.36...
```

That is the final **E** of "House". The source artwork is intact — the mark is
mangled inside `stripSvgBackground()` in `supabase/functions/_shared/logo-raster.ts`,
which every consumer (social covers, collateral, content ads, rasterised PNG
cache) runs before drawing. Two bugs combine:

1. `isLightFill()` treats a path with **no fill attribute** as a white
   background plate. In this file the letterforms inherit black from the parent,
   so every glyph is a plate suspect.
2. `geomBBox()` measures a path by pairing raw numbers as x,y. Path data here is
   relative `h`/`v` commands, which carry a *single* number each — so the pairing
   is meaningless. For the E it produced a fake bbox spanning the whole canvas,
   and the shape was stripped as a plate.

Only the E trips it because its number sequence happens to fake full-canvas
coverage; the other 19 glyph paths survive by luck. Any venture with a similar
traced logo can lose a glyph the same way.

## Fix 1 — make plate detection correct and conservative

In `logo-raster.ts`:

- Replace `geomBBox` with a real path-data walker that tracks the pen through
  `M/m/L/l/H/h/V/v/Z` (the only commands allowed to reach this check) so
  relative single-value commands are measured correctly.
- Tighten `isLightFill`: an unset fill is no longer "light" on its own. Only
  treat it as a plate candidate when the shape is the *first* drawable in the
  document, or when it is explicitly white/near-white.
- Add a safety net: never strip a shape if doing so removes more than a small
  fraction of the document's drawables, and never strip when the artwork has
  many small shapes (a wordmark) and the candidate isn't the first element.
- Add a unit test using the actual Friendship House path data asserting all 20
  paths survive, plus an existing-behaviour test that a real white plate is
  still removed.

After the fix, purge the cached rasterised PNGs (`...@1024.png`) for affected
ventures so the broken bitmap isn't served from cache.

## Fix 2 — stacked logo variants (colour + inverse)

Today the logo set is four slots: primary, reversed, icon, wordmark. All of them
are treated as one aspect. Add two slots:

- `stacked` — colour, mark over wordmark, for light grounds
- `stacked_reversed` — inverse of the same, for dark grounds

Work:

- `src/components/hub/brand/LogoSetPanel.tsx`: add the two slots to
  `LOGO_SLOTS` with hints, extend `guessSlot()` filename hints
  (`stacked|vertical|centered`, plus inverse variations), and render their tiles.
- `supabase/functions/venture-brand-assets/index.ts`: add both to the
  `VARIANTS` allow-list (two places) so upload/replace targets the right slot.
- `supabase/functions/_shared/logo-ink.ts`: extend `variantOrder()` so stacked
  artwork is a ranked candidate on each surface, and teach `logoCandidates()`
  the new slot names.
- Auto-derive when the founder only uploads horizontals: the brand-assets
  function composes a stacked lockup (mark above wordmark) from the existing
  horizontal artwork and saves it into the stacked slots, so every venture has
  the option without extra uploads.

## Fix 3 — placement picks the lockup that fits the box

Add an aspect-aware chooser used by the compositors and collateral engine:
given the target box's aspect ratio, prefer the horizontal lockup for wide
boxes (roughly wider than 2.2:1) and the stacked lockup for square/tall boxes,
then apply the existing light/dark surface rule to pick colour vs inverse.

Applies to:

- `supabase/functions/_shared/logo-compositor.ts` (social covers, content ads —
  corner and centred placements)
- `supabase/functions/_shared/collateral-svg.ts` (business cards, deck covers,
  guideline pages) so a tall/narrow mark box stops forcing a shrunken wide mark
- `brand-logo` endpoint: accept a `lockup=horizontal|stacked` parameter so the
  UI can preview both

The existing contrast/QC gates stay in force — a stacked variant is still
subject to the same ink verdict before it can ship.

## Verification

- Unit test on the real Friendship House path data (all glyphs survive).
- Rasterise the repaired primary and reversed marks and visually confirm the
  full "The Friendship House" reads end-to-end.
- Regenerate one social cover and one business card for the venture and confirm
  the E is present and the stacked lockup is chosen for the square placements.

## Technical notes

Files touched: `_shared/logo-raster.ts` (+ new test), `_shared/logo-ink.ts`,
`_shared/logo-compositor.ts`, `_shared/collateral-svg.ts`,
`venture-brand-assets/index.ts`, `brand-logo/index.ts`,
`src/components/hub/brand/LogoSetPanel.tsx`. Edge functions redeployed after
the change; cached logo rasters invalidated.
