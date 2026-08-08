# Make the Word / PDF exports look designed

The export pipeline works, but it renders like a plain text dump: no cover, no page numbers, no brand colour, no real tables in the PDF, and bold/italic is stripped out of every sentence. This plan turns both formats into a document a founder would happily forward to an investor.

## What's wrong today (confirmed in `src/lib/share-export.ts`)

- **No cover page.** The logo, venture name and one-liner sit inline at the top of page 1, immediately followed by the first section.
- **No page furniture.** Neither format has a running header, footer, page numbers, or a table of contents.
- **PDF tables aren't tables.** Markdown table rows are flattened into `cell · cell · cell` text lines. Metrics render as label-left / value-right lines with a hairline, which is the one part that already looks decent.
- **Bold and italic are deleted.** `stripInline` strips `**`/`*`/backticks before rendering, so emphasis never survives into either file.
- **Bulleted lines in the PDF** are literal `•  text` with no hanging indent, so wrapped lines run back under the bullet.
- **Word page size is never set**, so `docx` defaults to A4 while the column maths assume US Letter (9360 DXA) — tables are slightly wider than the text column.
- **No heading styles in Word**: built-in Heading 1/2/3 defaults (blue Calibri Light) fight the Arial body text.
- **Images have no height cap**, so a tall portrait image can overflow a Word page; the PDF fit calculation double-applies the aspect ratio.
- **Brand colour is unused** even though the payload carries it.

## The design

One typographic system, applied to both formats.

- **Cover page**: logo centred, venture name in the serif display face, one-liner beneath, a thin accent rule in the venture's brand colour, and a footer line with the date and "Prepared for" / share title. Page break after.
- **Contents page** (only for "Download all"): section titles with page numbers — a real field-based TOC in Word, a generated list in the PDF.
- **Section openers**: small accent-coloured eyebrow (section category), serif title, muted subtitle, hairline rule. Each section starts on a new page, as today.
- **Body**: 10.5pt/11pt sans with generous leading, headings in the serif face at three clear sizes, bullets with proper hanging indents, block quotes with an accent left rule and grey italic.
- **Metrics**: a bordered card-style table (label small caps grey, value large) instead of plain rows.
- **Tables**: real drawn tables in the PDF — measured column widths, tinted header row, hairline rules, cell wrapping and page-break continuation with a repeated header.
- **Images**: capped to fit within the live area (both width and height), centred, with a small italic caption underneath and consistent space above/below.
- **Running footer** on every page after the cover: venture name on the left, page number on the right, hairline above.
- **Rich text**: bold, italic and inline code survive into both formats.

## Technical notes

All changes live in `src/lib/share-export.ts` (plus small additions to the export model).

1. **Inline parser**: replace `stripInline` with a tokenizer returning `{ text, bold, italic, code }[]`. Word maps each token to a `TextRun`; the PDF gets a small run-layout helper that measures with `getTextWidth` and switches font style per token while wrapping to the column.
2. **Theme object**: derive `{ accent, ink, muted, rule }` from `payload.venture.brandColor` (falling back to the current near-black/grey), passed into both renderers so colour is defined once.
3. **Word**:
   - set explicit US Letter page size + 1" margins on the section;
   - override `Heading1/2/3` styles (serif display for titles, sized and coloured to the theme, with `outlineLevel` so the TOC works);
   - add a cover section, a `TableOfContents` for full exports, and a `Footer` with `PageNumber.CURRENT`;
   - cap image transformation height to the printable area;
   - rebuild the metrics and markdown tables with the tinted header + accent rules.
4. **PDF**: extract the ad-hoc `text()` helper into a small layout engine — `heading()`, `paragraph()`, `bullet()` (hanging indent), `quote()`, `table()` (column measurement, header repeat on page break), `image()` (correct fit maths), plus `drawFooter()` called on every `addPage()`. Cover and contents pages are drawn before the block loop.
5. Section eyebrows need the category name, so `ExportBlock` gains an optional `eyebrow` and `blockFromItem` fills it from the section the item belongs to.

## Verification

Generate both files from a real share payload in a headless browser, convert the .docx to PDF with LibreOffice, render every page of both to images and inspect each one for clipped text, overflowing images, broken tables and missing page numbers — then fix and re-render until clean.
