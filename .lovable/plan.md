# Choose which mark a piece is generated with

Today the mark is chosen entirely by the machine. `markSvgFor()` in
`collateral-svg.ts` picks artwork from the box shape (wide box → horizontal
lockup, squarish box → stacked) and the ground (dark surface → the inverse set).
That is a good default, but it is invisible and unoverridable: when a founder
presses **Generate** on the business card, they cannot say "use the stacked
lockup here" or "use the symbol only".

## What changes for the founder

Each collateral card's **Generate** button becomes a small split control:
pressing it still generates with the recommended mark, and a chevron opens a
short menu:

```text
Mark for this piece
  ● Recommended        Stacked lockup — chosen from the layout
  ○ Symbol
  ○ Horizontal lockup
  ○ Stacked lockup
  ○ Wordmark
```

- Forms with nothing in the logo set are listed but disabled, labelled
  "Not supplied", so the menu doubles as an honest inventory.
- Tone stays automatic. Colour vs inverse is a legibility decision the contrast
  authority already makes correctly against each ground; exposing it would let a
  founder ship a white mark on white paper. The menu says so in one line.
- The generated card shows a small caption of the mark actually drawn
  ("Stacked · Inverse"), so the result is verifiable rather than assumed.
- The choice sticks per piece for that venture, so regenerating the business
  card keeps the founder's mark instead of quietly reverting to Recommended.
- The section header gets one **Mark for all pieces** control with the same
  options, applied to the "Generate all" run.

## How the choice reaches the artwork

The preference is a *form* only, and it constrains selection rather than
replacing it: the compositor still resolves tone from the ground, and still
falls back — with the fallback recorded — when the requested form does not exist
for the ground being drawn (e.g. stacked requested, no stacked inverse: it uses
horizontal inverse rather than a light mark on dark paper).

## Technical notes

- `src/lib/collateral.functions.ts`: `generateCollateral(snapshotId, kinds,
  markForms?)` passes a `markForms: Record<kind, LogoForm>` map through every
  paginated slice so multi-page pieces stay consistent.
- `supabase/functions/venture-collateral/index.ts`: read `body.markForms`,
  validate against the four forms, and put the requested form for the current
  kind on the context as `ctx.markForm`. Persist the map on
  `venture_brand_kits.collateral_mark_forms` (new jsonb column, default `{}`)
  so the choice survives reloads; return the effective form per piece in the
  generate response.
- `supabase/functions/_shared/collateral-svg.ts`: `markSvgFor()` takes
  `ctx.markForm` as the first preference and orders candidates
  `requested form → current aspect-based default → remaining forms`, keeping the
  existing dark/light split intact. `logoAspect()` and `isLockup()` already call
  `markSvgFor`, so sizing follows the chosen artwork with no further change.
  `markAt` records `data-mark-form` alongside the existing `data-mark-art`.
- `src/components/hub/brand/CollateralPieceCard.tsx`: add the split generate
  button and the "mark used" caption; the available-forms list comes from the
  brand kit `logos` array already loaded by the Brand Studio.
- `src/components/hub/brand/BrandCollateral.tsx`: hold the per-kind selection,
  pass it into the mutation, and show the section-level control.
- Tests: extend `logo-form.test.ts` with cases proving an explicit form wins over
  the aspect default, and that a missing form falls back within the correct tone.
- Redeploy `venture-collateral`.
