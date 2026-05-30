## Goal

On `/admin/applications`, let admins **select multiple rows**, **bulk-change status / delete**, and **inline-edit** a row's key fields (status, industry, stage) without leaving the list view.

## Scope

This applies to the **Applications** list (`founder_applications`). The dashboard "New applications" panel on `/admin` keeps its read-only preview; "View all" already takes admins to this enhanced page.

## Plan

### 1. Server functions — `src/lib/applications-admin.functions.ts`

Add three new admin-gated server functions (mirroring existing `updateApplicationStatus`):

- **`updateApplication`** — patch a single row. Accepts `{ id, patch: { status?, industry?, stage?, name?, email?, cohort_id? } }`. Uses Zod, scrubs unknown fields, writes via `supabaseAdmin`.
- **`bulkUpdateApplications`** — `{ ids: string[] (max 100), patch: { status } }`. Single `.in('id', ids).update(...)`.
- **`bulkDeleteApplications`** — `{ ids: string[] (max 100) }`. Single `.in('id', ids).delete()`. Guard: skip rows where `converted_registration_id IS NOT NULL` (already promoted to a registration — deleting orphans the registration); return `{ deleted, skipped: [{id, reason}] }` so the UI can surface what was skipped.

All three call `assertAdmin(userId)` like the existing fns. No schema changes needed — `is_admin` policies already cover `UPDATE`/`DELETE` on `founder_applications`.

### 2. List UI — `src/routes/_authenticated/_admin/admin.applications.index.tsx`

- **Selection column**: leftmost `<th>`/`<td>` with a `Checkbox`. Header checkbox = select-all-on-current-filter (indeterminate when partial). Track `selectedIds: Set<string>` in component state; clear on filter/search change.
- **Bulk action bar**: appears above the table when `selectedIds.size > 0`. Shows count + three actions:
  - **Set status →** `DropdownMenu` of the same `STATUS_OPTIONS` (minus "All"). On pick, calls `bulkUpdateApplications`, toast result, invalidate query, clear selection.
  - **Delete** → `AlertDialog` confirm ("Delete N applications? This cannot be undone."). Calls `bulkDeleteApplications`. If `skipped.length > 0`, toast a warning naming the skipped ones (already promoted).
  - **Clear selection**.
- **Inline edit per row**: replace the static Status `<Badge>` cell with a `Select` populated from `STATUS_OPTIONS` (minus "All"). `onValueChange` → `updateApplication({ id, patch: { status } })` with optimistic update via `queryClient.setQueryData`, toast on error + rollback.
- **Per-row delete**: tiny trash `Button` (variant=ghost, size=icon) in a new rightmost actions column, behind the same `AlertDialog` confirm. Same promoted-guard error path.
- Keep the existing "click name → detail page" link intact.

### 3. Empty/loading polish

- Adjust the `colSpan` of the existing empty/loading rows to account for the two new columns (select + actions).
- Keep the search/filter bar untouched; selection clears whenever `status` or `search` changes (effect dep).

## Technical notes

- `bulkDeleteApplications` is the only one with a real risk surface (the `converted_registration_id` orphan case). Handle entirely on the server: fetch the candidate rows' `id, converted_registration_id, name`, partition, delete the safe set, return the split.
- Optimistic updates: cache key is `["admin","applications", status, search]` — already in the file. Use `queryClient.setQueryData` to patch the matching application before the request resolves; on error, refetch.
- No new packages: `Checkbox`, `DropdownMenu`, `Select`, `AlertDialog`, `Button`, `sonner` are all already in the project.

## Out of scope

- Multi-field bulk edit (only status in bulk; single-row edit is broader).
- Undo for bulk delete (toast + refetch only; would need a soft-delete column).
- CSV export — separate ask.