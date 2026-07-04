## Diagnosis

You are currently impersonating Stachio Williams as an admin (the impersonation session is active in the DB log). The "StartupLabs" venture showing up under Stachio's account is not actually attached to Stachio — it's **your own** venture leaking through the impersonation view. Confirmed in the database: the only `venture_snapshots` row named "StartupLabs" belongs to your admin user, not to Stachio.

### Root cause

Impersonation is only implemented in the `AuthContext` (it swaps `user.id` for downstream React reads). But the data-fetching functions bypass the context entirely and call `supabase.auth.getUser()` directly to get the id they filter by:

```ts
// src/lib/foundersHub.functions.ts
async function uid() {
  const u = (await supabase.auth.getUser()).data.user;
  return u.id;                       // <-- always the real actor (admin), never the impersonation target
}

export async function listSnapshots() {
  return supabase.from("venture_snapshots").select("*").eq("user_id", await uid());
}
```

Because RLS lets admins read any row (`is_admin(auth.uid())`), the query succeeds and returns **your** ventures while the surrounding UI thinks it's showing Stachio's. Same pattern exists in most `*.functions.ts` files (brief, filing, stageIntake, member-intake, brandKit, brand-intake, legal-setup, discovery, media, creative, venture-sources, canonical-context, founderMemory).

This is a display bug, not a data-integrity bug — no snapshot has actually been reassigned. When you stop impersonating, Stachio's real (empty) data will show. But it also means every admin-impersonation session today is showing the admin's data, not the target's.

## Plan

1. **Add one shared helper** in a new file `src/lib/effective-user.ts`:
   - `getEffectiveUserId()` — reads `sessionStorage["sl.impersonation.v1"]` (same key `use-auth.tsx` uses), verifies the actor is admin via `user_roles`, and returns the target id when impersonating, else the actor's `auth.uid`. Safe fallback to actor id on any error.
   - Non-async cached admin check within a single tick to avoid an extra round-trip per call.

2. **Swap every client-side `uid()` filter** to use the helper. Concrete files touched (grep-verified):
   - `src/lib/foundersHub.functions.ts` (listSnapshots + all `.eq("user_id", …)` sites and storage path prefixes)
   - `src/lib/brief.functions.ts`
   - `src/lib/filing.functions.ts`
   - `src/lib/stageIntake.functions.ts`
   - `src/lib/member-intake.functions.ts`
   - `src/lib/brandKit.functions.ts`
   - `src/lib/brand-intake.functions.ts`
   - `src/lib/legal-setup.functions.ts`
   - `src/lib/discovery.functions.ts`
   - `src/lib/media.functions.ts`
   - `src/lib/creative.functions.ts`
   - `src/lib/venture-sources.ts`
   - `src/lib/canonical-context.ts` (all six parallel queries in `getCanonicalFounderContext`)
   - `src/lib/founderMemory.functions.ts`
   - `src/lib/social-setup.functions.ts` and `src/lib/social-autopilot.functions.ts` (`getUserId` helper — same fix)

3. **Storage paths.** A few functions build storage keys like `${uid}/${snapshotId}/…`. Route those through the same helper so uploads during impersonation land in the target's folder (or, for safety, block uploads while impersonating — see Q1 below).

4. **Verify.** With impersonation active on Stachio, `/dashboard/hub` should show Stachio's ventures (currently none) instead of StartupLabs. Stop impersonation → your own hub returns to normal. Also spot-check `/dashboard/brief` and `/dashboard/legal-setup` render Stachio's blank state.

## Questions before I build

1. **While impersonating, should admins be able to write/mutate the target's data** (create ventures, edit brief, upload files), or only read? Read-only impersonation is safer and closes a whole class of "admin accidentally saved to member's account" bugs; the DB log already assumes write is possible.
2. Anything I should NOT swap over — e.g. admin-only routes under `_admin/` that are supposed to always use the actor id?
