## Confirmed root cause

The hero is not controlled by one layout. Its geometry is currently split across:

- Tailwind sizing and spacing in `CinematicHero.tsx` and `IdeaPrompt.tsx`.
- A second base geometry layer in `src/styles.css`.
- A third desktop geometry layer inside the `60rem` media query.
- Repeated `max-width`, height, margin, padding, and `!important` declarations that override one another.
- Header dimensions governed separately from the hero, despite both forming the first-viewport composition.

Examples already confirmed in the source include three competing prompt widths (`940px`, `58.75rem`, and `50rem`), two hero minimum-height paths, and spacing defined simultaneously in JSX and late CSS. Continuing to append overrides will preserve the failure mode.

## Rebuild

1. **Remove the existing hero implementation rather than override it again**
   - Replace the current `CinematicHero` and `IdeaPrompt` presentation markup with a clean, purpose-built structure.
   - Delete the legacy `.hero-*` layout rules that control geometry, spacing, and typography.
   - Preserve only the working business behavior: randomized scenes, type animation, user input takeover, modal launch, and “Now building” label.

2. **Build one isolated first-viewport composition**
   - Use one hero root, one background layer, and one centered content stack.
   - Make the hero occupy exactly the visible area below the header, not `100vh` plus the header.
   - Reproduce the compact reference at the current 1576×1043 viewport:
     - Compact 52px header and 32px logo.
     - Content stack centered slightly above the visual midpoint.
     - 42px headline.
     - 800px × 152px prompt panel.
     - 18px prompt text and compact footer controls.
     - Large uninterrupted margins around the stack.
   - Keep these desktop dimensions stable from 960px upward; wider screens gain whitespace, not larger components.

3. **Rebuild the glass prompt as a fixed internal grid**
   - Separate the input row from the caption/action row so content cannot stretch the panel.
   - Preserve the translucent dark glass, blur, border, and compact pill CTA shown in the reference.
   - Prevent animated text, focus state, or button content from changing the panel dimensions.

4. **Align the header with the same composition**
   - Keep the existing navigation destinations and authenticated links.
   - Lock the desktop header height, logo, nav type, gaps, and reserve CTA to the compact proportions visible in the reference.
   - Retain the existing mobile menu as a separate breakpoint composition.

5. **Make the rebuild resistant to cascade regressions**
   - Give the new hero a new scoped class namespace instead of reusing the accumulated `.hero-*` layout selectors.
   - Keep all responsive geometry in one contiguous CSS section with only mobile and desktop states.
   - Remove obsolete selectors after the replacement so no legacy rule can affect the new markup.

## Verification and deployment

- Verify rendered dimensions and screenshots at 1000×800, 1280×720, 1576×1043, and 1920×1080.
- At 1576×1043, compare the rebuilt output directly with the attached compact reference, including header height, stack coordinates, prompt dimensions, and surrounding whitespace.
- Test scene rotation, Ken Burns motion, typed prompt takeover, modal opening, and reduced-motion behavior.
- Run the project build and lint checks.
- Run the required security check, publish the verified build, then inspect `startuplabs.online` at the same viewport with a cache-busted request.
- Compare local and deployed DOM measurements and screenshots; if they differ, diagnose the served build/version and republish only after the deployed output matches the compact reference.