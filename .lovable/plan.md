
# Make the .docx export match the on-screen document styling

Today's `.docx` export uses Word's defaults: Calibri 11, black on white, plain headings, plain tables. The on-screen viewer has a clear visual identity (serif-ish hierarchy, violet accents, gradient hero, tinted callouts, zebra tables, monospace code blocks). We can get the Word file much closer to that look — with caveats Word imposes.

## What we can match (and how)

Mapping each visual element from `DocumentViewer.tsx` to a Word equivalent:

| UI element | Word equivalent |
|---|---|
| Page background `bg-background` (dark navy) | Page background color via `<w:background>` + `<w:displayBackground/>` setting. Renders in Word's "Web Layout"; **Print Layout and printing ignore it** by default unless the user enables "Print background colors". Will offer a **light** and **dark** variant — default to light for printability. |
| Body text `text-foreground/85` 14.5px / leading-7 | Calibri → swap to a closer stack. UI uses system sans; Word-safe pick: **Aptos** (Word 365 default) or **Calibri** body, **Calibri Light** / **Aptos Display** headings. Body 11pt, line spacing 1.5, paragraph spacing 8pt after. |
| H1 with bottom border + primary tint | 22pt bold, color `#A78BFA` (violet), 1pt bottom border, 16pt before / 8pt after, `keepNext`. |
| H2 | 16pt semibold, foreground color, 14pt before / 6pt after, `keepNext`. |
| H3 / H4 | 13pt semibold / 11pt semibold uppercase tracked, muted color. |
| Paragraph | 11pt, 1.5 line spacing, 8pt after. |
| Bold / italic / inline code | Bold + italic already work. Inline code → `Consolas` 10pt with light-grey shading (`F1F1F3`). |
| Links | Underlined, color `#7C3AED`. |
| Bulleted list (violet marker) | Numbering config with `•` bullet, hanging indent 0.25", **violet bullet color** via run formatting on the bullet level. |
| Ordered list | Decimal numbering, hanging indent. |
| Blockquote | Left border 2pt violet `#8B5CF6`, light tinted shading `#F4F1FB`, italic, indent 0.25". |
| Callouts (info / warn / tip / success) — currently detected by `> Note:` / `> Warning:` / `> Tip:` / `> Success:` prefixes | Single-cell 1×1 table with tinted fill + colored left border + the matching icon glyph (▲ ⓘ ✦ ✓) inline. Detect the same prefixes the UI uses. |
| Fenced code block with language chip | 1-column table: top row = language label (small caps, muted) on `#EFEFF2`; body row = `Consolas` 9.5pt on `#F4F4F6`, no borders. |
| Tables — header row tinted, zebra body, numeric right-align mono | Light grey header fill `#EFEFF2` + bold; zebra striping via row-level shading on even rows `#FAFAFC`; auto-detect numeric cells with the same `NUMERIC_RE` regex and right-align + Consolas + tabular figures. Thin `#E5E7EB` borders. |
| Horizontal rule | Empty paragraph with 1pt top border `#D1D5DB`, top + bottom spacing. |
| Hero image (if generated) | Embed at top, full content-width, 16:9, with the document title above it. Need to fetch the signed URL → fetch as bytes → `ImageRun`. Configurable via a `{ includeHero: boolean }` option, default **on**. |
| Document title (currently `Title` style, 20pt) | Bump to 28pt bold violet, with the document-type chip rendered as small caps grey subtitle underneath. |

What we **cannot** truly match (Word constraints):
- The dark glassmorphism background. We'll ship a "light" theme by default and an opt-in "dark" theme (dark page + light text) that only renders correctly in Word's Web Layout and in dark-mode Word — fine for screen reading, not for print. Recommend: **light theme by default, dark as a toggle later**.
- The orange→magenta→violet gradient text on the hero/title. Word has no gradient text fill via OOXML through `docx-js`. We'll use solid violet `#7C3AED`.
- The gradient `<hr>`. Replaced with a thin violet rule.
- Tailwind opacity tokens like `text-foreground/85`. Approximated with hex colors.

## Implementation

All work is in the existing `src/lib/markdown-to-docx.ts` plus a small change in `DocumentViewer.tsx` to pass through `title`, `hero`, and `theme`.

