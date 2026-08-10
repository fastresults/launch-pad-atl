# Tier-one graphics quality system

The attached brand-guideline pages show release-blocking defects: color metadata is stacked on the same baselines, the knockout logo is effectively black on charcoal, spacing and alignment drift between specimens, and the page hierarchy is inconsistent. These are not isolated styling mistakes. The current system detects only some text-to-text collisions, does not test text against rules/swatches/logos, and explicitly stores collateral that fails QC. Other graphic workflows use separate, duplicated QA and retry logic, so fixes do not propagate globally.

## What is wrong and why it keeps recurring

- **The Colour page is built from fixed Y coordinates.** Labels and HEX/RGB/CMYK/Pantone rows are positioned with independent offsets instead of a measured vertical stack. The minimum-type backstop can enlarge text after placement, creating the overlap visible in the screenshot.
- **Collision detection is incomplete.** It estimates boxes for `<text>` elements only. It does not detect collisions with rules, swatches, logos, cards, clipping boundaries, or safe zones, and it approximates font height rather than reading the final raster.
- **Logo contrast validation checks metadata, not the visible pixels.** A reversed asset can be marked as “reversed” while its actual raster/vector ink remains dark. The screenshot’s knockout specimen therefore passes the wrong abstraction while remaining unreadable.
- **QC currently warns and publishes.** The collateral function records a failed verdict, logs it, then stores both SVG and PNG for the founder. A production gate that still publishes a failed asset is not a gate.
- **The response to collisions is global shrinking.** Re-rendering the whole piece at 92% does not repair incorrect baselines or object collisions, and can create undersized or weak typography.
- **Graphic pipelines are fragmented.** Collateral, covers, ads, logos, mood boards, and generated photography each implement different contrast, safe-zone, font, validation, and retry logic. Luminance math exists in multiple files and the cover/ad retry flows are duplicated.
- **There is no representative visual regression suite.** No graphics tests currently protect long names, dense addresses, eight-color palettes, light/dark logos, raster logos, unusual font metrics, or every supported aspect ratio.

## Phase 1 — Stop defective assets from shipping

- Change graphic publication to a two-stage lifecycle: **render to quarantine → validate → promote**. Never replace the current approved asset until the candidate passes.
- Make these hard failures across all graphics: overlap, clipping, unsafe margin, unreadable contrast, invisible logo, wrong logo variant, missing font, malformed output, minimum type violation, or off-canvas content.
- Preserve the last valid asset when regeneration fails and return a clear “couldn’t pass quality review” status with machine-readable reasons.
- Add bounded corrective retries. Retry only the failed dimension, then use a deterministic safe composition. If the fallback fails, stop rather than publish.
- Log one shared quality record per candidate: workflow, asset/page, attempt, checks, observed values, correction, final disposition, and renderer version.

## Phase 2 — Repair the brand-guideline renderer

- Rebuild every guideline page with measured layout primitives: vertical flow stacks, intrinsic object boxes, explicit gutters, baseline rhythm, and container bounds. Remove hand-tuned text-row offsets.
- Build the Colour page as reusable swatch cells. Each cell measures and stacks role, HEX, RGB, CMYK, and Pantone; all cells in a row share a calculated height. Normalize role names and display labels before composition.
- Replace the post-render minimum-font regex with type sizing during layout so typography cannot grow after coordinates have been calculated.
- Rebuild the Logo page as a specimen grid with consistent frames, captions, optical sizing, and clear-space rules. Sample the final rendered logo region against its surface and require WCAG-style contrast/visible-edge coverage, regardless of which variant metadata was selected.
- For dark surfaces, validate the actual reversed artwork; if it is not visibly reversed, recolor a tintable vector deterministically or place an untintable raster on a compliant light plate.
- Validate the complete page geometry: text-to-text, text-to-shape, text-to-rule, logo-to-caption, object-to-safe-zone, and object-to-canvas.
- Re-render the full five-page guideline set for the current venture and require every page to pass before replacing the existing files.

## Phase 3 — Create one shared graphics quality kernel

- Consolidate color parsing, sRGB luminance, contrast ratio, ink selection, and light/dark classification into one shared module and replace the competing implementations.
- Standardize a unit-aware geometry model for canvas, trim, bleed, safe area, protected platform zones, object bounds, and minimum gaps.
- Consolidate font loading, real glyph measurement, wrapping, fitting, truncation, line-height, and final text bounds into one type engine usable by print and screen renderers.
- Introduce one shared `RenderVerdict` contract with severity, check ID, object IDs, observed/required values, and whether a deterministic correction exists.
- Introduce one shared render gate/orchestrator for candidate generation, validation, targeted correction, bounded retry, deterministic fallback, promotion, and replacement cleanup.
- Adapt the logo jury and image relevance review into the same verdict format while keeping deterministic geometry/contrast checks authoritative.

## Phase 4 — Apply the gate to every graphics workflow

- **Collateral and guidelines:** full geometry, typography, logo, print-safe, and raster visibility checks; no failed-page storage.
- **Social covers and avatars:** unified protected-zone, logo saliency, brand contrast, crop, and mobile/desktop platform checks; remove copied retry blocks.
- **Content ads and social posts:** test headline/kicker/CTA/logo collisions, safe margins, text fit, readability over photography, and copy-to-image integrity.
- **Logo families:** validate visible contrast and clear space for primary, mono, reversed, symbol, and lockups on both light and dark reference surfaces.
- **Mood boards:** enforce exactly nine valid tiles, image integrity, palette/scene relevance, duplicate-image detection, and coherent color/exposure distribution.
- **Generated photography and PRD imagery:** turn prompt-only craft rules into post-render checks for exposure, subject visibility, malformed text/watermarks, crop safety, and scene relevance.
- **Exports and shared previews:** validate the final PDF/PNG/Word render, not only the source SVG, because rasterization and pagination can introduce new clipping or font substitution.

## Phase 5 — Regression testing and production observability

- Create golden fixtures for long and short startup names, long addresses, missing fields, eight palette roles, near-white colors, near-black colors, serif/sans fonts, extreme logo aspect ratios, raster/reversed logos, and multilingual glyphs.
- Add unit tests for measurement, contrast, bounds, safe zones, variant selection, and correction decisions.
- Add snapshot/image-diff tests for every guideline page and each major graphic aspect ratio. Keep tolerances narrow around text and logo regions.
- Add an end-to-end regeneration test proving a failed candidate never replaces the last valid asset and a passing candidate removes superseded files.
- Track pass rate, retry rate, fallback rate, failure reason, renderer version, and workflow. Alert on repeated failures or quality regressions instead of relying on founders to discover them.
- Add an internal QA view showing the candidate, failed regions, measured values, attempts, and final disposition for support and super admins.

## Release order and acceptance bar

1. Ship the quarantine/promotion rule and block failed collateral immediately.
2. Repair and regenerate brand guidelines, then verify the current venture visually at full size.
3. Extract the shared color, geometry, typography, verdict, and render-gate modules.
4. Migrate collateral, covers, ads, logos, mood boards, generated imagery, and exports in that order.
5. Enable regression tests and production quality telemetry before calling the system tier one.

The work is complete only when the uploaded examples regenerate with no overlaps, every logo specimen is visibly legible on its surface, all text stays inside measured bounds, every page passes the shared gate, and intentionally broken fixtures are rejected without replacing the last approved asset.