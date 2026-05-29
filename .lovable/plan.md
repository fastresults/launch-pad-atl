## Problem

The `startuplabs-logo.svg` hard-codes `fill:#fff` for the "startup" wordmark (class `cls-3`). On the public site that's fine (dark backgrounds), but the dashboard sidebar now uses it on a light background in light mode → "startup" disappears (white on white). SVGs loaded via `<img src>` can't react to the page's theme.

## Fix

Make the wordmark color **theme-aware** by inlining the SVG as a React component and using `currentColor` for the "startup" letters, then control color with a Tailwind class per usage.

### 1. New component: `src/components/brand/StartupLabsLogo.tsx`

- Inline the full SVG markup from `src/assets/startuplabs-logo.svg`.
- Replace the `cls-3 { fill: #fff }` rule with `cls-3 { fill: currentColor }`.
- Keep `cls-1` (#628acf blue "labs") and the gradient leaf untouched — they read on both light and dark.
- Accept `className` so callers control sizing + text color.
- Default `aria-label="StartupLabs"`, `role="img"`.

### 2. Use it in the dashboard sidebar

`src/routes/_authenticated/dashboard.tsx`:
- Remove `import logoUrl from "@/assets/startuplabs-logo.svg"`.
- Import the new component and render `<StartupLabsLogo className={collapsed ? "h-6 text-foreground" : "h-7 text-foreground"} />`.
- `text-foreground` is near-black in light mode and near-white in dark mode → "startup" stays legible in both.

### 3. Update public Header + Footer to use the component too

`src/components/site/Header.tsx` and `src/components/site/Footer.tsx`:
- Swap the `<img src={logoUrl}>` for `<StartupLabsLogo className="h-9 md:h-12 text-white" />` (Header) and `h-9 md:h-10 text-white` (Footer). Both render on dark surfaces, so `text-white` preserves today's look exactly.
- This keeps a single source of truth — any future logo edit happens in one component.

### 4. Leave the SVG asset file alone

Keep `src/assets/startuplabs-logo.svg` for OG images, favicons, email, anywhere we need a real file. We only stop importing it into React.

## Verification

- Dashboard in light mode: "startup" is dark and readable next to the leaf and blue "labs".
- Dashboard in dark mode: unchanged (white on dark).
- Public marketing site: identical to today.
- Sidebar collapsed: smaller logo, still legible in both themes.

## Out of scope

No copy changes, no other routes touched, no asset replacement.
