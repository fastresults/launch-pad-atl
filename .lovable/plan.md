## Goal
Make every brand-palette swatch clickable so the founder can recolor any token (bg, fg, accent, primary, secondary, border, onAccent, onPrimary, onSecondary, muted) at any time. The updated palette persists to the brand kit and is picked up automatically by all downstream generators (Social Studio covers, Content Studio ads, Regenerate dialog, style guide).

## Where the palette lives
`brand_kits.palette.colors` — a keyed object (`bg`, `fg`, `accent`, `primary`, `secondary`, `border`, `onAccent`, `onPrimary`, `onSecondary`, `muted`). All cover/ad edge functions already read `kit.palette` at request time, and `RegenerateAssetDialog` already accepts a `paletteOverride`. Nothing in the generation pipeline needs new inputs — we just need the stored palette to be user-editable.

## Changes

### 1. New shared component: `src/components/hub/brand/EditablePaletteSwatch.tsx`
- Small square button. Shows the current color, token label on hover.
- Click opens a popover with:
  - Native `<input type="color">` bound to the value.
  - Hex text input (validated `#RRGGBB`).
  - "Reset to original" (uses the value snapshot from when the modal opened).
- On change, calls `onChange(tokenKey, hex)` (debounced ~250 ms so drag doesn't spam saves).
- Renders a small pencil overlay on hover so it's discoverable.

### 2. `BrandWizard.tsx` — StepReview palette block (~lines 920–930) and the small Palette summary elsewhere
- Replace the read-only `<div>` swatches with `<EditablePaletteSwatch>`.
- Wire `onChange` to:
  ```ts
  const next = { ...kit.palette, colors: { ...kit.palette.colors, [key]: hex } };
  onSave({ palette: sanitizePaletteOption(next) });
  ```
- Run `sanitizePaletteOption` + `validatePalette` after each edit; if contrast drops below AA, show an inline warning ("Low contrast against bg — text may be hard to read") but still save (user intent wins). Offer a "Repair to AA" button that runs the same repair path already used in StepPalette.
- After save, invalidate `["brandKit", snapshotId]` so BrandStudio, Social Studio, Content Studio, AssetPreviewDialog all refresh with the new colors.

### 3. `BrandStudio.tsx` compact palette strip
- Same swap: read-only swatch → `EditablePaletteSwatch`, same save path. Gives the founder a persistent edit surface outside the wizard modal.

### 4. `AssetPreviewDialog.tsx` palette row (line ~167)
- Keep read-only here (preview context), but add a "Edit brand palette" link that opens the Brand Wizard at StepReview. Avoids drift between per-asset palette overrides and the master palette.

### 5. Downstream propagation (no code change required, verified by inspection)
- `venture-social-cover`, `venture-content-ad`, `venture-brand-assets`, `brand-creative` all fetch `brand_kits` fresh on invocation → new palette is used automatically for the next Generate / Regenerate.
- Assets already generated are unaffected (as expected). "Regenerate" on an existing tile picks up the new palette.
- `RegenerateAssetDialog`'s per-asset `paletteOverride` continues to work and now defaults to the (edited) master palette.

## Out of scope
- No retroactive re-render of already-generated images.
- No change to typography editing (separate follow-up).
- No new DB columns — reuses `brand_kits.palette` shape.

## Files touched
- New: `src/components/hub/brand/EditablePaletteSwatch.tsx`
- `src/components/hub/brand-wizard/BrandWizard.tsx`
- `src/components/hub/BrandStudio.tsx`
- `src/components/hub/social/AssetPreviewDialog.tsx`
