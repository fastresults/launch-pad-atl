## Impersonation audit — what I confirmed by reading the code

Impersonation today is **client-side only**: `sessionStorage["sl.impersonation.v1"]` holds the target, `use-auth.tsx` swaps `user.id` for React reads, and `getEffectiveUserId()` (src/lib/effective-user.ts) is the intended path for data fetchers. The Supabase session always stays the admin's, so RLS lets admins read/write anything — which means a missed swap fails *silently with the admin's own data* instead of erroring.

Breaks found:

1. **Server side has no notion of impersonation.** `supabase/functions/_shared/auth.ts:requireUser()` returns the JWT user id — the admin. Any edge function invoked without an explicit target id writes to the admin's workspace. Only a couple of functions (`brain-reindex`, `attendee-generate-assessment`, `attendee-deliverable-image`, `dashboard-pipeline-run`) were retrofitted with a target-id parameter; roughly two dozen others (`venture-generate-document`, `venture-bulk-generate`, `brand-intake`, `brief-summarize-block`, `brief-prefill`, `brain-chat`, `brain-material-ingest`, `venture-brand-wizard`, `venture-deep-research`, `venture-source-extract`, social/content autopilot, style preview, operating agreement, …) still infer the owner from the JWT. This is the biggest source of "worked for one thing, silently wrong for another."

2. **Client fetchers still read `auth.getUser()` directly** instead of `getEffectiveUserId()` — confirmed in `src/lib/member-intake.functions.ts`, `src/lib/testimonials.functions.ts`, `src/lib/deck-overrides.functions.ts`, `src/components/brief/FounderBlock.tsx`, `src/routes/_authenticated/dashboard/brief.tsx`, `src/routes/_authenticated/dashboard/deliverables.tsx`, `src/routes/_authenticated/dashboard/hub.new.tsx`. Each is a display/write leak against the admin's own row.

3. **Gating and profile state are the actor's, not the target's.** `getMyAccount()` reads roles/`member_status`/`founders_hub_access` for the signed-in admin, so `FoundersHubGate` and `_authenticated.tsx` evaluate admin state while the dashboard renders founder data. You can never see what the member actually sees (locked hub, paused, pending), and "it worked for me" hides real member breakage.

4. **No consistent cache identity.** React Query keys mostly don't include the effective user id; `queryClient.clear()` on start/stop is the only guard. Any refetch triggered mid-transition, or a second tab, can hydrate mixed data.

5. **Session/tab fragility.** `sessionStorage` is per-tab; a link that opens a new tab drops impersonation without warning. Token refresh and `onAuthStateChange` re-fire `invalidateQueries()` while impersonation stays set, which is the "not stable all the way through" symptom.

6. **Audit trail is best-effort.** `start_impersonation` / `end_impersonation` failures are swallowed with `console.warn`, and stop only logs if a `logId` survived. Sessions never expire.

## Plan

**Phase 1 — Single source of truth (client)**
- Make `getEffectiveUserId()` the only way client code resolves "whose data is this". Add an ESLint rule (or a lint script) banning `supabase.auth.getUser()` outside `effective-user.ts`, `auth.functions.ts`, and admin-actor call sites.
- Convert the seven confirmed direct-`getUser()` sites above.
- Add the effective user id to every React Query key used by dashboard/hub/brief/brain/media fetchers so cached data can never cross accounts.

**Phase 2 — Make the server impersonation-aware (the real fix)**
- Add `resolveTargetUser(req, cors)` to `supabase/functions/_shared/auth.ts`: validate the JWT, read an optional `x-impersonate-user` header (or `targetUserId` body field), and only honor it when the caller has `admin`/`super_admin` in `user_roles`; otherwise 403. Returns `{ actorId, userId }`.
- Sweep every edge function that currently uses `requireUser()` for ownership and switch it to `resolveTargetUser`, writing `actorId` into audit columns (`triggered_by`, `created_by_actor`) and `userId` into ownership columns.
- Attach the impersonation header centrally on the client so individual call sites can't forget it (a small `invokeEdge()` wrapper in `src/lib` that all `functions.invoke` calls route through).

**Phase 3 — Truthful gating while impersonating**
- Extend `getMyAccount()` to fetch the *target's* `member_status` / `founders_hub_access` when impersonating, keeping the actor's roles for admin authorization. Gates (`FoundersHubGate`, `_authenticated.tsx`) then reflect what the member sees, with an admin override toggle in the banner ("view their gate" vs "bypass").

**Phase 4 — Stability and safety rails**
- Persist impersonation with an expiry (e.g. 60 min idle) and re-validate admin role on resume; expire cleanly with a toast instead of silently reverting.
- Keep it tab-scoped but detect new tabs and show "impersonation not active in this tab" rather than quietly serving admin data.
- Make banner always visible on every authenticated route (currently only rendered by `_authenticated.tsx`; admin console routes should show it too).
- Harden `start_impersonation` / `end_impersonation`: fail the impersonation if the audit insert fails, auto-close stale sessions, and surface an admin log view.

**Phase 5 — Verification**
- Playwright run as super admin: impersonate a founder, walk brief → brain → workflow → deliverables → media, and assert after each write that the persisted row's `user_id` is the founder's and `triggered_by` is the admin's (checked directly in the DB, not by UI text).
- Negative test: a non-admin sending the impersonation header gets 403.

### Technical notes
- No schema changes required except possibly `expires_at` on `admin_impersonation_log`.
- Phase 2 touches ~25 edge functions and requires redeploying each — that's the bulk of the work, and it's where the current instability actually lives.
