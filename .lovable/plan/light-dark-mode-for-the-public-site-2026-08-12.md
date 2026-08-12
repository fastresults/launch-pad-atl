# Light / Dark mode for the public site

Today the marketing site is dark-only (the dark palette lives at `:root`, a light palette exists at `:root.light` but only Admin and Dashboard use it, pinned to light). This adds a real, remembered light/dark choice to the public pages, while the Home hero stays cinematic dark in both modes.

## What the visitor gets

- A sun/moon toggle in the site header (and in the mobile menu sheet) on all public pages.
- Choice is remembered between visits; first visit defaults to dark (today's look).
- Every public section — pillars, workshop cards, testimonials, offer, footer, dialogs — re-themes cleanly.
- The Home hero keeps its dark, photographic treatment in both modes. Light mode starts below the hero, so the fold still looks cinematic.

## Approach

1. **Public theme context**
   - Extend the existing theme provider with a `storageKey` so the public site persists under `site-theme` and never collides with the dashboard preference.
   - Wrap the public layout (header + routed page + footer) in the provider with no `forced` value, so the toggle is live. Admin/Dashboard stay `forced="light"` — unchanged.

2. **Header toggle**
   - Add the existing `ThemeToggle` to the header action group (desktop) and as a labelled row in the mobile sheet.
   - Hide it where a theme choice does not apply (Admin/Dashboard headers already have `locked`).

3. **Hero stays dark**
   - Pin `.sl-hero` to the dark token set regardless of the active theme, so hero text/scrims keep their contrast over the photography.
   - Give the header a dark-glass treatment while it overlaps the hero, and the themed treatment once scrolled past — no flashing of light chrome over dark imagery.

4. **Light-mode audit of public sections**
   - Sweep the public components for hardcoded dark-only colours (`text-white`, `bg-black`, `bg-[#…]`, fixed rgba scrims) and swap them for semantic tokens so both modes read correctly.
   - Priority surfaces: foundation pillars, workshop/build-layer cards, video testimonials, workshop offer + dialogs, business-ideas scroller, footer, header nav, mobile CTA bar.
   - Tune the `:root.light` public tokens where the current values (built for the dashboard grey) look flat on marketing pages — notably card, border, muted-foreground and the gradient/scrim tokens.

5. **Verification**
   - Screenshot each public route in both modes at desktop and mobile widths, confirm no unreadable text, no white-on-white cards, and that the hero is identical in both modes.

## Technical notes

- `ThemeProvider` gains an optional `storageKey` prop (default keeps `dashboard-theme`); it continues to toggle the `light` class on `<html>`.
- Hero pinning is done in `public.css` by scoping `.sl-hero` (and its kicker/title/prompt/status rules) to the dark token values rather than the inherited theme variables, so no component logic changes.
- No backend, data, or routing changes.

## Out of scope

- Theme choice for Admin/Dashboard (they remain light-only).
- Any copy or layout changes.
