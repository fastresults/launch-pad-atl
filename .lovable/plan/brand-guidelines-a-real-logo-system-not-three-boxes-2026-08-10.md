# Brand guidelines: a real logo system, not three boxes

The Logo page in the guidelines currently ships three specimens — Primary, Knockout, Mono — and the Knockout box renders a dark mark on a near-black ground, so it reads as an empty rectangle. There are no brand-colour lockups at all, no clear-space diagram, and no misuse page. That is not a document a founder can hand to a printer or a partner.

## What's actually wrong (verified in the renderer)

- **Knockout disappears.** The knockout specimen forces the mark to the on-colour ink, but that recolour is skipped whenever the artwork can't be recoloured (embedded raster or gradient paint). The light-plate fallback that exists for exactly this case is disabled when the mark came from the founder's "reversed" slot — so a dark reversed raster on a dark ground draws dark-on-dark and nothing catches it.
- **The print check can't see it.** The quality gate only flags a wrong logo when the artwork is tagged `primary`. A `reversed` mark that is invisible passes.
- **No colour variants.** The page offers full-colour, knockout, mono only. Nothing shows the mark on the brand primary, on the accent, on a mid-tone, or reversed-on-colour — the variants people actually need.
- **The section is thin.** Five pages total (cover, logo, colour, type, voice). No clear space, no minimum size, no misuse, no application examples.

## What we'll build

**1. Logo system — page 01 (rebuilt)**
A 6-tile specimen grid, each tile captioned and each drawn against a real surface:

```text
 ┌────────────────────┬──────────────┬──────────────┐
 │  PRIMARY           │  ON PRIMARY  │  ON ACCENT   │
 │  full colour       │  reversed    │  reversed    │
 ├────────────────────┼──────────────┼──────────────┤
 │  MONO — BLACK      │  MONO — WHITE│  ONE COLOUR  │
 │  on paper          │  on charcoal │  brand ink   │
 └────────────────────┴──────────────┴──────────────┘
```

Every tile is guaranteed legible: the mark is recoloured to the correct ink for its surface, and when the artwork physically cannot be recoloured it is placed on a light plate instead of vanishing. A tile that still fails the contrast test is dropped rather than shipped blank, and the page notes why.

**2. Clear space & minimum size — new page 02**
The mark inside a measured clear-space frame (one cap height on every side, drawn as tick marks), plus a minimum-size row: the mark at print minimum and at screen minimum with the actual measurements labelled.

**3. Misuse — new page 03**
Six "don't" cells generated from the real mark: stretched, recoloured off-palette, drop-shadowed, rotated, on a busy photograph without a scrim, and crowded. Each struck through and captioned.

**4. Colour, typography, voice** keep their current pages, renumbered — the guidelines go from 5 pages to 8.

**5. The gate learns this failure**
The print check gains a mark-visibility rule: any specimen whose drawn ink fails the contrast floor against its own surface fails the page, regardless of which artwork variant was used. That means this exact bug can't publish again.

## Technical notes

- `_shared/collateral-svg.ts`
  - `markAt`: drop the `!picked.dark` guard on the plate fallback so an untintable reversed mark on a dark ground still gets its plate; and when tinting is possible, always force the on-surface ink for a specimen surface rather than trusting the variant label. Record the resolved ink so QC can measure it.
  - Rewrite `guidelines()` page 01 as a measured `T.flow` tile grid driven by a `LOGO_SPECIMENS` array (`{ label, surface, ink, note }`), surfaces derived from the venture palette (`paper`, `primary`, `accent`, `fg`, mid-tone via `mix`). Skip a tile whose surface duplicates another within a small colour distance so a monochrome palette doesn't produce three identical boxes.
  - Add `guidelinesClearSpace()` and `guidelinesMisuse()` page builders; extend the folio numbering and the page list.
- `_shared/collateral-specs.ts`: register specs for the two new page names (same 1600×1000 screen page geometry and type floor as the existing interior pages).
- `_shared/collateral-qc.ts`: extend `PageMetrics` with per-mark `{ ink, bg }` entries; fail the page when any recorded mark's ink/background contrast is under the legibility floor, with the message naming the specimen.
- `venture-collateral/index.ts`: no contract change — the guidelines kind simply emits 8 pages; the existing quarantine/promotion gate and `sweepKind` cleanup handle the extra files and remove the old 5-page set.
- Verify with a local render of the guidelines pages for a venture with (a) a vector logo, (b) a raster-only logo, confirming zero overlaps, zero contrast failures, and a visible mark in every specimen tile before redeploying.
