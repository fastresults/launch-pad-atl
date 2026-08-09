# Fix: the app hammers the auth server with a `/user` call every few seconds

## What the logs show

Auth logs are a solid wall of `GET /auth/v1/user` requests — one every ~4 seconds,
continuously, from the preview origin, all `200`. Network capture confirms the same
endpoint is hit repeatedly, and 3 times on a single cold load of `/`.

No runtime errors, no console errors, no failing edge functions. The only anomaly in
the logs is this call volume.

## Root cause (verified in code)

Every client data helper resolves "who am I" with `supabase.auth.getUser()`, which is a
**network round trip to the auth server** — not a local read. Confirmed call sites:
`src/lib/effective-user.ts` (4), `src/lib/workshop-audits.functions.ts` (3),
`src/lib/auth.functions.ts`, `members-admin`, `member-intake`, `applications-admin`,
`workshop-hero-images`, `email/test-send`, plus two route files — 15 total.

Those helpers are called from queries that poll on 3–8 second intervals
(`dashboard/workflow.tsx` 3s/5s, `AIWorklogPill` 4s, `hub.$snapshotId` 4s/8s/10s/15s,
`SocialAutopilot` 3s, `workflow.$key` 4s). Each poll tick therefore fires an extra
auth round trip, which is exactly the ~4s cadence in the logs.

Secondary: on boot, `AuthProvider` runs `loadAccount` from both `getSession()` and the
`INITIAL_SESSION` auth event, so account/roles/profile load 2–3 times per page load.

## The fix

### 1. Cached session-based identity resolver
Add a small helper (in `src/lib/effective-user.ts`) that reads the identity from
`supabase.auth.getSession()` — a local, in-memory/localStorage read with no network
call — instead of `getUser()`. It will:
- dedupe concurrent callers behind a single in-flight promise
- cache the resolved user id, invalidated on `onAuthStateChange`
- keep the exact same public API (`getEffectiveUserId`, `getActorUserId`), so no caller changes shape

Security note: this changes nothing about trust. The client never enforces access —
RLS on the server validates the JWT on every request. `getUser()` on the client was
only ever a convenience read.

### 2. Replace the remaining direct `getUser()` calls
Swap the 15 call sites to the cached resolver (`getActorUserId()` / `getEffectiveUserId()`),
so no polling path can trigger an auth round trip.

### 3. De-duplicate the boot account load
In `src/hooks/use-auth.tsx`, guard `loadAccount` so `getSession()` and `INITIAL_SESSION`
don't both fire it for the same user id — one account/roles/profile load per session change.

## Expected result

Steady-state `/auth/v1/user` traffic drops to effectively zero (only genuine sign-in,
refresh and sign-out events remain). Boot fires one `user_roles` + `profiles` read
instead of three. Polling dashboards get slightly faster because each tick loses a
network hop.

## Technical scope

Files: `src/lib/effective-user.ts`, `src/lib/auth.functions.ts`,
`src/lib/workshop-audits.functions.ts`, `src/lib/members-admin.functions.ts`,
`src/lib/member-intake.functions.ts`, `src/lib/applications-admin.functions.ts`,
`src/lib/workshop-hero-images.functions.ts`, `src/lib/email/test-send.functions.ts`,
`src/routes/_authenticated/dashboard/hub.new.tsx`,
`src/routes/_authenticated/_admin/admin.social.setup.$platform.tsx`,
`src/hooks/use-auth.tsx`.

No schema changes, no backend changes, no UI changes.

## Verification

Re-run the browser capture on `/` and an authenticated dashboard route for 30s and
confirm `auth/v1/user` request count is 0–1 instead of ~8, with all data still loading.
