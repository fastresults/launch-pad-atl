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
  ● Recommended                  Stacked · Colour — chosen from the layout
  ─ Colour (for light grounds)
  ○ Symbol · Colour
  ○ Horizontal · Colour
  ○ Stacked · Colour
  ○ Wordmark · Colour            Not supplied
  ─ Inverse (for dark grounds)
  ○ Symbol · Inverse
  ○ Horizontal · Inverse
  ○ Stacked · Inverse
  ○ Wordmark · Inverse           Not supplied
```

All eight cells of the form × tone matrix are selectable — the same grid the
logo set panel already shows — so a founder can force the inverse stacked
lockup on a piece whose ground the machine reads as light.

- Cells with nothing in the logo set are listed but disabled, labelled
  "Not supplied", so the menu doubles as an honest inventory.
- Legibility is still enforced, not bypassed. If the chosen tone would be
  illegible on the ground a piece actually prints on (a light mark on white
  paper), the compositor keeps the choice's *form* and either knocks the mark
  out to a legible ink or sets it on a plate, exactly as it does today — and the
  card reports "asked for Inverse, printed as knockout on white" rather than
  shipping an invisible mark.
- The generated card shows a small caption of the mark actually drawn
  ("Stacked · Inverse"), so the result is verifiable rather than assumed.
- The choice sticks per piece for that venture, so regenerating the business
  card keeps the founder's mark instead of quietly reverting to Recommended.
- The section header gets one **Mark for all pieces** control with the same
  options, applied to the "Generate all" run.

## How the choice reaches the artwork

The preference is a form + tone pair. It constrains selection rather than
replacing the resolver: the compositor picks the requested cell when it exists,
falls back within the same tone first (stacked inverse missing → horizontal
inverse), then across tone with the contrast repair applied, and records which
fallback it took.


## Technical notes

- `src/lib/collateral.functions.ts`: `generateCollateral(snapshotId, kinds,
  markChoice?)` passes a `Record<kind, { form: LogoForm; tone: LogoTone }>` map
  through every paginated slice so multi-page pieces stay consistent.
- `supabase/functions/venture-collateral/index.ts`: read `body.markChoice`,
  validate form and tone against `LOGO_VARIANTS` in `_shared/logo-form.ts`, and
  put the requested pair for the current kind on the context as `ctx.markPick`.
  Persist the map on `venture_brand_kits.collateral_mark_choice` (new jsonb
  column, default `{}`) so the choice survives reloads; return the effective
  form, tone and any fallback per piece in the generate response.
- `supabase/functions/_shared/collateral-svg.ts`: `markSvgFor()` takes
  `ctx.markPick` as the first preference, ordering candidates
  `exact cell → same tone, other forms → same form, other tone → today's default`.
  Existing contrast repair (`resolveInk` / knockout / plate) runs unchanged on
  whatever artwork is picked. `logoAspect()` and `isLockup()` already call
  `markSvgFor`, so sizing follows the chosen artwork. `markAt` records
  `data-mark-form` and `data-mark-tone` alongside `data-mark-art`.
- `src/components/hub/brand/CollateralPieceCard.tsx`: add the split generate
  button with the eight-cell menu and the "mark used" caption; availability comes
  from the brand kit `logos` array already loaded by the Brand Studio, reusing
  `formToneOf`/`slotFor` so the menu matches the logo set grid exactly.
- `src/components/hub/brand/BrandCollateral.tsx`: hold the per-kind selection,
  pass it into the mutation, and show the section-level control.
- Tests: extend `logo-form.test.ts` with cases proving an explicit form+tone wins
  over the aspect/ground default, that a missing cell falls back within the same
  tone first, and that an illegible tone still ends up as a legible mark.

- Redeploy `venture-collateral`.
