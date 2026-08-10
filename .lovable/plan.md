# Peek = the real member dashboard, with control

Today "Peek" opens a bespoke read-only admin page (`/admin/members/:userId/view`) with tabs and cards that look nothing like what the member actually sees. Meanwhile the "Open dashboard" button on Users already does the right thing: it starts an audited impersonation session and lands on the real dashboard.

This plan makes Peek use that same path everywhere, so admins always see exact dashboard parity and can act on the member's behalf immediately.

## What changes for the admin

1. Clicking **Peek** (Users list, Members list) starts an audited impersonation session and opens the member's real `/dashboard` — same sidebar, same Today card, same Second Brain, Brief, Deliverables, Ventures, files, profile. No parallel UI to maintain.
2. Full control from the first click: anything the member can do, the admin can do as them (generate assets, edit the brief, run the studios, delete). Writes are attributed to the member; the actor is recorded in audit fields.
3. The amber impersonation banner becomes the control bar and follows the admin through every dashboard page:
   - Who they are acting as (name + email) and a live "acting with full control" state.
   - **Member access on/off** toggle (existing) to see the member's real gates instead of admin bypass.
   - **Back to members** — exits impersonation and returns to the admin list they came from.
   - Session countdown, since impersonation auto-expires after 1 hour.
4. `/admin/members/:userId/view` no longer renders the old read-only page. It becomes the entry point: it starts impersonation for that user, then redirects to `/dashboard`. Existing links, bookmarks and the Members list keep working.
5. If starting impersonation fails (audit log error, not an admin), the admin stays put and sees an error toast rather than a broken half-state.

## Technical notes

- Entry route `src/routes/_authenticated/_admin/admin.members.$userId.view.tsx` is replaced with a thin launcher: resolve the member's name/email (existing `getMemberView`), call `startImpersonation({ userId, name, email })` from `use-auth`, store the return path (`/admin/members` or `/admin/users`) in sessionStorage, then `navigate("/dashboard", { replace: true })`. Shows a spinner while it runs.
- The Users list "Open dashboard" button keeps its current behaviour; "Peek" becomes a link to the launcher route so both funnel into the same session. Labels align: **Open as member**.
- `ImpersonationBanner.tsx` gains the return-path aware exit button and a remaining-time readout derived from `startedAt` + `IMPERSONATION_TTL_MS` in `src/lib/effective-user.ts`. It already renders in both `_authenticated.tsx` and `_admin.tsx`, so it appears on the dashboard and in admin.
- No new backend work: `start_impersonation` / `end_impersonation` RPCs, the `x-impersonate-user` header path in `src/lib/edge-invoke.ts`, and `resolveOwner` in `supabase/functions/_shared/impersonation.ts` already give the admin write parity as the member.
- The old read-only view components (`VentureCard`, `KVCard`, `Stat`) and `getMemberDocument` usage are removed with the page; `src/lib/admin-member-view.functions.ts` keeps `getMemberView` for the launcher and any admin member detail use.
- Dashboard layout already reads `user` from `use-auth`, which returns the impersonated identity, so parity requires no changes inside `dashboard.tsx` or its child routes.

## Verification

- Peek from both Users and Members, confirm the real dashboard renders with the member's ventures/brief, not the admin's.
- Perform one write as the member (e.g. save a brief field) and confirm it lands on the member's row.
- Exit via the banner and confirm the admin's own dashboard/ventures return unchanged.
