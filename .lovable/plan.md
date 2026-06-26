# Fix: "View" on saved deliverables shows blank preview, no exports

## What's happening

The `Executive Summary.docx` you clicked was saved to *My Files* before we added the link between saved files and their original venture document. The `documents.tsx` "View" handler only opens the rich `DocumentViewer` (with Copy / Markdown / DOCX / PDF + preview) when the row has `source_venture_document_id`. Yours is `NULL`, so it falls back to the generic `FilePreviewDialog`, which can't preview `.docx` in-browser and only shows Delete/Download.

New saves done after the last change already store the link, but every file saved before then is orphaned.

## Plan

### 1. Backfill existing saved deliverables (DB migration)
Match orphaned `attendee_documents` rows (kind = `deliverable`, `source_venture_document_id IS NULL`) back to their source by `user_id` + normalized title:

- Strip the ` (v2)` / `.docx` suffix from `original_name`
- Find the most recent `venture_documents` row owned by the same user with a matching `title`
- Update `source_venture_document_id`

This recovers View → rich viewer for every previously-saved file where the source still exists.

### 2. Resilient lookup at View time (frontend fallback)
In `src/routes/_authenticated/dashboard/documents.tsx` `onView`:

- If a deliverable row has no `source_venture_document_id`, try a name-based lookup before falling back.
- Add a small helper `findVentureDocumentByTitle({ title })` in `src/lib/foundersHub.functions.ts` that returns the latest match for the current user.
- On hit: open `DocumentViewer` and persist the link (`UPDATE attendee_documents SET source_venture_document_id = ...`) so future opens are instant.
- On miss (source was deleted): show a clearer empty state inside `FilePreviewDialog` explaining that the original venture document is gone, with Download still available.

### 3. Improve `FilePreviewDialog` for .docx
Even when we genuinely can't find the source, give a better UX:
- Render the saved doc's metadata (title, size, saved date)
- Add a "Download .docx" primary button and keep Delete
- Add a one-line tip: "For full preview and Markdown / PDF export, open this from the Hub or regenerate it."

## Files touched
- New DB migration: backfill `attendee_documents.source_venture_document_id`
- `src/lib/foundersHub.functions.ts` — add `findVentureDocumentByTitle`
- `src/routes/_authenticated/dashboard/documents.tsx` — fallback lookup + persist link
- `src/components/files/FilePreviewDialog.tsx` — clearer empty state for orphaned docx

## Out of scope
- Re-parsing the stored `.docx` back into markdown to render in the rich viewer (heavyweight, only needed if the source venture document was deleted — rare).
