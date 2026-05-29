## Why you didn't see a dashboard

After Google sign-in, `src/routes/login.tsx` (and `signup.tsx`) redirects non-admin users to `/` — the marketing landing page. The site header has a "sign out" button but no link into `/dashboard`, so once signed in there is nothing pointing you at the attendee portal. The dashboard route exists and works (`/dashboard` → brief / filing / workflow tabs we just wired) — it's just unreachable from the public site.

## Fix

1. **Redirect signed-in users to the dashboard.**
   - `src/routes/login.tsx`: change the post-auth navigation from `(isAdmin ? "/admin" : "/")` to `(isAdmin ? "/admin" : "/dashboard")`. Still honor an explicit `redirect` search param when present.
   - `src/routes/signup.tsx`: same change.

2. **Surface the dashboard from the public site header.**
   `src/components/site/Header.tsx`, both desktop and mobile right-side blocks: when `isAuthenticated`, render a "Dashboard" link to `/dashboard` next to the "sign out" button (and in the mobile sheet, above sign out). Unauthenticated users still see "sign in".

## Out of scope

- No changes to `_authenticated` guard, auth state, or admin routing.
- No change to the `/register` CTA — that stays the primary public action.
- Reset-password flow is unchanged.
