
# Document hero images via Nano Banana Pro (per-user, per-venture storage)

Every generated venture document gets a 16:9 illustration that visualizes its concept. The image renders at the top of the View modal, above the document body. Each user's images are isolated, and within their account each venture has its own folder.

## 1. Storage layout

One private bucket, `venture-doc-images`, partitioned by user and venture so every founder owns their own space and every venture they create is its own folder inside it.

Path pattern:
```
{user_id}/{snapshot_id}/{document_type}/{version}.png
```

Why one bucket instead of literally one bucket per venture: Supabase storage caps and listing/RLS work cleanly at the path level, and creating a new bucket on every "New Venture" click would hit account limits fast and can't be done from the client. The `{user_id}/{snapshot_id}/...` prefix gives each founder a dedicated namespace and each venture a dedicated subfolder — functionally equivalent to "their own bucket per venture" while staying within platform best practice. (If you'd rather have literal per-venture buckets, say so and I'll switch to that — it just trades cleanliness for a per-venture provisioning step.)

RLS on `storage.objects` for this bucket:
- Owner read: `auth.uid()::text = (storage.foldername(name))[1]`
- Owner write/update/delete: same predicate
- Service role: full access (used by the edge function)
- No public access; the viewer fetches a short-lived **signed URL** instead.

## 2. Schema

Migration adds two columns to `venture_documents`:
- `hero_image_path text` — storage object key
- `hero_image_prompt text` — prompt used (for debugging / regenerate)

Old rows stay null; viewer falls back to a placeholder with a "Generate visual" button.

## 3. New edge function: `venture-document-image`

`supabase/functions/venture-document-image/index.ts`

Input: `{ snapshotId, documentType, force?: boolean }`.

Flow:
1. Verify JWT, resolve `user_id` from the token.
2. Load the `venture_documents` row + parent `venture_snapshots`; confirm the snapshot belongs to this `user_id` (defense in depth).
3. Skip if `hero_image_path` exists and `force !== true`.
4. Build a visual prompt from:
   - document title (`venture_document_types.name`)
   - first ~600 chars of `content` stripped of markdown
   - brand_tokens colors + mood adjectives when present (so visuals stay on-brand)
   - explicit rules: "no text, no logos, no UI mockups, editorial illustration, 16:9 cinematic composition"
5. Call Lovable AI Gateway `google/gemini-3-pro-image` (Nano Banana Pro) via the chat-completions image shape (`messages` + `modalities: ["image","text"]`), non-streaming.
6. Decode `b64_json` → upload with service role to `{user_id}/{snapshotId}/{documentType}/{version}.png`.
7. Update the document row with `hero_image_path` + `hero_image_prompt`.
8. Return `{ path }`. The client mints its own signed URL via the user-scoped Supabase client.

Errors (429 / 402 / moderation) are caught and logged to `venture_generation_failures` — the document itself is never lost when image generation fails.

## 4. Auto-trigger after document generation

In `venture-generate-document` (and the same point inside `venture-bulk-generate`'s per-doc loop), after the `status: "complete"` upsert, fire-and-forget invoke `venture-document-image` with `{ snapshotId, documentType }`. Best-effort — failure does not fail the doc.

## 5. Frontend: viewer modal

`src/components/hub/DocumentViewer.tsx`

- If `doc.hero_image_path`, call `supabase.storage.from("venture-doc-images").createSignedUrl(path, 3600)` and render inside an `AspectRatio ratio={16/9}` block above the sticky header / title — rounded-lg, ring, overflow-hidden, `loading="eager"`, `alt={doc.title}`.
- If missing: gradient placeholder (using brand_tokens when present) with a "Generate visual" button that invokes the edge function and refetches.
- Hover-only "Regenerate" icon button on existing images (invokes with `force: true`, writes a new versioned path).

## 6. Types

Add `hero_image_path` and `hero_image_prompt` to the `venture_documents` row type in `src/integrations/supabase/types.ts` so the viewer compiles.

## 7. Files touched

| File | Change |
|---|---|
| Storage bucket `venture-doc-images` (private) | new, created via the storage tool |
| `supabase/migrations/*_doc_hero_images.sql` | 2 new columns + storage.objects RLS for the bucket |
| `supabase/functions/venture-document-image/index.ts` | new |
| `supabase/functions/venture-generate-document/index.ts` | fire-and-forget invoke after success |
| `supabase/functions/venture-bulk-generate/index.ts` | same hook per doc |
| `src/components/hub/DocumentViewer.tsx` | hero image block + generate / regenerate controls |
| `src/integrations/supabase/types.ts` | add the two new columns |

## Out of scope

- Backfilling images for existing documents (handled lazily via "Generate visual" when an older doc is opened).
- Multiple image variants / picker UI.
- Embedding the image into Markdown / PDF exports.

## Verification

Open a freshly generated doc → modal shows a 16:9 illustration above the title within a few seconds, served from `{your-user-id}/{venture-id}/{document_type}/1.png`. A second user cannot read another user's path (RLS denies). Older doc → placeholder + "Generate visual" works. Regenerate → version increments, new image replaces old.
