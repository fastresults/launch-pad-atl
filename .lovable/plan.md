## Goal

Add authentication (email/password + Google) and an admin dashboard. The first user to register is automatically promoted to `super_admin` with full backend access. Existing `workshop_registrations` data becomes admin-only viewable.

## Auth methods

- Email + password (default Lovable Cloud)
- Google sign-in via the Lovable managed broker (`lovable.auth.signInWithOAuth("google", ...)`)
- No email auto-confirm (users verify email before login)

## Database changes (one migration)

1. `profiles` table — `id (uuid pk)`, `user_id (uuid unique, → auth.users on delete cascade)`, `email`, `display_name`, `avatar_url`. Public-read RLS so we can show user names in the admin list.
2. `app_role` enum: `super_admin`, `admin`, `user`.
3. `user_roles` table — `id`, `user_id`, `role`, unique `(user_id, role)`. RLS: authenticated users can read their own roles only.
4. `has_role(_user_id uuid, _role app_role)` — SECURITY DEFINER function (avoids RLS recursion).
5. `is_admin(_user_id uuid)` — convenience wrapper returning true for `super_admin` or `admin`.
6. `handle_new_user()` trigger on `auth.users` insert:
   - Insert into `profiles`.
   - If `(select count(*) from auth.users) = 1` → insert `super_admin` row in `user_roles`; otherwise insert `user`.
7. Add RLS to existing `workshop_registrations` (currently has none):
   - INSERT: allow anyone (public registration form keeps working).
   - SELECT / UPDATE / DELETE: `is_admin(auth.uid())` only.
8. GRANTs for each new public-schema table per Lovable Cloud rules.

## Routes

Public:
- `/login` — email/password form + "Continue with Google" button. Redirects to `/admin` if user is admin, otherwise `/`.
- `/signup` — email/password + Google. Same redirect logic after confirmation.
- `/reset-password` — required companion to "Forgot password?".

Auth-gated (`src/routes/_authenticated.tsx` layout):
- `beforeLoad` checks `context.auth.isAuthenticated`, else redirects to `/login`.

Admin-gated (`src/routes/_authenticated/_admin.tsx` nested layout):
- `beforeLoad` checks `is_admin` via a server fn, else redirects to `/`.

Admin pages:
- `/admin` — dashboard overview: registration counts, recent signups.
- `/admin/registrations` — full table of `workshop_registrations` with status updates (pending / confirmed / cancelled).
- `/admin/users` — list users + roles; super_admin can promote/demote admins (super_admin role itself is not assignable from UI).

## Server functions (`src/lib/admin.functions.ts`, `src/lib/auth.functions.ts`)

- `getMyRoles()` — returns current user's roles (used by router context).
- `listRegistrations()` — `requireSupabaseAuth` + admin check, returns all rows.
- `updateRegistrationStatus({ id, status })` — admin-only.
- `listUsersWithRoles()` — super_admin only.
- `setUserRole({ userId, role })` — super_admin only; cannot modify own super_admin row.

All protected by `requireSupabaseAuth` middleware + an in-handler `has_role` check.

## Frontend wiring

- `src/router.tsx` + `src/routes/__root.tsx`: add `auth` to router context (user, isAuthenticated, roles, isAdmin, signOut).
- `src/hooks/use-auth.ts`: subscribe to `supabase.auth.onAuthStateChange`, invalidate router + query cache, expose current user/roles.
- Add `attachSupabaseAuth` to `functionMiddleware` in `src/start.ts` (if not already) so server fns receive the bearer token.
- Header: show "Sign in" when logged out; show user menu (Dashboard link if admin, Sign out) when logged in.

## Configuration calls

- `supabase--configure_social_auth` with `providers: ["google"]` (required so Google sign-in actually works through the broker).
- `supabase--configure_auth` with `auto_confirm_email: false`, `disable_signup: false`, `external_anonymous_users_enabled: false`, `password_hibp_enabled: true`.

## Security notes

- Roles live in `user_roles`, never on `profiles` — prevents client-side privilege escalation.
- First-user-is-super-admin runs inside the DB trigger (atomic, not racy from the client).
- `workshop_registrations` becomes admin-read-only; the public registration form keeps unauthenticated INSERT.
- Super admin role is bootstrap-only — no UI path to grant or revoke `super_admin` after the first user.

## Open question

The "first user = super admin" rule fires on the very next signup. If you want to seed it deliberately, I can instead add a one-time admin bootstrap (e.g. you sign up, then I run a one-line insert to grant your account `super_admin`). Say the word and I'll switch to that approach — otherwise I'll ship the auto-promote trigger.