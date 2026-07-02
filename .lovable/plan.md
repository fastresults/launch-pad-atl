## Goal
Replace the native OS `<input type="color">` in the palette swatch popover with a proper in-app **color wheel + saturation/lightness picker** so founders can visually dial in a color without relying on the browser's tiny system picker.

## Library
Add [`react-colorful`](https://github.com/omgovich/react-colorful) (~2.8 kB, zero-dep, already the de facto shadcn/Radix companion picker). Two components we need:
- `HexColorPicker` — the square saturation/value area with hue slider underneath (the "color wheel" experience the screenshot is asking for).
- `HexColorInput` — validated hex text field (drop-in replacement for our current `Input` + regex).

Install: `bun add react-colorful`.

## Changes (single file)

### `src/components/hub/brand/EditablePaletteSwatch.tsx`
Rework the `PopoverContent` body only. Trigger button, debounce, reset behavior, and the `onChange(hex)` contract stay the same — so BrandWizard and BrandStudio need **no** changes.

New popover layout (top → bottom):

1. **Header row** — token label (e.g. `MUTED`) + "Reset" link (unchanged).
2. **Color picker** — `<HexColorPicker color={draft} onChange={commitDebounced} style={{ width: '100%', height: 160 }} />`. This gives:
   - Large saturation/value square (click + drag).
   - Hue slider strip underneath (the "wheel").
   - Live drag updates, debounced 250 ms into `onSave` (same as today).
3. **Hex input row** — `<HexColorInput prefixed color={draft} onChange={commit} />` styled with our existing `Input` classes so it matches the rest of the UI. Keeps keyboard entry / paste-a-hex workflow.
4. **Recent / brand swatches row** *(optional, nice-to-have)* — six small buttons showing the other palette tokens' current colors so the user can quickly match "make muted the same as border". Skip if it bloats the popover; leave a TODO.
5. **Done** button — unchanged.

Remove:
- `<input type="color">` element.
- Local `isHex` regex + manual hex `<Input>` (react-colorful validates internally).

Keep:
- `size` prop, hover pencil overlay, `originalValue` reset, debounced commit, `onChange(hex)` signature.
- Popover width bumped from `w-64` to `w-72` to fit the picker comfortably; still fits inside the Review card.

### Styling
`react-colorful` ships its own CSS via `import "react-colorful/dist/index.css"` (add once at the top of `EditablePaletteSwatch.tsx`). Override just the border radius to match our tokens:

```css
.react-colorful { border-radius: 0.5rem; }
.react-colorful__saturation { border-radius: 0.5rem 0.5rem 0 0; }
.react-colorful__hue { border-radius: 0 0 0.5rem 0.5rem; height: 16px; }
```

Scoped via a wrapper class inside the component (no global CSS edits).

## Out of scope
- No changes to BrandWizard, BrandStudio, or any generator — the swatch's public API is unchanged.
- No alpha channel (palette tokens are opaque hex).
- No eyedropper API (Chromium-only, `EyeDropper` — can add later behind a `if ('EyeDropper' in window)` check).
- No preset-palette picker inside the popover (separate feature).

## Technical notes
- `react-colorful` is fully controlled: pass `color={draft}`, receive updates via `onChange`. It handles drag, touch, and keyboard.
- Debounce stays client-side; the DB write only fires 250 ms after the user stops dragging, so saturating the color area doesn't spam `upsertBrandKit`.
- Bundle impact: ~2.8 kB gzipped, tree-shakes to only `HexColorPicker` + `HexColorInput`.
