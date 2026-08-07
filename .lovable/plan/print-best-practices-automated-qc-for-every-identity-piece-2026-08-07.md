# Print best practices + automated QC for every identity piece

Right now each piece is drawn by its own hand-tuned function, and nothing checks the result. The mark on the card front is fitted into a narrow side field with 20% inset padding, and the back mark is a hardcoded 190×76 box — neither is derived from any rule about how large a logo should be on a 3.5×2in card. There is no bleed, no defined safe area, and no post-render check that the piece is actually usable.

Two additions fix this: a **spec per piece** that encodes real print/identity standards, and a **QC gate** that measures the rendered result against that spec before anything is stored.

## 1. Piece specs (the standards)

A single table defines, for each piece, the things a print producer would check. Values expressed as ratios of the trim so they hold at any DPI.

| Piece | Trim | Bleed | Safe margin | Logo height (of trim H) | Min type |
| --- | --- | --- | --- | --- | --- |
| Business card front | 3.5×2in | 0.125in | 0.15in | 22–30% (mark) / 16–22% (lockup) | 7pt |
| Business card back | 3.5×2in | 0.125in | 0.15in | 12–18% | 6.5pt |
| Letterhead | 8.5×11in | 0.125in | 0.5in | 7–10% | 8pt |
| Envelope #10 | 9.5×4.125in | 0.125in | 0.375in | 14–20%, return block inside top-left third, FIM/stamp zone kept clear | 8pt |
| Notecard A2 | 5.5×4.25in | 0.125in | 0.3in | 18–26%, optically centred above centre | 7pt |
| Email signature | 600×170 @2x | n/a | 24px | mark 96–120px tall | 12px |
| Invoice / proposal | 8.5×11in | 0.125in | 0.5in | 6–9% | 8pt |
| Presentation | 16:9 | n/a | 6% | cover 10–14%, corner 4–6% | 14pt |
| Guidelines | 8.5×11in | 0.125in | 0.5in | cover 18–24% | 8pt |

Each spec also carries: logo clear space (0.5× mark height minimum, per standard identity practice), max text measure (45–75 characters per line), minimum contrast (4.5:1 for body, 3:1 for large display), and which edges may bleed colour.

## 2. Rewire the templates to obey the spec

- Every template asks the spec for its logo box instead of using inline constants — the business-card mark becomes ~26% of card height (about 3× larger than today), the back mark ~15%.
- Colour fields become bleed-aware: a full-height field extends past trim, and no content sits inside the bleed or outside the safe margin.
- Clear space around the mark is enforced by pushing neighbouring elements, not by hoping the constants line up.
- Crop marks and a trim/bleed guide are emitted on the print-ready SVG for pieces that go to a printer.

## 3. QC gate (runs on every generated page)

After each page rasterises, it is measured. Failures are reported per piece with the reason, and the piece is re-rendered once with the offending value corrected before being marked failed.

Checks:
- **Logo scale** — measured mark bounding box height falls inside the spec band. Too small (today's fault) and too large both fail.
- **Clear space** — no other ink within the mark's required clear space.
- **Safe area** — no non-bleed ink crosses the safe margin; nothing important inside the bleed.
- **Ink coverage** — page is neither near-blank nor a solid block.
- **Text present** — the expected number of text lines is actually in the raster (the existing font-failure guard, applied per page).
- **Contrast** — each text block against its measured local background meets its minimum.
- **Measure** — no line exceeds 75 characters, no line under-fills its column badly.

Results are stored with the piece so the library can show a "print-checked" state, and a failing piece surfaces the specific reason rather than silently shipping.

## Technical notes

New:
- `supabase/functions/_shared/collateral-specs.ts` — the spec table above, ratio→pixel resolver, clear-space and safe-area math.
- `supabase/functions/_shared/collateral-qc.ts` — raster measurement: mark bbox detection, coverage, safe-area scan, per-block contrast sampling (reuses the PNG decode approach in `_shared/image-qa.ts`).

Changed:
- `_shared/collateral-svg.ts` — `businessCard`, `letterhead`, `envelope`, `notecard`, `emailSignature`, `docTemplate`, `presentation`, `guidelines` take the resolved spec; `markAt`/`logoBlock` gain clear-space enforcement; crop-mark helper added.
- `venture-collateral/index.ts` — run QC per page, one corrective re-render, store QC verdict, return failures with reasons.
- Migration: QC verdict JSON column on `venture_brand_collateral`.
- `BrandCollateral.tsx` / `CollateralPreviewDialog.tsx` — print-checked chip and failure reasons.

## Order of work

1. Spec table + resolver.
2. Business card rebuilt on the spec (largest visible win — logo size, bleed, safe area).
3. QC module + gate wired into generation, verified against a regenerated card.
4. Remaining pieces onto the spec.
5. Crop marks, print-checked UI state.
