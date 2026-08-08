# Replace framework stage sketches with the animated marks

Swap the hand-drawn hatched SVG sketches next to each of the eight framework stages for the animated versions you uploaded. Same placement and size — they just come alive.

## Where they appear

`StageSketch` renders in two places, both driven by the stage number:
- Home framework section (`HomeFramework.tsx`)
- Landing framework section (`LandingFramework.tsx`)

Replacing the one component updates both, so nothing else has to change.

## Mapping (by stage name, not file number)

| Stage | Uploaded file |
| --- | --- |
| 01 Foundation | 02-foundation.svg |
| 02 Strategy | 03-strategy.svg |
| 03 Operations | 07-operations.svg |
| 04 Finance | 08-finance.svg |
| 05 Governance | 09-governance.svg |
| 06 Brand | 04-brand.svg |
| 07 Marketing | 05-marketing.svg |
| 08 Social & Content | 06-social-content.svg |

`01-overview.svg` has no matching stage. Proposed use: the framework section heading (a small mark beside "The framework" intro). Say the word if you'd rather it go unused or somewhere else.

## Design adjustments before they go in

The uploads are self-contained with hardcoded hex colors and their own `prefers-color-scheme` rules. To keep them on-brand:
- Replace `--acc` hexes (`#7F77DD`, `#D85A30`, `#1D9E75`) with the project's primary/accent token so all eight read as one family instead of three unrelated palettes.
- Replace `--ink` / `--dim` with `currentColor` at reduced opacity, so the marks keep inheriting the section's ink like today.
- Drop the internal `prefers-color-scheme` block — the site controls dark/light itself, and that media query would fight the theme toggle.
- Honor `prefers-reduced-motion`: freeze animations at their resting state for users who ask for less motion.

## Technical notes

- Rewrite `src/components/home/StageSketch.tsx`: keep the `{ stage, className }` API and the wrapper `<svg>`, swap the `viewBox` to `0 0 240 240`, and replace each case's paths with the animated markup.
- Animation CSS moves out of inline `<style>` tags (nine copies of the same class names on one page would collide) into scoped, prefixed keyframes in `src/styles.css` — one shared block, class names namespaced like `stagemark-*`.
- Delete the now-unused `Hatch` helper and the old path data.
- No changes to data, routes, or backend.
