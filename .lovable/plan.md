
# Zernio Social Media Integration (Admin)

Add a "Social" section to the admin dashboard that uses the Zernio API to connect social accounts, publish/schedule posts, and view analytics — all gated to admin/super_admin.

## Architecture

```text
Admin UI (React)  ──►  Supabase Edge Function: `zernio` (proxy)  ──►  https://zernio.com/api/v1
                                  │
                                  └─ uses ZERNIO_API_KEY secret (server-side only)
```

The API key never touches the browser. The edge function:
- Verifies caller has `admin` or `super_admin` role (via JWT + `has_role`).
- Forwards whitelisted operations to Zernio.
- Returns JSON to the admin UI with CORS headers.

## Setup

1. Add `ZERNIO_API_KEY` via the secrets tool (user-provided, from Zernio Settings → API Keys).
2. Create one edge function `supabase/functions/zernio/index.ts` that routes by `{ action, params }` body:
   - `profiles.list` / `profiles.create` / `profiles.delete`
   - `accounts.list` / `accounts.disconnect`
   - `connect.getUrl` (returns OAuth URL for a platform + profileId)
   - `posts.list` / `posts.create` / `posts.delete`
   - `analytics.get` (per account, with date range)
3. Log a row to a new `zernio_audit` table on each mutation (who/what/when) — optional but useful for super-admin oversight.

## Database

One small migration:
- `zernio_audit (id, user_id, action, payload jsonb, response_status int, created_at)` — RLS: admins can read, service_role writes. GRANTs included.

No need to mirror Zernio's data locally; we read live from the API and cache via TanStack Query.

## Admin UI

New routes under `src/routes/_authenticated/_admin/`:
- `admin.social.tsx` — overview: list profiles, connected accounts per profile, quick "New post" button.
- `admin.social.accounts.tsx` — connect/disconnect accounts. "Connect" opens Zernio's hosted OAuth URL in a new tab; on return, we refetch accounts list.
- `admin.social.compose.tsx` — composer: textarea, media upload (phase 2), platform/account multi-select, schedule vs. publish-now vs. draft.
- `admin.social.posts.tsx` — list scheduled/published/draft posts with status, delete.
- `admin.social.analytics.tsx` — pick account + date range, render summary cards + simple charts (recharts) for impressions/engagement/followers as returned by Zernio.

Add a "Social" group to `src/lib/admin-nav.ts` with these entries (super-admin only by default; we can open to admin later).

Data layer in `src/lib/zernio.functions.ts` — thin wrappers that call the `zernio` edge function via `supabase.functions.invoke`.

## Scope & assumptions

- Admin-only feature; not exposed to founders/attendees.
- Phase 1: profiles, accounts, text posts, basic analytics. Media uploads + queue/recurring slots are phase 2.
- OAuth callbacks are handled by Zernio's hosted flow — no callback route needed in our app.

## Open questions

1. Should this be **super-admin only**, or available to all admins?
2. Single shared Zernio workspace (one API key for all admins), or per-admin keys? (Recommend single shared — simpler, matches your request.)
3. Include the `zernio_audit` log table, or skip it for v1?
4. Do you want media uploads (images/videos) in v1, or text-only first?
