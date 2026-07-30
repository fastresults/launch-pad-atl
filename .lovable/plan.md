## Goal

Today the only way to feed the Second Brain is a tiny drop handler that accepts .txt/.md/.csv/.json under 2MB, saves the raw text as a *note*, and then requires a manual "Rebuild memory" that wipes and re-embeds everything.

This plan replaces that with a real **drop zone beside the brain** — drag in a PDF, Word doc, deck, spreadsheet, image, or a URL, any day of the week — where every file is read by AI first, distilled, and indexed into memory incrementally.

## What the founder sees

A **Materials** panel sitting next to the chat on `/dashboard/brain`:

- A large drop zone: "Drop anything your startup runs on — PDFs, contracts, decks, spreadsheets, screenshots, links." Click-to-browse and paste-a-URL both work. Up to ~25MB per file, multiple files at once.
- Each dropped item becomes a card showing title, type, size, and a live status pill: `Uploading → Reading → Understanding → In your brain` (or `Failed`, with Retry).
- Once processed, the card shows the AI's own read of the document: a one-line summary, a few key takeaways, and auto-tags (e.g. `pricing`, `legal`, `competitor`). Expandable to the full extracted text.
- Rename, preview/download, or remove. Removing a material deletes only its memory chunks — nothing else is touched.
- Materials scope to the selected startup (or the account when none is selected), same as notes.
- The status card gains a **Materials** stat, and chat answers cite documents by title.

Add a document tomorrow or next week: drop it, and it's live in the brain in under a minute. No rebuild, no lost chat history.

## AI-first processing

Each material runs a three-pass pipeline before anything is embedded:

1. **Extract** — text-family files inline; PDF/DOCX/PPTX/XLSX through the same extraction path `venture-source-extract` already uses; images and scanned PDFs through a vision pass (`openai/gpt-5.6-sol`, image/file content blocks) so a photographed lease or a whiteboard shot still lands as text.
2. **Understand** — one structured call (AI SDK `Output.object`) produces `{ title, summary, key_points[], tags[], doc_kind }`. This gives the card its human-readable identity and gives retrieval better hooks than raw page text.
3. **Index** — the summary and key points are embedded as a high-signal header chunk, then the full text is chunked and embedded via the existing `_shared/brain-embed.ts` helpers into `founder_brain_memory` with `kind = 'material'`, `source_ref = <material_id>`.

Only that material's prior rows are deleted before writing — no global wipe. Adding a doc next week costs one doc's worth of embedding.

## Technical notes

- **Storage**: reuse the private `attendee-docs` bucket at `<user_id>/brain/<material_id>/<filename>`.
- **Table** `public.brain_materials`: `id, user_id, snapshot_id, title, source_type ('file'|'link'), mime_type, byte_size, storage_bucket, storage_path, source_url, extracted_text, summary, key_points jsonb, tags text[], doc_kind, status, chunk_count, error_message, created_at, updated_at`. GRANTs to `authenticated` + `service_role`; RLS on `auth.uid() = user_id` with the existing admin bypass.
- **Edge function** `brain-material-ingest`: verifies ownership, runs the three passes in the background via `EdgeRuntime.waitUntil`, writes progress to the existing `brain_indexing_jobs` row so the current polling UI is reused.
- **`brain-reindex`** adds `'material'` to its wipe list and pulls `brain_materials` as a source so a full rebuild reproduces the same state; `brain-chat` gets a `material` citation label case.
- **Client**: `src/lib/brain-materials.functions.ts` (upload / add link / list / retry / delete) and `src/components/brain/BrainMaterials.tsx`, mounted in `brain.tsx` beside Notes. The existing tiny-text drop handler is retired — one drop zone handles every type.
- **Guardrails**: 25MB per file, ~200k characters of extracted text per material (truncated with a visible note), 25 materials per startup. Failures are recorded on the row so Retry is one call and a bad file never blocks chat.
