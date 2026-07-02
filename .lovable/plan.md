## Goal
On the Brand Style Guide preview (the "Color System" section shown in your screenshot), every swatch — Primary, Secondary, Accent, BG, FG, Muted, Surface, Text, Success, Warning, Danger — becomes clickable. Clicking opens a color-wheel popover (saturation/value box + hue slider + hex input) so the founder can pick a new color visually. The change saves immediately to the brand kit's palette and re-renders the whole preview (headline color, section borders, typography accents) with the new value.

## What already exists (reuse, don't rebuild)
- `EditablePaletteSwatch` (`src/components/hub/brand/EditablePaletteSwatch.tsx`) — already wraps `react-colorful`'s `HexColorPicker` + `HexColorInput` in a Popover, with debounced onChange, Reset, and Done controls. It's the compact editor used in `BrandWizard.tsx`.
- `BrandWizard.tsx` already knows how to persist palette edits via `onSave({ palette: { ...kit.palette, colors: nextColors, source: "user-edited" } })`.
- `VisualBrandGuide.tsx` currently renders the Color System swatches as read-only cards (lines 119–132).

## Changes

### 1. `src/components/hub/brand-wizard/VisualBrandGuide.tsx`
- Accept two new optional props:
  - `onColorChange?: (tokenKey: string, hex: string) => void`
  - `originalColors?: Record<string, string>` (for the "Reset" affordance inside the popover)
- In the Color System grid, when `onColorChange` is provided:
  - Render each color card with the existing look (color block on top, label + hex + RGB below).
  - Overlay an `EditablePaletteSwatch` trigger that covers the color block, so clicking anywhere on the swatch opens the wheel. Show a small "click to edit" hover affordance (pencil icon + subtle overlay, same pattern the component already uses).
  - Pass `tokenKey={key}`, `value={value}`, `originalValue={originalColors?.[key]}`, and `onChange={(hex) => onColorChange(key, hex)}`.
- When `onColorChange` is not provided, keep today's read-only rendering (no behavioral change for any other caller / exports).

### 2. `src/components/hub/brand-wizard/BrandWizard.tsx`
- On the `<VisualBrandGuide kit={kit} snapshot={snapshot} />` call (line 989), wire the two new props:
  - `originalColors` = the palette from the last generation (already tracked when a kit is generated; if no snapshot exists, pass the current `kit.palette.colors`).
  - `onColorChange` = the same handler pattern already used at line 948:
    ```ts
    (key, hex) => onSave({
      palette: {
        ...(kit.palette ?? {}),
        colors: { ...(kit.palette?.colors ?? {}), [key]: hex },
        source: "user-edited",
      },
    })
    ```
- Add a tiny helper hint above the guide preview: "Click any color swatch to change it." (keeps discovery obvious without new UI chrome).

### 3. Nothing else changes
- No new dependencies (`react-colorful` is already installed).
- No DB migration — palette overrides already persist through the existing `onSave` → `brand_kits.palette` write.
- No changes to `BrandStudio.tsx` (already uses `EditablePaletteSwatch`) or any downstream renderer — since they all read `kit.palette.colors`, updates propagate automatically to Social Studio, Content Studio, DOCX export, and Logo Compositor.
- No changes to edge functions or prompts.

## Technical details

**Overlay pattern for the swatch trigger** (inside VisualBrandGuide's color card):
```tsx
<div className="relative h-24" style={{ background: value }}>
  {onColorChange && (
    <EditablePaletteSwatch
      tokenKey={key}
      value={value}
      originalValue={originalColors?.[key]}
      onChange={(hex) => onColorChange(key, hex)}
      size="lg"
      // renders an absolutely-positioned invisible-but-focusable trigger
    />
  )}
</div>
```
`EditablePaletteSwatch` already renders its own trigger button; we'll extend it with an optional `fill` mode (or wrap its trigger with `absolute inset-0`) so it stretches over the whole 96px-tall color block instead of the current 6×6 chip. That's a ~10-line addition to `EditablePaletteSwatch.tsx`:
- New prop `fill?: boolean`. When true, the trigger uses `absolute inset-0 h-full w-full rounded-none` and a translucent hover overlay with a centered pencil icon.

**Debouncing / save load**: `EditablePaletteSwatch` already debounces onChange at 250ms, so dragging around the color wheel won't spam the database; only the final resting hex hits `onSave`.

**Reset**: `EditablePaletteSwatch` already shows a "Reset" affordance when `originalValue` differs from `draft`, so founders can undo a swatch back to what Firecrawl/Brand Wizard originally derived.

## Out of scope
- No new color harmony suggestions or WCAG auto-repair on click (the existing "Repair contrast" button in BrandWizard stays where it is).
- No palette-name / rationale editing.
- No changes to typography, logo, or moodboard sections.

## Acceptance
- Clicking any swatch in the Brand Style Guide preview opens a color-wheel popover with hue slider and hex input.
- Selecting a color updates the swatch, its hex/RGB caption, and every other place in the preview that reads that token (headline color, section border, etc.) within one debounce tick.
- The change persists — refreshing the page keeps the new color.
- If you change your mind, "Reset" in the popover snaps the token back to the originally generated value.
