## Goal

In `/dashboard/documents`, add a **View** action under the Actions column. For rows that came from a generated deliverable, View opens the same rich modal you get inside the Hub (Copy / Markdown / DOCX / PDF, hero image, deep assessment, rewrite). For uploaded files, View opens a lightweight in-app preview so the user doesn't have to download to peek.

## Why this needs more than a button

The Documents page currently lists rows from `attendee_documents`. When you "Save to My Files" from the Hub's `DocumentViewer`, we currently write only the rendered DOCX into Storage — we do **not** keep a link back to the source `venture_documents` row (which is what holds the markdown, hero image, and deep-assessment content the modal needs). So a "View" button has nothing rich to render today.

Fix: persist that link at save time, then resolve it at view time.

## Changes

### 1. Link saved deliverables back to their source (DB + save flow)

- Migration: add nullable column `attendee_documents.source_venture_document_id uuid` referencing `venture_documents(id) on delete set null`, plus an index on it.
- `finalizeDocument` (`src/lib/attendee.functions.ts`) accepts an optional `sourceVentureDocumentId` and writes it.
- `DocumentViewer.tsx` "Save to My Files" passes the current `doc.id` as `sourceVentureDocumentId` so future views can rehydrate the rich content.
- Backfill is not required; old rows will simply fall back to the lightweight preview (see #4).

### 2. New `listMyDocuments` shape

Update `listMyDocuments` to also return `source_venture_document_id`. No UI break — extra field.

### 3. Rich preview for generated rows

- In `src/routes/_authenticated/dashboard/documents.tsx`, add a **View** button (left of Download) in the Actions cell.
- Click handler:
  - If `kind === "deliverable"` **and** `source_venture_document_id` is set: lazy-load the venture document via a new helper `getVentureDocumentById({ id })` in `src/lib/foundersHub.functions.ts` (selects the full row with markdown, hero_image_path, deep_assessment, etc., scoped to the caller's user_id through RLS). Pass it into the existing `<DocumentViewer doc={…} onClose={…} />`.
  - Reuses every existing export action (Copy, Markdown, DOCX, PDF) and the deep-assessment trigger — no duplication.
- Show a small loading state on the row while the venture doc is being fetched.

### 4. Lightweight preview for uploads and legacy saved rows

For everything else (PDFs, images, DOCX uploads, or saved-deliverable rows missing the link), open a new small `FilePreviewDialog`:

- PDFs and images → render inline in an iframe / `<img>` using a signed URL (same `getDocumentDownloadUrl`).
- DOCX / other binaries → show the filename, size, kind, and a prominent **Download** button (browsers can't natively render DOCX; we don't add a converter for this).
- Dialog header always includes Download and Delete so the modal is a real "do everything for this file" surface, matching the user's request.

### 5. Small UX polish

- Table Actions cell becomes: `View · Download · Delete` with consistent button sizes; on narrow screens collapse to icon buttons.
- Keep the existing filter chips (All / Generated / Uploaded) untouched.

## Files touched

- `supabase/migrations/<new>.sql` — add `source_venture_document_id` column + index.
- `src/lib/attendee.functions.ts` — extend `finalizeDocument`, expose new field from `listMyDocuments`.
- `src/lib/foundersHub.functions.ts` — add `getVentureDocumentById`.
- `src/components/hub/DocumentViewer.tsx` — pass `sourceVentureDocumentId` when saving.
- `src/components/files/FilePreviewDialog.tsx` *(new)* — lightweight preview for uploads.
- `src/routes/_authenticated/dashboard/documents.tsx` — View button + dialog wiring.

## Out of scope

- Server-side DOCX → HTML rendering for uploaded Word files.
- Editing files in place. View is read-only; rewrite stays inside the Hub's DocumentViewer for deliverable rows that have it.
