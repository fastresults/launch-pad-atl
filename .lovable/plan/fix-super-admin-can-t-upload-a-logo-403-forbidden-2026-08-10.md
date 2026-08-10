# Fix: Super Admin can't upload a logo (403 Forbidden)

## What the logs show

The failing call is `venture-brand-assets` returning `403 {"error":"Forbidden"}`.

Confirmed from the code and data:

- The venture on screen (`a430693d…`, "The Athletes Prayer Foundation") is owned by user `7aea53b7…`.
- The signed-in actor is the super admin (`67d1c583…`).
- `venture-brand-assets` rejects any request where `snapshot.user_id !== resolved user`. It only resolves to another user when the browser sends the `x-impersonate-user` header, i.e. when an explicit "view as" session is active.
- The admin is browsing the venture directly from the hub, without an impersonation session, so the ownership check fails and returns 403 before the upload runs. Recent function logs show impersonation lines only on calls made from an active peek session — the failing one has none.

## The fix

1. In `venture-brand-assets`, when the resolved user is not the snapshot owner, check whether the *actor* holds `admin`/`super_admin` (the existing `isAdminUser` helper in `_shared/impersonation.ts`, evaluated with the service client). If yes, act on the snapshot owner's behalf: set `userId = snap.user_id` so uploads and media rows land in the member's workspace, and log the admin override for audit. If not, keep the 403.
2. Apply the same admin override to `venture-logo-studio`, which has the identical ownership gate and would 403 on the very next step (refine/vectorize) after a successful upload.

## Secondary cleanup (same file, same turn)

A previous bulk edit corrupted the string `logo_upload_own` to `"n"` in three places:

- `supabase/functions/venture-brand-assets/index.ts` (the kind list and the `if (kind === "n")` branch)
- `src/components/hub/brand/LogoSetPanel.tsx`
- `src/components/hub/brand-wizard/BrandWizard.tsx`

It still works because both sides agree on the same wrong token, but it's unreadable and collides with any future single-letter kind. Restore `logo_upload_own` in all four spots together so client and server stay in sync.

## Verification

- Sign-in state can't be faked here, so verification is: re-run the upload from the hub as the admin and confirm a 200 plus the new logo tile, then check `venture-brand-assets` logs for the admin-override line and no 403.
