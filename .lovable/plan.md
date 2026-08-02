# Public-page desktop scale recovery

The screenshots expose the real failure: this is not a browser-wide `zoom` problem. At the effective viewport shown, the source itself activates large `lg` typography (`text-7xl`, `4.3rem`), generous vertical spacing, and narrow content widths. That makes every public page look enlarged even though the header and visual viewport are technically at scale 1. The previous parity test only proved that preview and production matched each other; it did not prove that either one looked correct.

## 1. Replace the false parity gate with a visual-size gate

- Stop treating matching preview/production rectangles as success.
- Record the effective CSS viewport, screen dimensions, DPR, `visualViewport.scale`, root font size, headline size, body-copy size, container width, and first-viewport content density.
- Add explicit acceptable desktop ranges at 1024, 1190/1200, 1280, 1400, 1576, and 1920 CSS pixels.
- Fail when a headline, paragraph, card, header, or section consumes too much of the viewport—even if preview and production are identical.

## 2. Create one restrained desktop scale for every public page

- Introduce shared public-page geometry tokens for header height, page gutter, content width, headline sizes, body sizes, card padding, and section spacing.
- Treat 1024–1439px as a compact desktop/tablet-landscape tier rather than applying the current oversized `lg` composition.
- Reserve the largest display sizes for genuinely wide screens only.
- Remove page-specific oversized values such as the workshop `text-7xl`, homepage `4.3rem` headline, and excessive `md:py-24` spacing where they break first-viewport density.
- Preserve the current midnight visual design, copy, imagery, and page structure; only correct scale and composition.

## 3. Recompose the affected first viewports

- **Homepage cinematic hero:** keep the current centered scene, but size the headline and glass prompt from bounded design tokens rather than viewport-percentage growth.
- **Homepage copy section:** fit the headline, opening copy, image, and price panel into a balanced desktop composition without giant type or below-fold truncation.
- **Workshops index:** reduce the “Actually built. Live by lunch.” headline, paragraph measure, top spacing, and side-panel scale so the section reads as a normal desktop page.
- **All other public routes:** apply the same scale system to `/services`, `/schedule`, `/build/:slug`, `/facilitator`, `/contact`, `/webinar`, `/one-on-one`, `/register`, and legal pages so no route retains the enlarged legacy sizing.
- Keep mobile behavior separate and unchanged unless a shared rule would otherwise regress it.

## 4. Remove competing legacy styling

- Consolidate the public-page typography and geometry rules instead of layering more overrides onto the legacy literal bridge.
- Eliminate conflicting hardcoded headline sizes and redundant responsive classes from the affected page components.
- Keep the isolated `sl-*` hero namespace, but make it consume the same shared desktop scale tokens as the rest of the public site.

## 5. Verify the actual failure conditions before publishing

- Capture full viewport—not full-page—screenshots for homepage, workshops, services, and one workshop detail at every acceptance width.
- Compare the 1190/1200 and 1400 cases directly with the attached screenshots, because those are the sizes the earlier checks failed to represent.
- Assert no overlap, horizontal overflow, cropped first-viewport content, unintended mobile navigation, or display headline above the approved size range.
- Run the same measurements against the published custom domain after deployment and require both release identity and visual-size acceptance.
- Do not declare success from code inspection, build output, or local/production parity alone; success requires published screenshots at the failing desktop sizes.