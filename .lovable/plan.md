## Goal

Make the new-account review queue (founders who signed up but haven't been approved or paid) impossible to miss from the admin dashboard.

The `/admin/members` page already exists and works. What's missing is **visibility from the dashboard**: no stat card, no panel, no sidebar badge, and the link is buried in Operations. From the Dashboard today an admin has no signal that pending members are waiting.

## Plan

### 1. Surface a "Pending members" badge in the sidebar

`src/lib/admin-badges.functions.ts` → add a `membersPending` count: number of `profiles` rows where `member_status = 'pending'` AND user is not in `user_roles` with admin/super_admin.

`src/lib/admin-nav.ts` → extend `badgeKey` union with `"membersPending"` and attach it to the existing Members nav item so the red count chip appears next to it, the same way Applications/Inquiries already do.

`src/components/admin/AdminSidebar.tsx` → wire the new key into the badge lookup (mechanical, mirrors existing keys).

### 2. Add a "Pending members" stat card + panel on `/admin`

`src/routes/_authenticated/_admin/admin.index.tsx`:

- Add a 5th StatCard: **Pending members** → links to `/admin/members?tab=pending`.
- Add a new Panel below the existing two: **Pending member approvals**, showing the latest 6 pending signups (name, email, startup type/one-liner if intake submitted, "No intake yet" otherwise) with inline **Approve** and **Review** buttons. Empty state: "No pending members."
- Data: call the existing `listMembers({ status: "pending" })` server fn — no new endpoint needed.

### 3. Promote Members in the sidebar order

In `src/lib/admin-nav.ts`, move **Members** to the top of the Operations group (above Applications) so the gating queue is the first thing admins see, matching the new account flow we just built.

### 4. Make `/admin/members` deep-linkable per tab

`src/routes/_authenticated/_admin/admin.members.tsx`:

- Accept a `?tab=pending|approved|rejected|no_intake` search param via `validateSearch`, hydrate the `tab` state from it, and update the URL when the user switches tabs. This lets the dashboard card and the sidebar badge both deep-link straight into the Pending tab.

## Technical notes

- `membersPending` count query: `profiles` where `member_status = 'pending'` minus user_ids present in `user_roles` with role in (`admin`,`super_admin`). One round-trip via `.not('user_id','in', '(select user_id from user_roles where role in (...))')` is awkward over PostgREST; simpler: fetch admin user_ids once (already cheap, same pattern `listMembers` uses) and do `select id, head:true` with `.eq('member_status','pending').not('user_id','in',`(${ids.join(',')})`)`. Fallback if `ids` is empty: skip the `not in` clause.
- No schema migration. No new server fn beyond the badge count addition.
- No changes to the welcome/intake flow, approval logic, or payment auto-approval trigger — those are already wired.

## Out of scope

- Email notifications to admins on new signup (the intake notification email already exists; pure-signup notification can be a follow-up if you want it).
- Bulk approve/reject UI.