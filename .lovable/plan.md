## Goal

Replace the orange→pink gradient text styling (`.text-gradient-brand`) shown in the screenshots with a solid color `#097ad9` (blue), keeping all current usages intact.

## Change

Single-file edit in `src/styles.css` — redefine the `text-gradient-brand` utility to render a solid color instead of a clipped gradient. All 18 existing usages across `index.tsx`, `register.tsx`, and `schedule.tsx` will pick up the new color automatically; no component edits required.

```css
@utility text-gradient-brand {
  color: #097ad9;
  background-image: none;
  -webkit-background-clip: initial;
  background-clip: initial;
}
```

The unrelated `bg-hero-gradient` (used for buttons, pills, backgrounds) is left untouched — only the text gradient is affected.

## Out of scope

- `bg-hero-gradient` button/background usages remain as-is.
- Hero section background image unchanged.
