# Visual Brand Style Guide DOCX

Today, "Save to My Files" exports `kit.guide_markdown` through the generic markdown→DOCX converter. That captures the words but loses the actual choices the user made — palette swatches, typography samples, and the selected logo. We'll build a dedicated brand-aware exporter that bakes those assets into the document.

## Scope

- New: `src/lib/brand-guide-docx.ts` — purpose-built DOCX builder for the brand kit.
- Updated: `src/components/hub/brand-wizard/BrandWizard.tsx` `saveToFiles()` calls the new builder and passes the full `kit`.
- No backend, schema, or wizard-flow changes.

## What goes into the document

Pulled directly from `kit` (palette / typography / logos / voice / dna), so it reflects exactly what the user picked:

1. **Cover page**
   - Selected primary logo rendered at ~3" (image fetched from its URL/dataURL and embedded as PNG/JPG via `ImageRun`).
   - Company name in the chosen **heading font**, primary color.
   - "Brand Style Guide" subtitle, generation date.

2. **Color system**
   - One row per color (Primary, Secondary, Accent, Neutral Dark, Neutral Light, Surface, …).
   - Each row: a filled DOCX table cell using `shading.fill = hexWithoutHash` as a true swatch, followed by role name, HEX, RGB, and short usage note.
   - Includes any extended/semantic tokens present on `kit.palette` (success/warning/etc. if available).

3. **Typography**
   - Heading sample: company name set in `kit.typography.heading.family` at 36pt bold (uses Word's built-in font fallback; if the family isn't installed on the reader's machine, Word substitutes — we also note the Google Fonts URL/import link so they can install it).
   - Body sample: a 60–80-word paragraph in `kit.typography.body.family` at 11pt.
   - Specimen scale block: H1/H2/H3/Body/Caption rows with size, weight, line-height, and use-case.
   - Font metadata table: family, weights used, source (Google Fonts), license.

4. **Logo lockups**
   - Primary logo: embedded full-size on a light background card (white shaded cell, centered image).
   - Secondary alternates: any other logos the user kept — 2-up grid with labels.
   - Clear-space + minimum-size note generated from the logo's aspect.
   - "Don't" examples are skipped (we don't have generated misuse images).

5. **Voice & messaging**
   - Tagline, tone words, dos/don'ts pulled from `kit.voice`.

6. **Written guide content**
   - The existing `kit.guide_markdown` (Brand at a Glance, Purpose, Promise, etc.) appended after the visual sections, run through the existing markdown→blocks parser so formatting is preserved.

## Technical notes

- Reuse the existing `docx` library and `mdToBlocks()` helper from `src/lib/markdown-to-docx.ts` (export it if needed) so we don't duplicate markdown parsing.
- Color swatches are real Word table cells with `shading: { fill: hex, type: ShadingType.CLEAR }`, sized ~0.8" x 0.6" — renders identically in Word and Google Docs.
- Logo images: `fetch(url) → arrayBuffer()`, detect PNG vs JPG via the first bytes, embed with `ImageRun({ type, data, transformation })`. Data-URL logos (some are base64-stored) are decoded the same way. If a logo fails to fetch, skip it silently and continue (we don't want one bad URL to break the save).
- Page size: US Letter (12240×15840 DXA), 1" margins.
- Headings use the chosen `heading.family` as the Word font name; body uses `body.family`. Falls back to "Inter"/"Source Sans Pro" if missing.
- Existing "Save to My Files" upload path (signed URL + `attendee_documents`) stays exactly the same — only the blob content changes.

## Verification

After build, generate the DOCX in the sandbox, convert to PDF via LibreOffice, render the first 6 pages as JPGs, and inspect:
- swatches actually show color
- logo renders and is not stretched
- heading font specimen reads cleanly
- markdown sections appear after the visual ones with intact formatting

If any page is broken, fix the builder and re-render before shipping.

## Out of scope

- Editing the kit from within the document.
- Regenerating logos/palettes during export.
- PDF export variant (DOCX only for now; PDF can follow).