1. **Define a theme constant** in `markdown-to-docx.ts`:
   ```ts
   const THEME = {
     fontBody: "Aptos", fontHeading: "Aptos Display", fontMono: "Consolas",
     colors: {
       text: "1F2937", textMuted: "6B7280", textSoft: "374151",
       primary: "7C3AED", primarySoft: "A78BFA",
       border: "E5E7EB", borderSoft: "F3F4F6",
       codeBg: "F4F4F6", codeChip: "EFEFF2",
       quoteBg: "F4F1FB", quoteBar: "8B5CF6",
       tableHeader: "EFEFF2", tableZebra: "FAFAFC",
       calloutInfo: "EAF4FB", calloutWarn: "FEF6E7", calloutTip: "F4F1FB", calloutSuccess: "ECFBF3",
     },
   };
   ```

2. **Replace the heading style block** in the `Document({ styles })` config so H1–H4 inherit the colors, fonts, and spacing above (`outlineLevel` set so Word's nav pane works).

3. **Rewrite the renderers** for: paragraph (line spacing + after), inline code (shading + Consolas), link (`Hyperlink` style override to violet), bullet/numbered numbering configs with violet bullet color, blockquote (border + shading + italic + indent), HR (border paragraph).

4. **Rewrite `makeTable`**:
   - Borders `#E5E7EB`, 0.5pt.
   - Header row: bold, `#EFEFF2` shading, 9pt small caps.
   - Body rows: alternate `tableZebra` fill via `TableRow.shading`-equivalent (apply on each cell).
   - Per-cell: detect numeric with the existing `NUMERIC_RE`; if numeric, right-align + Consolas + tabular nums.
   - Use full content width (9360 DXA for US Letter, 1" margins).

5. **Add callout renderer**: detect blockquote whose first inline starts with `Note:|Info:|Warning:|Caution:|Important:|Tip:|Success:|Done:` and emit a 1×1 table with the matching fill + colored left border + a leading icon glyph in the colored tone. Falls back to the standard blockquote otherwise.

6. **Add fenced-code renderer**: 1-column 2-row table — language chip row + code row. Preserve line breaks as separate `Paragraph`s inside the code cell. `Consolas` 9.5pt.

7. **Add hero-image embedding**:
   - New optional param: `markdownToDocxBlob(title, markdown, { heroUrl?: string, theme?: "light" | "dark" })`.
   - When `heroUrl` is provided, `fetch(heroUrl)` → `arrayBuffer` → `ImageRun({ type: "jpg" | "png", data, transformation: { width: 624, height: 351 } })` (16:9 at content width). Wrap in a centered Paragraph.
   - On fetch failure, skip the image silently (don't break the export).

8. **Title block**: replace the current `HeadingLevel.TITLE` paragraph with: 28pt bold primary-colored title + a small-caps grey subtitle showing `doc.document_type`.

9. **Page setup**: keep US Letter 12240×15840 DXA, 1" margins. Add a footer with page number (`PageNumber.CURRENT`) and document title on the right via a tab stop — matches the polished feel without being intrusive.

10. **Wire from `DocumentViewer.tsx`**:
    - `onDownloadDocx` already exists. Update its single call to:
      ```ts
      await markdownToDocxBlob(title, content, { heroUrl: heroUrl ?? undefined });
      ```
    - No new buttons. No UI changes.

## Validation

- Manual download for one of each document type that exists in the project (PRD with code block, plan with tables, calendar with tables, anything with callouts) and visually compare in Word + Google Docs + Pages.
- Confirm tables render with borders + zebra in **Google Docs** (the historical fragile target — we already use DXA widths, which is correct).

## Out of scope

- Dark-theme Word export (would need page background + inverted colors; skip unless asked).
- Gradient text or gradient HR (Word OOXML limitation via docx-js).
- Embedded fonts (Aptos/Calibri are present on modern Word; older installs fall back to a sans-serif — acceptable).
- A separate "branded cover page" with logo — can add later if you want.
- Server-side rendering / edge function — stays in the browser, no cost change.

## Files touched

- Edit: `src/lib/markdown-to-docx.ts` (theme constants, rewritten renderers, callouts, fenced-code renderer, hero image, title block, footer).
- Edit: `src/components/hub/DocumentViewer.tsx` (pass `heroUrl` into `markdownToDocxBlob`).
