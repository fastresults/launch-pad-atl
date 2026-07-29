## Where it is today

Impersonation can only be started from **System → Users & roles** (`/admin/users`) — each user row has a "View as" button, visible to super admins only. Exiting is surfaced in two places (sidebar footer pill and the ⌘K palette), but *starting* is not discoverable from Members, Attendees, the dashboard, or the command palette.

## Changes

1. **Rename + describe the nav entry** (`src/lib/admin-nav.ts`): label stays "Users & roles" but description becomes "Grant admin access or view the app as a user", and add keywords `impersonate`, `view as`, `sign in as`, `act as` so ⌘K finds it by intent.

2. **Command palette action** (`src/components/admin/AdminCommandMenu.tsx`): add a super-admin-only "View as a user…" action in the actions group that routes to `/admin/users`, sitting next to the existing "Exit impersonation" item.

3. **"View as" on the people pages** — surface the action where admins already are:
   - `admin.attendees.$userId.index.tsx`: add a "View as" button in the header action row (super admin only) calling `startImpersonation` with that user.
   - `admin.members.tsx`: add "View as" to each member row's action set (super admin only).
   Both reuse the exact `startImpersonation` call from `admin.users.tsx` so behavior and the confirm/banner flow stay identical.

4. **Dashboard quick action** (`src/components/admin/dashboard/QuickActions.tsx`): add "View as a user" linking to `/admin/users` for super admins.

## Technical notes

`startImpersonation` comes from `useAuth()` in `src/hooks/use-auth.tsx`; the active-session banner is `ImpersonationBanner.tsx` and needs no change. All new entry points are gated on `isSuperAdmin` — no change to who can impersonate.
