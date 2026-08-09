# Brand Studio identity panel — visual overhaul

The locked Brand Studio summary currently reads as a debug view: a huge white slab holding a tiny mark, three oversized colour bars, and a cramped type/mood area below. This rebuilds it into a proper identity board.

## What changes

**1. The mark tile**
- Replace the tall white slab with a compact, right-sized mark card: subtle checkerboard/transparency ground behind the artwork so PNG vs SVG transparency is obvious, not a hardcoded white block.
- Show the mark three ways in one row — on light, on dark, and on the brand primary — so the founder sees how it actually behaves. This is the standard identity-board treatment and immediately reveals contrast problems.
- Size the artwork to its true bounding box with consistent optical padding, so a wide wordmark and a square glyph both look intentional.
- Add a small caption row: file type, and a "Refine in Logo Studio" link so the mark is editable from where it's displayed.

**2. Layout & proportion**
- Rebalance to a three-column identity board on desktop (mark / colour / type), collapsing to a single stack on mobile. Today the mark eats half the width for one small image.
- Reduce swatch height so core and neutral colours read as one palette family instead of two different scales, and align both grids on the same rhythm.
- Tighten section label styling and vertical rhythm so Mark, Colour, Typography and Mood Board read as one board with even spacing rather than stacked unrelated widgets.

**3. Colour**
- Core colours keep the click-to-edit behaviour and the paired on-colour dot, but gain a readable name + hex line and an AA contrast indicator against their pair.
- Neutrals render at a smaller scale in one continuous ramp.

**4. Mood board**
- Even, gap-consistent thumbnail grid with rounded corners matching the rest of the board, and a lightbox on click.

**5. Dark-mode correctness**
- Every surface in the panel uses semantic tokens. The only intentionally light surface is the "on light" logo swatch, which gets an explicit light scope rather than a raw `bg-white`.

## Not in scope (say the word and I'll add it)

Regenerating the actual logo artwork. The mark shown is what Logo Studio committed; this plan makes it presented correctly and adds the path back into Logo Studio to change it. If you want the mark itself reworked, that's a Logo Studio run, not a panel change.

## Technical notes

- Primary file: `src/components/hub/brand/BrandIdentityHeader.tsx` — rewritten into `MarkPanel`, `PalettePanel`, `TypePanel` subcomponents in the same file.
- `src/components/hub/BrandStudio.tsx` — grid/spacing adjustments where the header and `BrandBoardSections` are composed.
- `src/components/brand/BrandBoardSections.tsx` — mood grid spacing + lightbox.
- Reuses `.theme-light-scope` (already in `src/styles.css`) for the on-light logo swatch; adds a checkerboard utility token there.
- No backend, schema, or generation-pipeline changes.
