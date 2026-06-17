# Auth review: what's broken and how to fix it

I traced the sign-in and role plumbing end-to-end. There are three independent bugs, and together they explain why Google sign-in "doesn't work" and why even the super admin doesn't land in the admin area.

## Bug 1 — `getMyAccount` queries a table that doesn't exist

`src/lib/auth.functions.ts` reads from `public.members`:

```ts
supabase.from("members").select("member_status, approved_via")...
```

There is no `members` table in the database. Member status actually lives on `public.profiles` (the `auto_approve_member_on_payment` trigger writes `profiles.member_status` / `profiles.approved_via`). The query throws, the `catch` in `useAuth` swallows it, and every signed-in user ends up with `roles: []` and `memberStatus: "pending"` — so:

- Super admin is not recognized as admin → never routed to `/admin`.
- Every approved member is bounced to `/welcome`.
- Sign-in looks like it "did nothing".

**Fix:** read from `profiles` instead:

```ts
supabase.from("profiles").select("member_status, approved_via").eq("user_id", user.id).maybeSingle()
```

## Bug 2 — Role enum mismatch

The DB `app_role` enum is `{super_admin, admin, user}` (confirmed via query) and `handle_new_user` inserts `'user'` for normal accounts. But the client type is:

```ts
export type AppRole = "admin" | "super_admin" | "member";
```

`"member"` doesn't exist in the DB, and `"user"` isn't in the TS union. Nothing downstream checks for `"user"`, so regular users have no usable role. `isApprovedMember` then depends entirely on `memberStatus === "approved"`, which is broken by Bug 1.

**Fix:** change `AppRole` to `"super_admin" | "admin" | "user"` and update the one check in `use-auth.tsx` accordingly. No behavior change for admins; regular users get a valid role string.

## Bug 3 — Google sign-in uses the legacy Supabase client, not Lovable managed OAuth

`src/routes/login.tsx` and `src/routes/signup.tsx` call `supabase.auth.signInWithOAuth({ provider: "google", ... })` directly. Per Lovable Cloud guidance, managed Google Auth must go through `lovable.auth.signInWithOAuth(...)` from `@/integrations/lovable`. That folder doesn't exist in this project, which is why the button silently fails / hits a misconfigured redirect in preview.

**Fix:** run the `configure_social_auth` tool with `providers: ["google"]` to scaffold `src/integrations/lovable/` and install `@lovable.dev/cloud-auth-js`. Then replace the two call sites:

```ts
import { lovable } from "@/integrations/lovable";

const result = await lovable.auth.signInWithOAuth("google", {
  redirect_uri: window.location.origin + "/login", // or /signup
});
if (result.error) { toast.error(result.error.message); return; }
if (result.redirected) return;
```

Keep email/password as-is. Do not touch `src/integrations/supabase/client.ts` or anything under `src/integrations/lovable/`.

## What I will NOT change

- DB schema, RLS, or triggers — they're already correct.
- The `_authenticated` and `_admin` layout routing logic — it works once `getMyAccount` returns real data.
- Email/password flow.

## Files to edit

1. `src/lib/auth.functions.ts` — point at `profiles`, remove `@ts-nocheck` if trivial.
2. `src/hooks/use-auth.tsx` — update `AppRole` import usage (no logic change beyond the type swap in `auth.functions.ts`).
3. Run `configure_social_auth` (scaffolds `src/integrations/lovable/*`, edits `package.json`).
4. `src/routes/login.tsx` — swap Google handler to `lovable.auth.signInWithOAuth`.
5. `src/routes/signup.tsx` — same swap.

## How to verify after build

- Sign in as super admin with email/password → should land on `/admin`.
- Sign in as an approved member → should land on `/dashboard`, not `/welcome`.
- Click "Continue with Google" on `/login` → redirect to Google consent screen, return signed in.
- New Google account that isn't an approved member → lands on `/welcome` (intake form), which is correct.

Approve this and I'll implement in one pass.
