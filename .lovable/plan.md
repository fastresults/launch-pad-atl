## Admin-only "Delete venture" action

### Context
- Today the SnapshotCard kebab on `/dashboard/hub` only offers **Archive** / **Restore**. By design, no one (not even the owner) can delete — the user already said paid ventures shouldn't be deletable by founders.
- Admins (`useAuth().isAdmin`, true for `admin` + `super_admin`) need an escape hatch for refunds, test accounts, abuse, accidental duplicates, GDPR-style erasure requests.
- An admin "views as user" surface already exists at `/admin/members/:userId/view` and is intentionally read-only (yellow banner says "Admin view — read-only"). Founders Hub isn't surfaced there yet; this plan keeps that page read-only and adds delete only where admins actually browse ventures.

### Where the Delete action appears
1. **`SnapshotCard` kebab menu** (used on `/dashboard/hub`) — adds a red **Delete venture** item, **only rendered when `isAdmin`**. Sits below Archive, separated by a divider. Disabled state when the snapshot is currently `enriching` or `generating` with a tooltip "Wait for the active job to finish, then delete."
2. **`/admin/hub`** (the existing admin venture list) — same Delete affordance on each row so admins can clean up without impersonating.

### Confirmation UX (destructive, type-to-confirm)
Reusing `AlertDialog` like the archive confirm, but harder to dismiss:

- Title: **"Delete this venture permanently?"**
- Body lists exactly what gets removed for the snapshot:
  - The startup record (`venture_snapshots`)
  - All generated documents and revisions (`venture_documents`, `deliverable_revisions` scoped to it)
  - All generation jobs and failure logs (`venture_generation_jobs`, `venture_generation_failures`)
  - Any uploaded venture doc images in the `venture-doc-images` bucket under that snapshot's prefix
- Shows the snapshot title + owner email + created date so admins don't nuke the wrong row.
- Requires typing the company name (or `DELETE` if no company name) before the red **Delete forever** button enables. Cancel is the default focus.
- Success toast: "Deleted '{name}'." Then refresh `["hub", "snapshots"]` and `["admin", "hub"]`.

### Server-side
- New server function **`adminDeleteSnapshot({ id })`** in `src/lib/foundersHub.functions.ts`:
  - Guards: re-checks `is_admin(auth.uid())` via a `select` against `user_roles` before doing anything (defense in depth; RLS is the real gate).
  - Order of deletion: storage objects → child rows (jobs, failures, documents, revisions if scoped, pipeline runs/steps tied to the snapshot if any) → the snapshot row. Wrapped in a single edge-function call so it's atomic from the client's perspective. Logs the deletion (admin user_id, target snapshot_id, owner_id, timestamp) to a lightweight `admin_audit_log` table — or, if we don't want a new table this pass, just `console.log` into the edge function so it lands in function logs.
- **RLS / GRANT update via migration** on `venture_snapshots` and its children: add an `admin can delete` policy `USING (public.is_admin(auth.uid()))` for `DELETE` on each child table that doesn't already cascade. Verify FK cascade behavior first; if children already `ON DELETE CASCADE`, the policy only needs to live on `venture_snapshots`.

### Files
- `src/lib/foundersHub.functions.ts` — add `adminDeleteSnapshot`.
- `supabase/functions/venture-admin-delete/index.ts` (new edge function) — admin-gated cascade + storage cleanup + audit log.
- `supabase/migrations/<ts>_venture_admin_delete_policies.sql` — admin DELETE policies on `venture_snapshots` (+ child tables if needed), no schema changes to existing columns.
- `src/routes/_authenticated/dashboard/hub.index.tsx` — extend `SnapshotCard` menu with admin-only Delete item and the type-to-confirm dialog.
- `src/routes/_authenticated/_admin/admin.hub.tsx` — same Delete affordance for the admin list view.
- `src/hooks/use-auth.tsx` — no changes; `isAdmin` already exposed.

### Explicitly out of scope
- Adding venture management to `/admin/members/:userId/view` (keep it read-only this pass; admins use `/admin/hub` to delete).
- Soft-delete / undo window (the action is hard delete by design — Archive already covers the recoverable case).
- Bulk delete from the admin list (one at a time is safer for a destructive op; revisit if admins ask).
