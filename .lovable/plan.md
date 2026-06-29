# Why the Style Guide looks "empty" in the preview

The DOCX file we generate (`src/lib/brand-guide-docx.ts`) **already embeds** the logo image, the chosen palette swatches (as filled Word table cells), the typography specimens with the chosen font families, the type-scale table, and the voice section. That code is correct and the data is being saved (`palette`, `typography`, `logos`, `voice` are all persisted on `venture_brand_kits` and read back by `getBrandKit` before export).

What's wrong is the **preview**, not the file. We render the DOCX inline in `src/components/files/FilePreviewDialog.tsx` with:

```ts
const result = await mammoth.convertToHtml({ arrayBuffer: buf });
```

Default mammoth behavior:
- **Drops all images** (no `convertImage` handler → `<img>` tags are skipped) → no logo on cover.
- **Ignores table cell shading** (`w:shd`) → color swatches render as empty cells, so the palette looks blank.
- **Strips run-level color, font family, and font size** → typography specimens fall back to the dialog's default font, so "no typography" appears applied.
- **Strips bar characters' spacing context** → voice attribute bars render but look like plain text.

Opening the same file in Word / Google Docs / the mammoth viewer with the right options shows everything we embedded. So we need to upgrade the preview to expose what's already in the file.

# Plan

## 1. Upgrade the DOCX preview in `FilePreviewDialog.tsx`

Pass mammoth a richer config:

- **`convertImage`** — use `mammoth.images.imgElement` with a base64 data URI handler so the logo and any embedded images render inline.
- **`styleMap`** — map our heading styles (`Heading 1..4`) to semantic tags so they keep their hierarchy.
- **`includeDefaultStyleMap: true`** plus `transformDocument` to preserve run-level color and font, which mammoth normally drops. We'll walk the document tree and, for each run with `color` / `font` / `highlight`, attach an inline `style` via a custom HTML transform. For table cells we'll attach the `w:shd` fill as `background-color` on the cell.
- Wrap the rendered HTML in a scoped container that allows inline `style` colors/fonts (already supported, just need to stop stripping them).

## 2. Style the preview container

Add a scoped stylesheet in the dialog that:

- Renders `<table>` with visible borders and respects per-cell `background-color`.
- Renders `<img>` at `max-width: 100%`.
- Honors inline `font-family`, `color`, and `font-size` so typography specimens look right (Google Fonts are already lazy-loaded in the wizard; we'll add `loadGoogleFont` calls for the kit's chosen heading/body family when the previewed doc is a Style Guide so the font is available in the preview too — best-effort, falls back gracefully).

## 3. Add a clear "Open in Word for full fidelity" affordance

Even with the upgrades, mammoth can't match Word 1:1 (gradients, custom OOXML, page layout). Add a small note + a **Download** button right above the preview so users know the file itself contains everything.

## 4. Sanity-check the generator (no functional change expected)

Quick review pass on `brand-guide-docx.ts` to confirm:

- `logos[].url` is reachable from the browser (signed Supabase URL or data URL) — if not, the cover image fetch silently returns `null`. We'll add a `console.warn` on fetch failure and a fallback text mark so we can see in logs whether image fetch is the culprit on the file side too.
- Palette is read from `palette.colors` (current shape from the wizard) — confirmed correct.

## Files touched

- `src/components/files/FilePreviewDialog.tsx` — richer mammoth config, scoped styles, optional Google Font preload, download hint.
- `src/lib/brand-guide-docx.ts` — add a small warning when logo image fetch fails (diagnostic only).

No schema changes, no edge function changes, no data migration.

## Verification

- Open an existing Style Guide from My Files → preview shows the cover logo, the colored palette table, typography specimens in the chosen fonts, and the voice section.
- Download the same file and open in Word → identical content (already worked).
