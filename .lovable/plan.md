## Plan: Make the Brand Style Guide truly WYSIWYG

### What is going wrong
- The in-wizard Style Guide preview is currently rendering only `guide_markdown`, so it cannot show the selected logo images, palette color blocks, or typography specimens.
- The Word export depends on fetching stored logo URLs at export time. If those signed image URLs are expired, malformed, blocked, or missing, the DOCX silently falls back to text-only sections.
- The My Files modal preview was improved, but that only renders whatever is inside the DOCX. It does not solve missing visuals at generation/export time.

### Implementation steps
1. **Create one visual Brand Guide renderer**
   - Build a reusable `VisualBrandGuide` component that displays the actual selected kit data: cover logo, color swatches, typography samples, logo grid, voice, and the written narrative.
   - Use this component inside Step 5 instead of the markdown-only preview.
   - This makes the user see the same brand assets before saving that should appear in My Files and Word.

2. **Harden logo image export**
   - Update `brand-guide-docx.ts` so logo embedding resolves images from durable storage paths when available, not only from previously signed URLs.
   - Keep support for data URLs and regular URLs, but prefer fresh signed download URLs for saved `path` values.
   - If a logo cannot be embedded, show a clear export warning/toast instead of silently producing a text-only DOCX.

3. **Make color blocks Word-compatible**
   - Replace fragile color swatch table cells with Word-safe colored shape/image swatches where needed, while keeping table shading for compatibility.
   - Ensure swatches appear in Microsoft Word, downloaded DOCX, and the My Files preview.

4. **Add export validation before upload**
   - After generating the DOCX blob, inspect the package client-side enough to confirm:
     - at least one embedded media file exists when logos are selected
     - document XML contains the expected palette hex fills
   - If validation fails, block the save and tell the user which asset failed instead of saving a misleading file.

5. **Refresh My Files preview behavior**
   - Keep `docx-preview`, but add a visual fallback message when the DOCX lacks embedded media or color fills.
   - This avoids the modal appearing broken when the real file is missing the assets.

6. **Verify with the current snapshot**
   - Generate/save a new style guide for the current venture.
   - Confirm the saved DOCX is materially larger than the current ~21KB text-only file, contains `/word/media/*`, contains palette fill values, and previews with visible logo/color blocks in My Files.

### Files expected to change
- `src/components/hub/brand-wizard/BrandWizard.tsx`
- new reusable visual guide component under `src/components/hub/brand-wizard/`
- `src/lib/brand-guide-docx.ts`
- optionally `src/components/files/FilePreviewDialog.tsx` for validation/fallback messaging

### Success criteria
- Step 5 preview shows actual selected logo imagery, color swatches, and typography before saving.
- Saved Word docs contain embedded logo images and visible color blocks when opened/downloaded.
- My Files modal preview matches the saved Word document closely enough to be WYSIWYG for images, colors, and typography layout.