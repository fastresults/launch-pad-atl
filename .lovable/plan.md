## Goal
Admins (and super admins) can open **any user's dashboard** — not just the read-only member view — and use every founder-facing function (Concept Studio, Brand Wizard, Social Studio, Content Studio, Founder Playbook, brief, files, etc.) as that user. From **Admin → Users & roles**, every row gets an **"Open dashboard"** action that starts the session and lands on `/dashboard`. A persistent amber banner + "Exit impersonation" button is visible on every page while active.

Uses the existing admin-aware RLS: every founder table already has `is_admin(auth.uid())` policies (proven by `admin.members.$userId.view.tsx` reading the same rows today). We don't need JWT swap — we scope queries client-side to a target `user_id` when an admin is impersonating.

## What already exists (reuse)
- `getMemberView` / `admin.members.$userId.view.tsx` — read-only aggregate; keep as the "peek" flow.
- `useAuth()` — session + role flags (`isAdmin`, `isSuperAdmin`).
- Admin RLS on `profiles`, `venture_snapshots`, `venture_documents`, `attendee_*`, `venture_brand_kits`, `venture_social_assets`, `venture_content_ads`, `bulk_unlock_grants`, etc.

## Changes

### 1. New impersonation context — `src/hooks/use-impersonation.tsx`
- Stores `{ targetUserId, targetEmail, targetName }` in `sessionStorage` under `sl.impersonation` (session-only so a closed tab ends it).
- Exposes `useImpersonation()` → `{ isImpersonating, target, start(user), stop() }`.
- Guard: `start()` no-ops (and toasts) unless the caller is `isAdmin`. On mount, the provider validates the same rule against the current session and auto-clears if the user is no longer admin.
- Provider mounted in `src/App.tsx` inside `AuthProvider`.

### 2. Effective-user hook — `src/hooks/use-effective-user.ts`
- `useEffectiveUser()` returns `{ userId, isImpersonating, actorUserId }`:
  - `userId` = impersonation target if active and actor is admin, else `auth.user.id`.
  - `actorUserId` = always the real signed-in user's id (for audit / server-side checks).
- Every dashboard query/mutation that currently reads `user.id` (or filters by `auth.uid()`) is switched to `useEffectiveUser().userId`. Grep target set:
  - `src/routes/_authenticated/dashboard/**` (all pages) — `hub.index`, `hub.$snapshotId`, `hub.new`, `brief`, `deliverables`, `documents`, `files`, `media`, `workflow`, `workflow.$key`, `filing`, `goals`, `profile`, `index`, `day`.
  - `src/components/hub/**` and `src/components/brief/**` where they call `.eq("user_id", user.id)` or pass `user.id` into functions.
  - `src/lib/foundersHub.functions.ts`, `brief.functions.ts`, `brandKit.functions.ts`, `creative.functions.ts`, `content-autopilot.functions.ts`, `social-autopilot.functions.ts`, `founderMemory.functions.ts`, `stageIntake.functions.ts`, `filing.functions.ts`, `media.functions.ts`, `attendee.functions.ts`, `discovery.functions.ts`, `pipeline.functions.ts`, `userPipeline.functions.ts`, `deck-overrides.functions.ts`, `brand-intake.functions.ts` — each accepts an optional `overrideUserId` from callers; the client calls pass `useEffectiveUser().userId`. Server-side edge-function calls include `{ actAsUserId }` in the body — the function verifies the caller is admin via `is_admin(auth.uid())` before honoring it (see step 4).

### 3. Global impersonation banner — `src/components/admin/ImpersonationBanner.tsx`
- Sticky bar rendered at the top of `_authenticated.tsx` (inside `<Outlet />` wrapper) when `isImpersonating`.
- Shows: "Viewing as **{name}** ({email}) — actions you take will affect their account." + **Exit** button (calls `stop()` and navigates to `/admin/users`).
- Uses `bg-amber-500/15 text-amber-200 border-amber-400/40` (semantic tokens already in `styles.css`).

