# Admin: View a member's dashboard

## Problem
On `/admin/members` there's no way for an admin to see what a given member sees in their dashboard (profile, ventures/hub, documents, deliverables). Today admins can only Grant/Lock Hub, Pause, or Reject.

## Recommendation
Add a **read-only "View dashboard"** action per row that opens an admin-scoped mirror of that member's dashboard at `/admin/members/$userId/view`. This is safer and faster than true session impersonation:

- No auth/session swap, no risk of leaving an admin "logged in as" someone.
- Reuses existing dashboard components; data is fetched server-side with admin privileges.
- Clearly badged as an admin view so it can't be confused with the member's real session.

(True impersonation — minting a session for another user — is possible but requires service-role auth-admin calls and a session swap UX; recommend deferring unless you specifically need to *act* as the member.)

## UX

On each member row in `/admin/members`, add a **"View dashboard"** button (ghost/outline, leftmost of the action group, with an `Eye` icon).

Clicking it navigates to `/admin/members/$userId/view`, which renders:

- Sticky **admin banner** at top: `Viewing as {name} ({email}) — read-only` + "Exit view" button back to `/admin/members`.
- Tabbed layout mirroring the member dashboard sections:
  1. **Profile** — `attendee_profiles`, `attendee_founder_profile`, `member_intakes`
  2. **Hub / Ventures** — list of `venture_snapshots` for that user; clicking one opens the existing hub view (including the DocumentViewer with hero images) in read-only mode
  3. **Documents** — `venture_documents` across snapshots
  4. **Deliverables** — `attendee_deliverables` + revisions
  5. **Goals / Brief / Filing** — quick summary cards
- All write actions (buttons, inputs) disabled; any mutation hooks short-circuit when `adminViewMode === true`.

## Technical

### Route
- New file: `src/routes/_authenticated/_admin/admin.members.$userId.view.tsx` (TanStack Router; sits inside the existing `_admin` guard so only admins can hit it).

### Data access
Two options — pick based on existing RLS:

1. **Preferred:** add admin-read RLS policies (using `public.is_admin(auth.uid())`) to the member-owned tables that don't already have them: `attendee_profiles`, `attendee_founder_profile`, `attendee_goals`, `attendee_business_brief`, `attendee_filing_info`, `attendee_deliverables`, `deliverable_revisions`, `attendee_documents`, `member_intakes`, `venture_snapshots`, `venture_documents`. Then the admin route queries directly from the client with `eq('user_id', targetUserId)`.
2. **Alternative:** add an edge function `admin-member-view` that takes `{ userId }`, verifies caller is admin via JWT + `is_admin`, and returns the aggregated payload using the service role. Use this if you don't want to broaden RLS.

Recommend **option 1** — cleaner, no new function, and the `is_admin` helper already exists.

### Read-only enforcement
- Add a small `AdminViewContext` (`{ viewingUserId, isAdminView }`) provided by the route.
- Existing dashboard components read it via hook; when `isAdminView`, hide action buttons and pass `readOnly` to the DocumentViewer / hub views.
- For hub snapshot viewing, reuse `dashboard/hub.$snapshotId.tsx` rendering by extracting its body into a `HubSnapshotView` component that takes `{ snapshotId, userId, readOnly }`, then render it inside the admin route.

### Hero images
Admin signed-URL fetch in `DocumentViewer` will work as-is once the storage RLS includes an admin-read clause: add policy on `storage.objects` for `bucket_id = 'venture-doc-images' AND public.is_admin(auth.uid())`.

### Members list change
In `src/routes/_authenticated/_admin/admin.members.tsx`, add `<Button variant="outline" size="sm" asChild><Link to="/admin/members/$userId/view" params={{ userId: m.user_id }}><Eye /> View</Link></Button>` to each row's action group (all tabs, not just Approved).

## Files touched
- New: `src/routes/_authenticated/_admin/admin.members.$userId.view.tsx`
- New: `src/components/admin/AdminViewBanner.tsx`
- New: `src/components/admin/AdminViewContext.tsx`
- New: `src/components/hub/HubSnapshotView.tsx` (extracted from `dashboard/hub.$snapshotId.tsx`)
- Edit: `src/routes/_authenticated/_admin/admin.members.tsx` (add View button)
- Edit: `src/components/hub/DocumentViewer.tsx` (respect `readOnly`)
- Edit: `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx` (delegate to `HubSnapshotView`)
- Migration: admin-read RLS policies on member-owned tables + `venture-doc-images` storage bucket

## Out of scope
- True session impersonation / acting as the member
- Editing member data from the admin view
- Audit log of admin views (can add later: `admin_view_log` table with `admin_id`, `target_user_id`, `viewed_at`)
