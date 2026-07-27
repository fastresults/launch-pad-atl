## Goal

Give each numbered section (01 Foundation → 08) a small hand-drawn, cross-hatched accent illustration in the same espresso ink as the section type — matching the pencil-sketch style of the attached references (lamp, film strip, document, eye, cloaked figure, box).

## Approach

**Hand-authored SVG, not generated raster images.** The reference style (fine hatching, ink outlines) reproduces cleanly as stroke-based SVG, and SVG lets the art inherit the section font color via `currentColor` — so it stays perfectly on-brand in light/dark and needs no re-export if the palette shifts. Raster PNGs would need transparency handling, fixed color, and 8 separate generations that won't feel like one hand.

### New file: `src/components/home/StageSketch.tsx`
- One component, `<StageSketch stage="01" />`, holding 8 inline SVGs.
- Shared visual system so all eight read as one artist:
  - `stroke="currentColor"`, `fill="none"`, 1.25px outlines with a lighter 0.6px hatch layer at ~45°.
  - Slightly irregular paths (hand-drawn wobble), no perfect circles.
  - `viewBox="0 0 120 120"`, rendered at ~72–88px.
- Motifs per section, drawn from the plain-English promise of each:
  - 01 Foundation — a laid cornerstone / stacked blocks
  - 02 Strategy — a compass rose
  - 03 Operations — meshed gears with a conveyor line
  - 04 Finance — coin stack with a rising line
  - 05 Governance — shield with a seal
  - 06 Brand — ink pot and nib
  - 07 Marketing — a lit desk lamp (directly echoing the attached lamp sketch)
  - 08 (final stage) — a paper airplane / broadcast arc for distribution

### Edit: `src/components/home/HomeFramework.tsx` (`Framework`)
- Wrap the existing stage header row so the number + title/intro sit left and the sketch sits at the far right of the row (`justify-between`, sketch `shrink-0`).
- Sketch inherits color from the header (`text-[hsl(var(--foreground))]/70` sitting inside the espresso type block) at ~55–70% opacity so it stays an accent, not a focal point.
- Hidden below `sm` to protect the mobile stack; `aria-hidden` since it carries no new information.

### Edit: `src/components/landing/LandingFramework.tsx`
- Same treatment on the landing fork so the two surfaces don't drift, keyed off the same `stage.number`.

## Technical notes

- No new dependencies; no data-model change — `FRAMEWORK_STAGES` is untouched and the sketch is looked up by `stage.number`.
- All strokes use `currentColor`, so the accent tracks the section font color automatically.
- `vector-effect="non-scaling-stroke"` keeps hatch weight consistent at any render size.
- Purely presentational: no changes to tooltips, deliverable data, or any business logic.

## Verification

Screenshot the homepage framework section at desktop and mobile widths, confirm all 8 sketches render, sit flush with their headers, match the type color, and don't push the deliverable grid.
