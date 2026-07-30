## What I verified

- `brain_materials`, `founder_brain_memory` and the `attendee-docs` storage bucket all already allow an admin to read/write another founder's rows and files, so permissions are not blocking you.
- One material exists — the TAP PDF, uploaded 19:07 under the member's account (jmdbenz), status ready, 6 chunks. No material rows or ingest calls have been recorded since.
- There are **no ingest function calls in the logs** for your failed attempt, which means the failure happens in the browser *before* the file reaches the reader — and the current code can swallow that error, leaving no visible reason.

Two real gaps in the upload path explain a silent/stuck upload:

1. **The ingest kickoff error is discarded.** In `src/lib/brain-materials.functions.ts`, `startIngest(...).catch(() => {})` throws away failures (expired token, function error). The row is created and sits at "Queued" forever with no message.
2. **Impersonation state can be lost on re-login.** Impersonation lives in `sessionStorage`; after the sign-out you just hit, the Brain page may be acting as your admin account (which has a different venture), so the upload targets the wrong workspace or no snapshot at all.

## What I'll build

**1. Fail loudly instead of silently**
- `startIngest` failures now flip the material row to `failed` with the actual message and show it on the card, so nothing hangs at "Queued".
- Surface the raw storage / insert / invoke error text in the toast instead of a generic message.
- Auto-recover: any material stuck in a working state for more than 3 minutes shows a "Stalled — Retry" state rather than spinning.

**2. Make the ingest call robust**
- Send the material's owner id with the request and confirm the function returns 202 before the card leaves "Queued".
- Keep the existing admin bypass in `brain-material-ingest`, and add a clear 401 message when the caller's token has expired ("Your session expired — sign in again").

**3. Make impersonation obvious and sticky on the Brain page**
- Show a small banner on `/dashboard/brain` naming whose brain you're editing ("Viewing as jmdbenz@gmail.com") whenever impersonation is active.
- If impersonation was lost, the banner is absent — so you immediately see you're in your own workspace instead of guessing.

**4. Close the delete gap**
- Add owner+admin insert/delete access rules on the brain memory table so removing a material actually removes its chunks (today the cleanup silently does nothing and leaves orphan chunks in the brain).

**5. Verify, not assume**
- Drive the real page in a headless browser signed in as super admin with impersonation set to jmdbenz, upload a test file, and confirm: row created → reading → ready → chunk count > 0, with function logs to match. I'll report the observed states, and if it still fails I'll have the exact error rather than a blank.

## Technical notes

- Files: `src/lib/brain-materials.functions.ts`, `src/components/brain/BrainMaterials.tsx`, `src/routes/_authenticated/dashboard/brain.tsx`, `supabase/functions/brain-material-ingest/index.ts`.
- One migration: add `INSERT`/`DELETE` policies on `public.founder_brain_memory` for `auth.uid() = user_id OR is_admin(auth.uid())` (it currently has `SELECT` only).
- No change to the storage or `brain_materials` policies — those are already correct.
