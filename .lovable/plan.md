# Clean-Slate Public Website Recovery

## Confirmed diagnosis

- At identical Playwright CSS viewports, the current local Lovable render, Lovable-published URL, and custom domain produce the **same computed geometry**. At 1027, 1400, and 1576 CSS pixels, the H1, hero panel, viewport scale, root scale, and element positions matched exactly; the published and custom-domain pages also loaded the same release and CSS bundle.
- There is no production-only `zoom`, root transform, alternate stylesheet, service worker, hostname branch, or missing viewport tag in the current code.
- Therefore, the current evidence does **not** support another publish-cache patch. The remaining mismatch is between the intended visual proportions and the accumulated public styling architecture, plus the difference between a monitor’s physical resolution and the browser’s actual CSS viewport.
- The public styling is now structurally fragile: one 1,256-line global stylesheet combines app tokens, workshop slide styles, a legacy color-remapping bridge, broad selectors with `!important`, global public-page typography overrides, and several generations of hero recovery rules. Continuing to patch this file is the wrong strategy.

## Recovery principle

Treat the public website as a new presentation layer, not as a new product:

- Preserve every approved word, image, video, route, form, modal, and interaction.
- Preserve the cinematic navy visual direction.
- Rebuild section framing, typography, spacing, containers, navigation, and responsive behavior from a clean foundation.
- Do not modify the authenticated app, database, workshop tools, or business logic.

## Phase 1 — Freeze and capture the reference

1. Capture the current Lovable canvas at its actual **1576×1043 CSS-pixel viewport** as the primary visual reference.
2. Record reference screenshots and computed geometry for the homepage and every public route.
3. Add explicit comparison viewports for 390, 768, 1024, 1280, 1400, 1576, and 1920 CSS pixels.
4. Record `innerWidth`, `visualViewport.scale`, DPR, loaded release ID, CSS asset name, font sizes, container widths, and section bounds with every capture.
5. Keep the current implementation available as a temporary reference until the replacement passes parity; do not continue editing it.

## Phase 2 — Create an isolated public design system

1. Extract public styling from the shared global stylesheet into a dedicated marketing entry layer.
2. Keep the global stylesheet limited to Tailwind, app-wide tokens, resets, and authenticated-product styles.
3. Define a small semantic public token system for:
   - canvas and surfaces
   - foreground and muted copy
   - accent and borders
   - typography sizes and line heights
   - page gutters and maximum content widths
   - section spacing
   - header height
   - buttons, glass panels, and media treatments
4. Use a documented breakpoint model based on **CSS viewport width**, not monitor resolution or DPR.
5. Remove public reliance on arbitrary legacy color selectors, wildcard class matching, and broad `!important` overrides.
6. Load fonts through the document head rather than remote CSS imports.

## Phase 3 — Rebuild the public shell first

1. Build one clean public layout shell containing:
   - top-line navigation
   - page canvas
   - responsive content container
   - section primitive
   - display-heading and body-copy primitives
   - shared CTA styles
   - footer
2. Rebuild the cinematic hero inside this system with one authoritative rule set.
3. Use bounded containers and stable typography steps instead of compensating media-query patches.
4. Ensure the hero and first section remain balanced at every target viewport without browser-specific or production-specific branches.
5. Verify the shell locally and on a temporary published release before migrating page sections.

## Phase 4 — Migrate public pages section by section

Migrate in controlled groups rather than rewriting everything at once:

1. Homepage hero and homepage sections.
2. Services and build pages.
3. Workshop and one-on-one pages.
4. Remaining public informational and conversion pages.

For each group:

- Move existing content and behavior into the new section primitives.
- Remove page-local sizing hacks and legacy color classes.
- Compare against the reference captures at all target widths.
- Publish and compare the deployed result before proceeding to the next group.

## Phase 5 — Remove the failed styling generations

After all public routes pass:

1. Delete the legacy marketing bridge and old public typography/spacing overrides from the global stylesheet.
2. Delete superseded hero rules, compact-desktop patches, and release-time visual compensation code.
3. Retain only styles genuinely used by the authenticated product and workshop slide deck.
4. Confirm no public component depends on removed selectors or raw legacy color classes.

## Phase 6 — Bulletproof preview-to-production verification

Replace the current “same geometry means good” check with two separate gates:

### Gate A: Visual-quality gate

- Screenshot comparison against approved reference images at each target viewport.
- Hard limits for headline size, line length, section width, header height, CTA size, and vertical rhythm.
- Overflow, overlap, and text-clipping detection across all public routes.

### Gate B: Deployment-parity gate

- Compare local and published release IDs and CSS asset hashes.
- Compare exact computed styles and bounding boxes at identical CSS viewports.
- Fail if viewport scale is not 1, root/body are transformed, fonts fail to load, or production assets differ from the intended release.
- Run against both the Lovable URL and `startuplabs.online` after every public-page deployment.

## Acceptance criteria

The rebuild is complete only when:

- The approved Lovable reference and published site match at the same CSS viewport.
- All public routes share one consistent navigation, typography, container, and section system.
- No public layout depends on the legacy remapping bridge or emergency `!important` sizing rules.
- The homepage and representative inner pages pass visual review at every target viewport.
- Lovable URL and custom domain load the same release, assets, fonts, and geometry.
- Content, imagery, videos, forms, AI modal, links, and conversion flows remain intact.

## Implementation boundary

This is a **public presentation-layer rebuild**. It will not replace the authenticated application, backend, content, conversion logic, or route structure. The first implementation milestone will be the new public shell plus homepage; no legacy CSS will be deleted until that replacement is visibly approved and verified on a published test.