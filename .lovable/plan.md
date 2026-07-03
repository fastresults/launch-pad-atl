# Hero Images Not Loading in Asset/Document Modals — Fix Plan

## Root causes

Audit of `DocumentViewer.tsx`, `venture-document-image` edge function, and `workflow.tsx` shows the images ARE generated, but the UI never picks them up:

1. **No realtime / poll for in-flight images.** When the workflow batch kicks off a hero-image job, `venture_documents.hero_image_status = "generating"`. Later the user opens the modal — the auto-generate effect explicitly bails on `status === "generating"` (correct), but there is no subscription or polling loop, so the modal sits with no image forever until the user closes and reopens.
2. **"in_flight" collision surfaces as an error.** If the modal opens while the server-side atomic claim is held by the batch job, `venture-document-image` returns `{skipped, reason: "in_flight"}`, and the modal displays "Visual is already being generated. Reopen this document in a moment." — a dead-end UX.
3. **Status guard is too narrow.** The auto-gen effect only skips on `generating|failed`, but the server writes `ready` (not "complete"). Any legacy row with a status like `queued` or a null path + no status re-triggers generation instead of polling.
4. **Signed URL never retried on `<img onerror>`.** URLs are 1-hour signed; if the modal stays open past that (or the underlying object was just replaced by a regenerate), the `<img>` fails silently with a broken icon.
5. **No preload / priority hints.** The signed URL isn't attached with `fetchpriority="high"` or `decoding="async"`, and there's no `<link rel="preload">` while the signed URL is being minted, so the network fetch waits behind React paint.
6. **Modal state doesn't react to external DB updates.** Even when the workflow page's query invalidates and `doc.hero_image_path` changes on the parent, `DocumentViewer` only resets on `snapshot_id/document_type/hero_image_path` — but the modal is often opened with a stale `doc` prop from a cached list and never re-fetches its own row.

## Fix

### 1. `src/components/hub/DocumentViewer.tsx`
- Add a **Supabase realtime subscription** while the modal is open, filtered to `venture_documents` row (`snapshot_id`+`document_type`). On UPDATE, sync `heroPath` and `hero_image_status` into local state. Fallback to a `setInterval` poll (every 4 s, capped at 3 min) if the realtime channel isn't `SUBSCRIBED` within 2 s.
- Treat server response `{skipped, reason: "in_flight"}` as **success-pending**: set `heroLoading=true`, show "Visual is being painted — this usually takes 20–40s", and let the poll/realtime pick up the finished path instead of raising an error toast.
- When `open` and `hero_image_status === "generating"`, show the same in-progress state and start polling (don't call the edge function again — it would just no-op).
- Add `<img onError>` handler that (a) invalidates the signed URL cache, (b) mints a fresh one once, and (c) if that also fails, surfaces a Retry button — this recovers from URL expiry and mid-regenerate races.
- Render the hero `<img>` with `loading="eager" decoding="async" fetchpriority="high"`; while `heroSigning`, inject a `<link rel="preload" as="image">` for the signed URL as soon as it resolves.
- Keep signed URL in memory for the modal session (avoid re-signing on every state change; current effect re-signs whenever `heroRetryNonce` changes, which is fine — just also expose a `refresh()` for the onError path).

### 2. `src/routes/_authenticated/dashboard/workflow.$key.tsx`
Same realtime subscription pattern for the per-asset workflow page so the hero image appears the moment the batch worker writes `hero_image_path`, without requiring a manual refresh.

### 3. `src/routes/_authenticated/dashboard/workflow.tsx`
Subscribe once (channel scoped to `snapshot_id`) to any `venture_documents` UPDATE and `queryClient.invalidateQueries(["workflow", snapshotId])` so the "Hero images X / Y" bar and per-card status badges advance live instead of only when the user refetches.

### 4. `venture-document-image` (small server-side improvement, no behavior change)
When returning `{skipped: true, reason: "in_flight"}`, also return the current `hero_image_started_at` so the client can show a realistic "started 12s ago" hint. Not strictly required for the fix — include only if trivial.

## Technical notes

- Realtime channel name: `hero:${snapshotId}:${documentType}` with `postgres_changes` filter `event=UPDATE, schema=public, table=venture_documents, filter=snapshot_id=eq.${id}` (client-side filter by `document_type`, since PostgREST filter accepts one column).
- Poll interval 4 s, max 45 attempts (3 min), then stop and surface Retry. This matches server-side "stale > 3 min" claim expiry.
- Preload tag lifecycle: append on mint, remove on unmount / when `heroUrl` changes.
- No DB migrations. No new tables. No RLS changes.

## Out of scope
- Prompt/model tuning (already tuned to `gemini-3.1-flash-image`).
- Any change to how the batch pipeline schedules image jobs.
- Admin-impersonation path in `venture-document-image` (separate concern; not the reported symptom).
