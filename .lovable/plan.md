# In-Modal DOCX Preview

Right now the My Files preview modal only renders images and PDFs inline. DOCX deliverables (like the Brand Style Guide saved from the wizard) fall through to the "In-browser preview isn't available" fallback, forcing users to download. We'll add an in-browser DOCX renderer so the modal shows the styled document directly.

## Scope

Update only `src/components/files/FilePreviewDialog.tsx` and add one dependency. No backend or storage changes.

## Approach

1. **Add `mammoth`** (`bun add mammoth`) — a battle-tested library that converts `.docx` → semantic HTML in the browser. ~150KB, no server needed.
2. **Detect DOCX** by mime (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`) or `.docx` extension.
3. **Fetch the signed URL as an ArrayBuffer**, run `mammoth.convertToHtml({ arrayBuffer })`, and inject the HTML into a scrollable, styled container inside the existing preview frame.
4. **Style the rendered HTML** with a `prose`-style wrapper (white card, comfortable max-width, brand-friendly typography) so it reads like a document rather than raw HTML.
5. **Loading + error states**: show the existing spinner while parsing; if parsing fails, fall back to the current "preview not available" message with Download still available.
6. **Keep existing behavior** for images, PDFs, and unsupported types unchanged. Markdown (`.md`) and plain text (`.txt`) get a lightweight inline render too as a bonus (text fetched and shown in a `<pre>` / `RichMarkdown` block) — optional, can be cut if you want a tighter scope.

## UX details

- Container: `max-h-[72vh] overflow-auto bg-white text-slate-900 rounded-lg p-8` so the document feels like paper inside the dark modal.
- Headings, lists, tables from mammoth get sensible default spacing via a scoped CSS class (no global `.prose` dependency required).
- Download and Delete buttons stay where they are.

## Technical notes

- Mammoth runs entirely client-side; the signed URL returned by `getDocumentDownloadUrl` is fetched with `fetch(url).then(r => r.arrayBuffer())`.
- We pass `mammoth.convertToHtml` with default style map — good enough for headings, bold/italic, lists, tables, and images embedded in the DOCX.
- Embedded images are returned as base64 data URLs automatically, so they render without extra storage round-trips.
- Cleanup: abort in-flight conversion when the dialog closes or the doc changes (reuse the existing `cancelled` flag).

## Out of scope

- XLSX / PPTX previews (different libraries, can be a follow-up).
- Editing the document in the modal (read-only preview only).
- Server-side rendering or caching of the HTML.
