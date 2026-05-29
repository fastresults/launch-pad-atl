## Media Hub — Plan

A unified media management system with two scopes:
- **Master Hub** — super-admin only, holds shared/library assets unrelated to any specific attendee.
- **User Hubs** — one per registrant, owned by the workshop user, also fully accessible to super admin. Super admin can push files from the Master Hub (or direct upload) into any user hub.

### 1. Storage

Two private Supabase Storage buckets:
- `master-media` — super-admin only (RLS via `is_admin`).
- `user-media` — keyed by `{user_id}/...`; user accesses their own folder, admin accesses all.

Limits: 100MB/file. Allowed MIME groups: documents (PDF, Word, text), images, audio, video.

Access is always via short-lived **signed URLs** (download, upload, streaming).

### 2. Database

New tables (all with RLS + GRANTs):

- **`media_assets`** — one row per file
  - `scope` enum: `master` | `user`
  - `owner_user_id` (null for master)
  - `storage_bucket`, `storage_path`, `original_name`, `mime_type`, `size_bytes`, `media_type` (doc/image/audio/video — derived)
  - `title`, `description`, `tags text[]`
  - `folder_id` (nullable, nested folders)
  - `thumbnail_path` (for images/video)
  - `ai_summary`, `ai_transcript`, `ai_tags text[]`, `ai_status` (pending/processing/ready/failed)
  - `pushed_from_asset_id` (nullable — links a user-hub copy back to the master original for traceability; copy is independent)
  - `pushed_by`, `pushed_at` (nullable, set on admin push)
  - audit: `created_by`, `created_at`, `updated_at`

- **`media_folders`** — nested tree
  - `scope`, `owner_user_id` (null for master), `parent_id` (nullable), `name`, `path` (materialized for fast lookup)

- **`media_collections`** + **`media_collection_items`** — flat named groupings (many-to-many with assets)

- **`media_push_log`** — audit of admin pushes (`source_asset_id`, `target_user_id`, `target_asset_id`, `admin_id`, `note`, `created_at`)

**RLS summary**
- Master scope: read/write requires `is_admin(auth.uid())`.
- User scope: owner can full CRUD on own rows; admin can full CRUD on all.
- Folders/collections follow the same rule based on their `scope` + `owner_user_id`.

**Categories by type** are derived (not stored as a table) from `media_type` for filter chips.

### 3. Server Functions (`src/lib/media.functions.ts`)

All protected with `requireSupabaseAuth`; admin-only ones additionally check `is_admin`.

- `listMedia({ scope, ownerUserId?, folderId?, collectionId?, mediaType?, tags?, search? })`
- `getMediaAsset(id)` → row + signed download/stream URL
- `createSignedUploadUrl({ scope, ownerUserId?, folderId?, filename, mimeType, sizeBytes })` — server validates size/MIME, returns signed PUT URL + pending asset row
- `finalizeUpload(assetId)` — marks ready, kicks off thumbnail + AI processing
- `updateMediaAsset(id, { title, description, tags, folderId })`
- `deleteMediaAsset(id)`
- `moveToCollection(assetId, collectionId, add|remove)`
- Folders: `createFolder`, `renameFolder`, `moveFolder`, `deleteFolder`
- Collections: `createCollection`, `renameCollection`, `deleteCollection`
- **Admin-only**: `pushAssetsToUser({ sourceAssetIds, targetUserIds, targetFolderId?, note? })` — copies file in storage to each user's bucket path, inserts new `media_assets` row(s) with `scope=user`, `pushed_from_asset_id`, logs to `media_push_log`. Independent copy: user owns it and can rename/delete.
- **Admin-only**: `listUserHubs()`, `getUserHubSummary(userId)`

### 4. AI Processing

Background processing on `finalizeUpload`, using Lovable AI Gateway (already wired in `src/lib/ai-gateway.server.ts`):
- **Images** → `google/gemini-2.5-flash` vision call → `ai_tags`, `ai_summary` (alt-text).
- **PDF / Word / text docs** → extract text server-side, send to `google/gemini-3-flash-preview` → `ai_summary` + `ai_tags`.
- **Audio / video** → transcribe via Gemini multimodal (or chunked) → `ai_transcript` + `ai_summary` + `ai_tags`.
- **Thumbnails**: images via on-the-fly Supabase transform; video via first-frame extraction stored at `thumbnail_path`.

Failure tolerant: `ai_status` lets UI show a retry button. Admin can trigger `reprocessAi(assetId)`.

### 5. Frontend

Shared component: `<MediaHub scope="master" | "user" ownerUserId={...} canAdminPush={bool} />` — drives both contexts to avoid duplication.

**Layout**
- Left sidebar: Folder tree, Collections list, Type filter chips (All / Documents / Images / Audio / Video), Tag cloud.
- Top bar: Search, view toggle (Grid/List), Upload button, "New folder", "New collection". Admin in user hubs gets "Push from Master".
- Main: Grid (thumbnails for images/video, icon+title for docs/audio) or List (name, type, size, tags, date).
- Right drawer (on select): Preview, metadata edit, tags, AI summary/transcript, move/copy, delete.

**Previews**
- Images: lightbox gallery.
- PDFs: inline `<iframe>` or `react-pdf`.
- Audio/video: native `<audio>`/`<video>` with signed URL.
- Docs (Word): download + AI summary inline.

**Uploads**
- Drag-and-drop + file picker, multi-file, chunked progress, client-side type/size guard.

**Routes**
- `/_authenticated/dashboard/media` — current user's hub.
- `/_authenticated/_admin/admin/media` — Master Hub.
- `/_authenticated/_admin/admin/attendees/$userId/media` — that user's hub from admin side, with "Push from Master" picker.

Master Hub gets a multi-select → "Push to users" dialog (multi-user picker, optional target folder, note). Returns per-user success/failure summary.

### 6. Realtime

`media_assets` added to `supabase_realtime`: a user sees admin-pushed files appear live in their hub; admin sees user uploads live.

### 7. Surfacing in existing app

- Dashboard nav: add "Media" tab.
- Admin nav: add "Media Library" (master) and "Media" inside attendee detail page.
- The existing `attendee_documents` table is intake-only (founder profile docs); media hub is separate. We'll cross-link by surfacing intake docs as a read-only collection inside the user hub.

### Technical notes

- New migration creates buckets, tables, enums, indexes (`scope`, `owner_user_id`, `folder_id`, GIN on `tags`), RLS, GRANTs, and adds tables to realtime publication.
- AI processing runs inside the `finalizeUpload` server function (not blocking the upload PUT). Long-running transcription runs fire-and-forget with status polling via Realtime.
- Storage paths: `master/{folder_path}/{uuid}-{filename}` and `users/{user_id}/{folder_path}/{uuid}-{filename}`.
- Push = `storage.copy` (server-side) + new asset row; original untouched; user copy is fully independent.

### Out of scope (flag for follow-up)
- Versioning / file history
- Sharing between users
- External shareable public links
- Quotas per user
