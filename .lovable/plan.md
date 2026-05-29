# Media Hub: Drag-and-drop + Grid/List views

All work is frontend-only in `src/components/media/MediaHub.tsx`. The server functions needed (`updateAsset` with `folderId`, `setCollectionMembership`) already exist.

## 1. Drag-and-drop assets into folders & collections

**Draggable**: every asset card/row gets `draggable` + `onDragStart` that stores the asset id (and includes all currently selected ids if the dragged item is part of the selection, so you can drag a multi-selection in one go).

**Drop targets** in the left sidebar:
- "All files" row → clears folder (`folder_id = null`)
- Each folder row → sets `folder_id` to that folder
- Each collection row → adds asset(s) to that collection via `setCollectionMembership({action:"add"})`

Visual feedback: drop targets highlight on `onDragOver` (ring + bg change), revert on `onDragLeave/onDrop`.

On drop:
- Folder target → call `updateAsset({ id, folderId })` for each dragged id, then invalidate `["media"]`.
- Collection target → call `setCollectionMembership({ collectionId, assetId, action:"add" })` for each dragged id, then toast and invalidate collection queries.

Bulk action also exposed as a button: when `selectedIds.size > 0`, show a "Move to…" dropdown (folder list) + "Add to collection…" dropdown next to "Push to users", for users who don't want to drag.

Clicking a collection in the sidebar also filters the main view to that collection's members (currently collections are display-only). This requires a small extension to `listMedia` call: pass `collectionId` filter — but `listMedia` already supports it (line 66 references `media_collection_items`). I'll wire `collectionId` into the query state next to `folderId`.

## 2. Grid vs List view toggle

Add a `viewMode: "grid" | "list"` state with a toggle (Grid/List icons) in the top toolbar, persisted to `localStorage` so the choice sticks per browser.

**Grid view** (existing): card with square thumbnail/icon, title, size, badges. Keep current responsive 2/3/4 columns.

**List view** (new): table-like rows with columns
- thumbnail (40px) / type icon
- name + AI summary snippet
- type badge
- size
- tags (first 3 chips)
- created date
- row-level actions (open, checkbox)

Both views share the same selection, drag, click-to-open behavior. Rows in list view are also `draggable` and have the same drop logic when targeting sidebar items.

## 3. Small UX touches
- Sidebar folders/collections show a subtle "drop here" outline only while a drag is active (track with a `isDragging` state on the parent).
- After a successful drop, briefly flash the destination row.
- "Push to users" button stays as-is.

## Files changed
- `src/components/media/MediaHub.tsx` — only file edited. No DB, no new server functions, no migrations.

## Out of scope
- Drag to reorder within a folder (no sort_order column).
- Drag files OUT of a collection (use the drawer's remove action — added as a small "Remove from collection" chip in the drawer when viewing an asset that's in collections; optional, can defer).
- Nested folder drag (moving a folder into another folder).
