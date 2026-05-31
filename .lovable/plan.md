## Goal

Replace the "Pending member approvals" panel on the admin dashboard (`/admin`) with an **All members** panel that shows every member with their current status and inline status actions — no "View all" click needed for routine triage.

## Changes

### `src/routes/_authenticated/_admin/admin.index.tsx`

1. **Query all members instead of just pending**
   - Change the `members` query to call `listMembers({ data: {} })` (no status filter) with key `["admin", "members", "all"]`.
   - Keep `pendingMembers` stat from `members.data.counts.pending` (still works — counts are returned regardless of filter).

2. **Replace the panel** "Pending member approvals" → "Members":
   - Render up to ~12 rows by default, sorted: `pending` first, then `paused`, then `approved`, then `rejected`. Add a small client-side status filter (All / Pending / Approved / Paused / Rejected) as chip toggles in the panel toolbar so the admin can slice without leaving the dashboard.
   - Each row shows: name, email, intake badge/idea (as today), a **status Badge** (color-coded: pending=amber, approved=emerald, paused=rose, rejected=muted), and a kebab/`DropdownMenu` of contextual actions:
     - pending → Approve, Reject
     - approved → Pause access, Move to pending
     - paused → Reinstate, Move to pending
     - rejected → Move to pending
   - Wire actions to the existing server fns already used on `admin.members.tsx` (`approveMember`, `rejectMember`, `pauseMember`, `setMemberPending`) via `useServerFn`. Reuse the existing `ConfirmDialog` component for destructive actions (Pause, Reject) with reason textarea — no native modals.
   - Empty state copy: "No members yet. New signups will appear here."
   - Keep a small "Manage all →" link to `/admin/members` for the full management page, but it's no longer the only path to act.

3. **No backend / schema / RLS changes.** All required server functions already exist.

## Out of scope

- The `/admin/members` full page stays as-is (it's the deep-management view).
- No new columns, migrations, or auth changes.

## Technical notes

- `listMembers` already returns the full list and counts when called with no status; the filter is applied client-side via the chip toggles.
- Color tokens: use existing semantic classes already used in `admin.members.tsx` for status badges to stay consistent.
- Loading state: skeleton rows while `members.isLoading`.
