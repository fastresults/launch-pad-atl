## Brute-force published hero + header fix

The published page is loading the latest CSS (`52px` headline, `940px` form, `200px` glass panel), but the composition still does not visually match the reference. The remaining issue is the overall geometry and vertical placement, not a missing deployment.

### 1. Lock desktop geometry
- Replace the hero’s fluid `clamp()` sizing with explicit desktop values at `960px+`.
- Force the content wrapper to a fixed maximum width with generous viewport gutters.
- Lock the headline width and font size instead of allowing viewport-based growth.
- Lock the prompt panel to a compact height and prevent inherited/global styles from enlarging it.
- Use `!important` only on these narrowly scoped hero dimensions so production CSS ordering cannot override them.

### 2. Reposition the hero as one unit
- Remove the percentage transform that makes placement dependent on the group’s changing height.
- Position the kicker, headline, prompt, and “Now building” label with fixed desktop spacing as one centered stack.
- Keep the stack high enough to match the reference while preserving clear space above and below.

### 3. Lock the desktop header
- Give the header an explicit compact height, logo size, nav font size, gaps, and CTA dimensions.
- Preserve all desktop navigation at `960px+`; retain the existing mobile header below that breakpoint.
- Cap the inner header width and enforce consistent side gutters so links do not ride the viewport edges.

### 4. Add deterministic responsive bands
- Desktop (`1280px+`): reference composition with fixed headline, 940px prompt, and wide gutters.
- Compact desktop/tablet landscape (`960–1279px`): proportionally smaller fixed dimensions without switching to mobile UI.
- Mobile (`<960px`): retain the existing mobile composition.

### 5. Verify the real deployed surface
- Measure and screenshot the preview at 1280, 1576, and 1920 CSS pixels.
- Confirm no overflow, clipping, enlarged prompt, or collapsed navigation.
- Publish the change, then inspect `startuplabs.online` directly and compare its computed dimensions and screenshot against the preview and attached reference.