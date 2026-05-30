# Use the real StartupLabs logo everywhere

## Problem

- `src/components/admin/AdminSidebar.tsx` renders a hand-rolled blue "SL" tile + the word "Admin" instead of the real brand logo. That's what's in the screenshot.
- `src/components/site/Header.tsx` and `src/components/site/Footer.tsx` use the real `StartupLabsLogo`, but hardcode `text-white` on it. The "startup" wordmark uses `currentColor`, so in light mode it becomes invisible (white on white).
- `src/routes/_authenticated/dashboard.tsx` already does it right (`text-foreground`) — we'll match that pattern everywhere.

## Plan

### 1. Add a compact mark for collapsed sidebars

Create `src/components/brand/StartupLabsMark.tsx` — a small SVG containing only the gradient leaf glyph from `StartupLabsLogo` (same `<defs>` + leaf `<path>`, square viewBox `0 0 174.28 174.28`). Theme-agnostic (gradient stays the same in light/dark). Used when the sidebar is collapsed to icon mode.

### 2. Fix the admin sidebar header

In `src/components/admin/AdminSidebar.tsx`, replace the SL tile + "Admin" label with:

- Expanded state: `<StartupLabsLogo className="h-7 w-auto text-foreground" />` (wordmark uses `currentColor`, so it flips correctly between light and dark).
- Collapsed (`group-data-[collapsible=icon]`) state: `<StartupLabsMark className="h-6 w-6" />`.

Toggle via the existing `group-data-[collapsible=icon]:hidden` / `:block` utilities so we don't need extra state.

Keep the wrapping `<Link to="/admin">`.

### 3. Make the public site logo theme-aware

In `src/components/site/Header.tsx` (both desktop and mobile sheet) and `src/components/site/Footer.tsx`, change `text-white` on the `<StartupLabsLogo />` to `text-foreground`. The leaf gradient stays untouched; the "startup" wordmark now adapts to the current theme. Header background is already `bg-background/70`, so contrast is correct in both modes.

### 4. Sanity-check the rest

Grep for any other ad-hoc "SL" / placeholder logo tiles in admin/dashboard/auth pages and swap them for `StartupLabsLogo` (`text-foreground`) if found. Known good: `dashboard.tsx` already uses `text-foreground`.

## Files touched

- new: `src/components/brand/StartupLabsMark.tsx`
- edit: `src/components/admin/AdminSidebar.tsx`
- edit: `src/components/site/Header.tsx`
- edit: `src/components/site/Footer.tsx`

No backend, schema, or routing changes.
