# Section exports on the shared venture link

Every section of the public showcase gets a discreet export control: Word (.docx), PDF, and Save to Google Drive — with all images included. Plus one "Export everything" action in the masthead that produces the whole venture as a single document.

## What the visitor sees

- A small, quiet icon button (download glyph) sits at the top-right of each section header, aligned with the title. It only gains full opacity on hover/focus; on touch it is always visible but understated.
- Clicking it opens a compact menu: **Word (.docx)**, **PDF**, **Save to Google Drive**.
- The masthead gets one matching control: **Export everything**, same three formats, one file containing every included section in reading order.
- While a file is being built, the icon shows a spinner; a toast confirms the download or the Drive upload with a link to the file in Drive.
- On mobile the same control lives in the section's action row so it stays thumb-reachable.

## What lands in the file

Each exported section keeps its identity:

- Section title and subtitle, formatted body text (headings, lists, tables, emphasis preserved), and the venture name/logo in a simple header.
- The hero image and every gallery image, embedded in the file itself — not linked — so the document still works after the share link expires.
- Brand board sections export their palette swatches, type specimens, and logo images.
- Metrics render as a clean table.
- The launch timeline exports as a rendered image of the current view plus the sequential step list beneath it, so a "what-if" scenario the visitor set is captured as shown.

Excluded or password-gated content is never exportable — export always runs against the same payload the visitor is already allowed to see.

## Google Drive

Visitors are signed out, so Drive uses Google's browser sign-in: clicking **Save to Google Drive** opens a Google consent popup asking only for permission to add files to their own Drive, then uploads the generated file straight into their Drive and returns a link. Nothing about their Drive is read, and the app stores nothing. If they cancel, the file simply downloads instead.

This needs one Google OAuth Client ID (a public, non-secret value). If you'd rather not set one up, the menu can ship with Word + PDF only and Drive can be added later without touching the rest.

## Technical notes

- New `src/lib/share-export.ts`: builds an export model from a `ShareItem` (title, markdown body, metrics, image URLs), fetches each signed image URL to a blob once, and caches per section.
- DOCX via the `docx` package in the browser: markdown parsed to paragraphs/headings/lists/tables, `ImageRun` for each fetched image, US Letter page setup, Arial default.
- PDF via `jspdf`: same model rendered with the showcase's serif/sans pairing and accent color; images fitted to content width, page breaks between blocks. No screenshotting of the DOM except for the timeline canvas, which is serialized from its SVG to a PNG.
- Drive via Google Identity Services token client (`drive.file` scope) + a resumable multipart upload of the generated blob. Client ID read from `VITE_GOOGLE_CLIENT_ID`; the menu item hides itself when it is absent.
- New `src/components/share/SectionExportMenu.tsx` (icon + dropdown + progress state), used by `ShareSection.tsx`, `MobileReader.tsx`, and the masthead in `src/routes/v.$token.tsx` (whole-showcase mode loops all included sections).
- Styling uses existing dark studio tokens only — no hardcoded colors.
- No backend or schema changes: images come from the signed URLs already in the payload, and generation is entirely client-side.

## Build order

1. Export model + image fetching/caching helper.
2. DOCX generation, wired to a single section.
3. PDF generation with matching layout.
4. `SectionExportMenu` icon UI in desktop sections, mobile reader, and masthead "Export everything".
5. Google Drive upload path, timeline SVG capture, toasts and error states.
