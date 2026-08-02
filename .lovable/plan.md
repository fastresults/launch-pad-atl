## Confirmed root cause

This is not browser zoom or a stale deployment. The live CSS creates two different desktop compositions:

- **960–1279px:** 40px logo, 44px headline, 832px × 188px prompt, 22px input, 15px CTA.
- **1280px+:** 32px logo, 42px headline, 800px × 152px prompt, 18px input, 13px CTA.

That first desktop band is materially larger, so common laptop and scaled preview widths render the over-magnified composition. The CSS comment says desktop should use one compact scale, but the implementation still has two conflicting desktop tiers.

A second breakpoint defect contributes to the inconsistency: the custom `lg` breakpoint is declared inside `@theme inline`, while the hero uses hand-written 60rem media queries. This can leave Tailwind’s header utilities and the hero rules switching at different boundaries.

## Implementation

1. **Align the desktop breakpoint**
   - Move the custom `--breakpoint-lg: 60rem` token into a standard `@theme` block.
   - Keep semantic color/radius aliases in `@theme inline`.
   - Ensure header `lg:` utilities and hero desktop rules both switch at exactly 960px.

2. **Replace the two desktop size tiers with one composition**
   - Collapse the 960–1279px and 1280px+ sizing rules into one `min-width: 60rem` block.
   - Lock desktop geometry to the compact reference values already measured at 1280px+:
     - Header: 52px
     - Logo: 32px high
     - Headline: 42px
     - Prompt: 800px × 152px
     - Input: 18px
     - CTA: 13px with compact padding
   - Wide viewports may add surrounding whitespace only; they must not enlarge components.

3. **Make vertical placement deterministic**
   - Keep the complete kicker/headline/prompt/label stack centered as one unit, slightly above the viewport midpoint.
   - Use the same stack dimensions at 1000, 1280, 1576, and 1920px.
   - Allow only viewport-height spacing to vary, not element scale.

4. **Remove conflicting legacy desktop overrides**
   - Delete the obsolete 60–79.999rem magnification rules rather than overriding them again.
   - Keep the hero’s glass/input isolation from the broader marketing styles, but eliminate duplicate sizing paths.

5. **Validate before publishing**
   - Measure local output at 1000×800, 1280×720, 1576×1043, and 1920×1080.
   - Confirm identical logo, headline, prompt, input, and CTA dimensions across all desktop widths.
   - Compare screenshots for whitespace and vertical placement.
   - Publish, then repeat the same DOM measurements on `startuplabs.online` to confirm the deployed composition matches local exactly.