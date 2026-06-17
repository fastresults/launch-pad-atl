# Super Admin Login → Black Screen Fix

## What's happening

Sign-in itself works. After the auth state updates, `login.tsx` redirects super-admins to `/admin`. That route mounts `AdminLayout` (dark `ThemeProvider`) and then `AdminDashboard` (`admin.index.tsx`), which **immediately crashes on render**, leaving an empty dark page — the "black screen" the user sees.

## Root cause

`admin.index.tsx` was written for an older API shape, but the data-layer files (`*.functions.ts`) have since been simplified to plain Supabase calls that return raw rows. The two no longer agree, so the page throws a `TypeError` on first render.

Concrete mismatches in `src/routes/_authenticated/_admin/admin.index.tsx`:

| Call site in admin.index.tsx | Actual function signature / return |
|---|---|
| `listApplications({ data: { status: "applied" } })` | `listApplications(data?: { status })` — expects flat arg, returns `Row[]` (not `{ counts, applications }`) |
| `listMembers({ data: {} })` | `listMembers(data?: { status })` — returns `Row[]` (not `{ counts, members }`) |
| `listRegistrations()` | returns `Row[]` (not `{ confirmed }`) |
| `getAdminStats()` | returns `{ registrations, members, openInquiries }` — code reads `stats.data?.confirmed` and `stats.data?.users` |
| `apps.data?.counts.applied` | `apps.data` is an array → `.counts.applied` throws `TypeError: Cannot read properties of undefined` |
| `approveMember({ data: { userId } })`, `pauseMember({ data: { userId, reason } })`, etc. | functions take `{ userId }` / `{ userId }` directly; no `reason` param |

There is **no global ErrorBoundary**, so when the dashboard throws, React unmounts the tree and the dark `bg-background` is all that's left → black screen.

Regular users don't hit this because they're sent to `/dashboard`, not `/admin`.

## Fix

Two parts:

### 1. Align `admin.index.tsx` with the current function shapes
Rewrite the data-fetching and derived values in `src/routes/_authenticated/_admin/admin.index.tsx` so it works with arrays + the real `getAdminStats` shape:

- Call functions with flat args: `listApplications({ status: "applied" })`, `listMembers()`, `approveMember({ userId })`, `pauseMember({ userId })`, `rejectMember({ userId })`, `restoreMemberToPending({ userId })`.
- Compute counts client-side from the returned arrays, e.g.:
  ```ts
  const appsList = apps.data ?? [];
  const countsByStatus = appsList.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1; return acc;
  }, {});
  const applicationsPending = (countsByStatus.applied ?? 0) + (countsByStatus.reviewing ?? 0);
  ```
- Replace `stats.data?.confirmed` with `stats.data?.registrations`, and `stats.data?.users` with `stats.data?.members` (or add a `users` count to `getAdminStats`).
- Drop the `reason` UI from pause/reject confirmations, or extend `pauseMember`/`rejectMember` in `members-admin.functions.ts` to accept and persist a reason column.

### 2. Add a safety net so a single broken admin page never blanks the whole app
Wrap `<Outlet />` in `_admin.tsx` (and ideally `_authenticated.tsx`) with a small `ErrorBoundary` that renders a visible "Something went wrong" card with a Retry button. This prevents future regressions from producing another silent black screen and makes the real error visible in the UI instead of only the console.

## Verification

1. Sign in as super admin → land on `/admin` and see the dashboard render with stats, applications, and members lists (no console `TypeError`).
2. Sign in as a regular approved user → still routes to `/dashboard`.
3. Temporarily throw inside an admin page → ErrorBoundary card appears instead of a black screen.

## Out of scope

No changes to auth, Google OAuth, RLS, or routing guards — those are working. This is purely a render-time crash on the admin dashboard.
