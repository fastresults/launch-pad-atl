# Fix partial-contrast logo failures

## Confirmed problem

The showcase is rendering the uploaded `reversed` SVG, but that file is not fully legible on the showcase surface. Its gold elements remain visible while its dark navy shield, `TAP` letters, and foundation name nearly disappear into the near-black card.

Both uploaded logo entries are present in the brand kit: a `primary` SVG and a separate `reversed` SVG. The failure is in the contrast test, not missing data or client-side theme selection. The current SVG analyzer averages all detected paints into one color. The passing gold raises that average enough for the endpoint to approve the entire multicolor mark even though the essential navy paint fails contrast.

## Build

1. **Replace average-color approval with per-paint contrast validation**
   - Extract the distinct visible SVG paints from attributes, CSS classes, and gradients.
   - Exclude transparent paint and full-canvas background shapes.
   - Measure each material foreground paint against the requested surface.
   - Reject a candidate when any material paint used by the mark falls below the logo contrast floor; one passing accent color can no longer hide a failing wordmark.

2. **Preserve brand colors while repairing failed SVGs**
   - If no stored candidate is fully legible, recolor only the paints that fail contrast.
   - On dark surfaces, convert failing dark paint to a light neutral while preserving compliant gold or other accent colors.
   - On light surfaces, convert only failing light paint to a dark neutral.
   - Keep the existing plate fallback for raster artwork that cannot be safely recolored.

3. **Make candidate selection prove the complete mark is usable**
   - Test the uploaded reversed sibling first on dark surfaces and the primary sibling first on light surfaces.
   - Serve a stored file unchanged only when all material paints pass.
   - Otherwise continue through the remaining variants before applying the selective repair.

4. **Prevent recurrence at upload and publication time**
   - Run the same per-paint audit for both light- and dark-surface previews in the logo studio.
   - Do not treat a filename or a `reversed` label as proof of contrast.
   - Show the repaired preview when an uploaded variant is only partially legible, so the committed result matches the showcase.

5. **Add regression coverage for this exact failure**
   - Test a gold-and-navy SVG on a near-black surface: the navy must fail even though gold passes.
   - Test selective repair: navy becomes light while gold remains gold.
   - Test the inverse case on white, CSS-declared colors, gradient stops, and full-bleed backgrounds.
   - Verify the dark showcase endpoint returns a fully visible complete logo and the light endpoint preserves the correct primary artwork.

## Technical scope

- Update the shared logo analyzer to return individual material paints and contrast results rather than one averaged ink value.
- Update the public logo endpoint to use all-paints-pass selection and selective SVG paint replacement.
- Reuse the same audit in the logo upload/approval flow.
- Keep the current share payload and `useSurfaceLogo` wiring; those are already requesting the correct dark-surface endpoint.
- No database migration or asset regeneration is required; existing shared links will resolve through the corrected endpoint after its short cache expires.