Audit findings

- Market Analysis already has a stored hero image and the database row is `hero_image_status = ready` with a valid `hero_image_path`.
- The session replay shows the modal briefly receives and renders a signed image URL, then the `<img>` fails and the UI removes it, falls back to the placeholder, and shows `Generate visual` again.
- Because `heroLoading` returns to false and `heroStatus` can remain `ready`, the current UI makes a ready-but-not-displayed image look like it was never generated.
- The current modal signs URLs client-side every time and only retries once. It does not keep a durable in-memory image cache across modal opens, and image-load failure collapses back to the same empty state as “no image exists.”
- Polling/realtime exists, but it is mostly watching database state. The failure is now in the final stored-file retrieval/render state.

Plan

1. Make image loading state explicit
   - Split the hero states into:
     - no image path
     - generation in progress
     - image path ready, signing URL
     - signed URL ready, browser loading image
     - image displayed
     - stored image exists but failed to display
   - If `hero_image_path` exists, never show the plain `Generate visual` empty state. Show `Loading saved visual`, `Retry load`, or `Regenerate visual` instead.

2. Add a reusable signed-image cache
   - Upgrade `src/lib/storageSignedUrl.ts` with an in-memory cache keyed by `bucket:path`.
   - Reuse signed URLs until shortly before expiration instead of re-signing on every modal open.
   - Deduplicate concurrent signing requests so multiple modals/cards do not stampede Supabase Storage.
   - Preload signed image URLs as soon as they are minted.

3. Harden `DocumentViewer` image rendering
   - Keep the last good `heroUrl` visible during regeneration instead of blanking the image immediately.
   - Add a browser image preflight using `new Image()` before swapping the visible `<img>` source.
   - On signed URL failure, re-sign and retry with a short backoff before showing an error.
   - If the file exists in the DB but the browser cannot display it, show “Saved visual is being reloaded…” and then a clear `Retry load` action, not `Generate visual`.

4. Make successful generation load immediately
   - When `venture-document-image` returns `{ path }`, set `heroStatus = ready`, set `heroPath`, sign/preload immediately, and invalidate the document list query so parent cards also reflect the ready image state.
   - Avoid waiting for the 4-second polling loop when the current function call already returned the final path.

5. Improve edge function response and storage metadata
   - Keep the fast image model as default.
   - Return `{ ok, path, status: "ready" }` consistently when an image already exists or finishes generating.
   - Keep long cache headers on uploaded files.
   - Add lightweight timing logs for claim, model generation, upload, and DB update so future issues can be isolated quickly.

6. Fix admin/impersonation edge cases if present
   - Make `venture-document-image` match the admin-impersonation ownership pattern already used for social/content assets.
   - Keep files stored under the venture owner’s folder, while allowing admins to generate and view during impersonation.

7. Verify against the reported case
   - Re-open Market Analysis for the affected snapshot.
   - Confirm that a ready stored path shows a loading/retry state instead of `Generate visual` if the browser has not displayed the image yet.
   - Confirm the image appears immediately after signing/preload succeeds.
   - Regenerate once and verify the old image remains visible until the replacement image is loaded.