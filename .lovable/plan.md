# Save Generated Documents to "My Files"

## The problem (in plain language)

When a founder generates a deliverable (Executive Summary, Brand Brief, Roadmap, etc.) it lives inside the Venture Hub viewer. They can copy or download it locally, but it never lands in **Dashboard → My Files → Documents**, which is the place they instinctively look for "their stuff." Uploads they make manually show up there; AI-generated documents do not. That split confuses novices.

## Goal

From the document viewer modal, the user can press one obvious button — **Save to My Files** — and the document (plus optional deep assessment) appears under **Dashboard → Documents** as a normal file they can re-download, rename, or delete, without re-running the AI.

## User experience

1. In the viewer header, next to Copy / Markdown / DOCX / PDF, add a primary-styled **Save to My Files** button with a bookmark icon.
2. First click → saves a PDF (or DOCX, see "Format") snapshot of the current `exportContent` (executive summary + deep assessment if expanded) to the user's documents under kind `deliverable`. Toast: *"Saved to My Files. View it anytime in Dashboard → Documents."* with a "View" action that routes to `/dashboard/documents`.
3. After save, the button flips to **Saved ✓ · Update** (secondary). Pressing Update re-saves a new version with a `(v2)` suffix so the user never loses an earlier copy.
4. On the **Documents** page:
   - Add a "Source" column showing either `Uploaded` or `Generated · <venture name>`.
   - Add a filter chip row (All / Uploaded / Generated) so the list stays scannable as the library grows.
   - Empty-state copy updated: *"Anything you upload or save from a deliverable lands here."*
5. On the **My files** index card, update the Documents description to: *"Uploads and deliverables you've saved from your venture."*

## Format

Save as **PDF** by default (matches the existing PDF export path in the viewer and renders predictably for novices). Internally store `mime_type=application/pdf`, `kind=deliverable`, `original_name=<Document title>.pdf`. Future enhancement (out of scope): let the user pick PDF/DOCX in a small dropdown beside the button.

## Technical notes

- **No schema change required.** `attendee_documents` already supports arbitrary `kind` + `mime_type`. Reuse the existing storage flow: `createDocumentUploadUrl` → PUT to signed URL → `finalizeDocument`.
- **DocumentViewer.tsx**: add `onSaveToFiles()` that
  1. renders `exportContent` to a PDF Blob using the same path as `onDownloadPdf` (extract the existing logic into a shared helper that returns a Blob instead of triggering download),
  2. calls `createDocumentUploadUrl({ kind: "deliverable", filename, mime: "application/pdf" })`,
  3. PUTs the blob, then `finalizeDocument(...)`,
  4. invalidates `["my","documents"]` and shows the toast with the "View" action (navigate via `useNavigate`).
- Track save state locally (`saved`, `savedDocId`) so the button can toggle and the Update path can append `(v<n>)` based on a quick count of existing docs whose `original_name` starts with the same title.
- **attendee.functions.ts**: confirm `finalizeDocument` accepts arbitrary `kind` strings; if it whitelists, add `deliverable` to the allowed set.
- **documents.tsx**:
  - Add `deliverable` to the `KINDS` list (label: "Saved deliverable") so the kind cell renders nicely and the filter has a value.
  - Add the Source column + filter chips. Source = `Generated` when `kind === "deliverable"`, else `Uploaded`.
  - Keep existing upload/download/delete behavior unchanged.
- **files.tsx**: tweak the Documents card description string only.

## Out of scope

- Auto-saving every generated document (would clutter the library; explicit user action is the whole point).
- Versioned diff viewer — `(v2)` naming is enough for now.
- Sharing or external links.

## Acceptance check

- Generate any deliverable, open the viewer, click **Save to My Files** → toast appears, navigating to `/dashboard/documents` shows the new row with Source = Generated and Download returns the same PDF.
- Click **Update** → a `(v2)` row appears alongside the original.
- Filter chips correctly partition Uploaded vs Generated.
- Manual uploads still work exactly as before.