### 4. Edge-function guardrail
- Any edge function that today reads `user.id` from the JWT and writes founder data (`venture-*`, `brand-*`, `content-*`, `social-*`, `brief-*`, `founder-*`) accepts an optional `actAsUserId` in the payload:
  - If present, the function calls `has_role(auth.uid(), 'admin' | 'super_admin')` (via the DB `is_admin` function) and rejects with 403 if false; otherwise it substitutes `actAsUserId` for `user.id` on all writes.
  - This keeps impersonation server-authoritative — a non-admin can't forge the header even if they inspect the client.

### 5. Users & roles page — `src/routes/_authenticated/_admin/admin.users.tsx`
- Add two column actions per row (excluding self and other super_admins where role changes are disallowed — impersonation itself is allowed against any non-self user):
  - **Open dashboard** — primary button. Calls `impersonation.start({ userId, name, email })` then `navigate("/dashboard")`.
  - **Peek** (secondary link) — existing `admin/members/$userId/view` read-only aggregate.
- Extend `listUsersWithRoles()` in `src/lib/admin.functions.ts` to include `member_status` and `founders_hub_access` so the table can show a small badge before opening ("Approved" / "Pending" / etc.) — one extra column via the existing `profiles` join already in the function.
- Add a helper hint above the table: "Opening a dashboard signs you in as that user for this tab. Exit anytime from the amber banner."

### 6. Admin sidebar — `src/components/admin/AdminSidebar.tsx`
- If `isImpersonating`, add a compact "Impersonating {name} — Exit" row above the sign-out button so admins can bail from anywhere in the admin surface too.

### 7. Auth guard — `src/routes/_authenticated.tsx`
- When impersonating, skip the `memberStatus === "paused"` redirect for the actor (admin retains navigation) but still route dashboard pages through the effective user. If the **target** is paused, show a small inline note in the banner ("Target member is paused") — don't redirect the admin out.

## Technical details

**Why not JWT swap?** Supabase doesn't support delegated tokens on the client. Every founder table already has `is_admin(auth.uid())` policies (that's how the read-only member view works today), so an admin's own JWT is sufficient to read/write another user's rows as long as the client filters by `target_user_id`. The edge-function guardrail in step 4 closes the write path: the function verifies admin role from the caller's JWT before honoring `actAsUserId`.

**Refactor pattern:**
```ts
// before
const { user } = useAuth();
const { data } = useQuery(["snapshots", user.id], () => listSnapshots(user.id));

// after
const { userId } = useEffectiveUser();
const { data } = useQuery(["snapshots", userId], () => listSnapshots(userId));
```
Query keys include `userId` so switching impersonation targets invalidates cached data automatically — no manual `qc.clear()` needed.

**Session storage, not localStorage.** Ends on tab close. Prevents an admin from forgetting they're impersonating across days.

**Audit log (optional, low cost).** Add `public.admin_impersonation_log(id, actor_user_id, target_user_id, started_at, ended_at)` + `start_impersonation(_target)` / `end_impersonation()` SQL functions (SECURITY DEFINER, admin-guarded). The client calls `start_impersonation` on `start()` and `end_impersonation` on `stop()`/unload. Included so admin activity on other users' accounts is traceable.

## Out of scope
- No changes to founder-facing UI copy or layouts — admins see the exact same dashboard.
- No new roles or role model changes.
- No changes to super_admin promotion rules; `admin_set_user_role` stays as-is.
- Real-time / presence changes (analytics unaffected).

## Acceptance
- From `/admin/users`, clicking **Open dashboard** on any non-self user lands the admin on `/dashboard` seeing that user's ventures, brief, files, playbook, and studios.
- Creating/editing anything (e.g., generating a Content Studio ad) writes to the **target** user's rows, not the admin's.
- A sticky amber banner is visible on every dashboard route; **Exit** returns the admin to `/admin/users` and restores their own data.
- Refreshing the tab preserves impersonation; closing the tab ends it.
- A non-admin who somehow calls `impersonation.start` sees no effect (client guard) and any spoofed `actAsUserId` in an edge-function call is rejected with 403 (server guard).
- `admin_impersonation_log` shows one row per session with start/end timestamps.
