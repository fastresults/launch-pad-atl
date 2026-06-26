# Per-Venture File Compartmentalization

Today every saved/uploaded file lands in one flat **My Files** list (`attendee_documents`) scoped only to the user. When a user runs more than one venture, their pitch deck for Venture A and Venture B sit next to each other with no way to tell them apart or filter. We'll add a venture link to every document and a venture switcher to the Documents UI, so each venture has its own folder while everything still rolls up under the user.

## Data model

Add a nullable venture link to `attendee_documents`:

- `snapshot_id uuid null references public.venture_snapshots(id) on delete set null`
- Index on `(user_id, snapshot_id)`.

Nullable on purpose — manual uploads that aren't tied to a venture (resume, generic notes) stay venture-agnostic and show under an "Unassigned" bucket.

Backfill: for existing rows where `source_venture_document_id` is set, copy the parent `venture_documents.snapshot_id` into the new column. Everything else stays null.

RLS stays "owner only" via `user_id = auth.uid()` — no change needed; the venture column is just a tag the owner sets.

Storage paths change from `<userId>/<ts>-<name>` to `<userId>/<snapshotId|unassigned>/<ts>-<name>` so the bucket mirrors the logical folder. Existing files keep their old paths (we only read them by stored `storage_path`).

## Save-side wiring (who tags the venture)

Every place that creates an `attendee_documents` row gets a `snapshotId` passed through:

- **`DocumentViewer` → "Save to My Files"** (`src/components/hub/DocumentViewer.tsx`): the viewer already has `doc.snapshot_id`. Pass it into `finalizeDocument`.
- **`finalizeDocument` / `createDocumentUploadUrl`** (`src/lib/attendee.functions.ts`): accept optional `snapshotId`, include it in the insert, and use it in the storage path prefix.
- **Workflow deliverables** (`src/lib/pipeline.functions.ts` writer): tag with the deliverable's snapshot.
- **Documents page upload** (`src/routes/_authenticated/dashboard/documents.tsx`): add a "Save to venture" dropdown (list of the user's `venture_snapshots`, plus "Unassigned") next to the kind selector so manual uploads can be assigned at upload time.

## UI: venture switcher in My Files

`src/routes/_authenticated/dashboard/documents.tsx`:

- Fetch the user's `venture_snapshots` (id + `company_name`).
- Add a venture pill row above the existing All/Generated/Uploaded chips:
  `All ventures` · `<Venture A>` · `<Venture B>` · `Unassigned`
- Combine with the existing source filter. URL param `?venture=<id>` so deep links work.
- New **Venture** column in the table showing the company name (or em-dash for unassigned).
- Inline "Move to venture…" action on each row (small popover with the same list) so misfiled docs can be re-tagged without re-uploading.
- Empty state copy per venture: "Nothing saved for *Venture A* yet — open a deliverable and hit *Save to My Files*."

When the user is inside a single venture's hub (`hub.$snapshotId`), add a small "View this venture's files →" link that jumps to `/dashboard/documents?venture=<id>` pre-filtered.

## Edge cases

- Deleting a venture: FK is `on delete set null`, so files survive and fall back to "Unassigned" — no orphan rows, no broken downloads.
- A user with zero ventures sees no switcher (just the flat list, current behavior).
- The existing `source_venture_document_id` link stays — it's a stronger pointer (specific deliverable) while `snapshot_id` is the broader folder.

## Files touched

- `supabase/migrations/*` — add column, index, backfill.
- `src/lib/attendee.functions.ts` — thread `snapshotId` through upload + finalize.
- `src/lib/pipeline.functions.ts` — pass snapshot when persisting deliverables.
- `src/components/hub/DocumentViewer.tsx` — send `snapshot_id` on save.
- `src/routes/_authenticated/dashboard/documents.tsx` — venture chips, column, move action, upload-time selector, `?venture=` param.
- `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx` — "View this venture's files" link.

## Out of scope

- Sharing files across ventures (always a copy, never a hard link).
- Per-venture storage quotas or separate buckets.
- Renaming/moving the actual stored object paths for legacy files (paths are read from `storage_path` so it doesn't matter).
