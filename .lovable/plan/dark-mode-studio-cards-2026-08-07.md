# Dark-mode Studio cards

Make the Brand / Social / Content Studio cards (and everything they reveal when expanded) always render on the dark theme, even when the rest of the dashboard is in light mode.

## Approach

Add a reusable **dark scope** to the design system instead of hardcoding dark colors in components. A single wrapper class re-declares the dark token values locally, so every child — headers, panels, buttons, badges, swatches — inherits the dark palette automatically and nothing else in the app changes.

1. **`src/styles.css`** — add a `.theme-dark-scope` block that repeats the `:root` (dark) token values, so it wins even when `:root.light` is active. Also set `color-scheme: dark` on it so native controls (scrollbars, inputs) match.
2. **`src/routes/_authenticated/dashboard/hub.$snapshotId.tsx`** — apply `theme-dark-scope` to the `#brand-studio` section that wraps the SectionHeader plus the expanded `BrandStudio`, `SocialStudio`, and `ContentStudio` bodies. Add a dark base background/rounding so the scope reads as an intentional dark slab against the light page rather than a color leak.
3. **Modals launched from inside the studios** (brand wizard, collateral preview/details, logo studio, asset preview, caption panel) render in a portal at `<body>`, so they fall outside the wrapper. Add the same `theme-dark-scope` class to those dialog content elements so an expanded studio flow stays dark end to end.
4. Sweep the three studio components for any light-only assumptions (e.g. `bg-white` plates behind logo previews). Artwork/logo preview plates intentionally stay white — printed pieces are white — but their surrounding chrome moves to dark tokens.

## Notes

- No business logic, data, or generation code is touched — presentation only.
- The rest of the venture hub keeps following the user's light/dark toggle.
