
## Goal

Give super admins a switch that, when ON, hides the entire website behind a single dedicated landing page. Everyone (visitors and signed-in members alike) sees only the landing page. Super admins bypass the lock so they can keep editing, and `/login` + `/reset-password` stay reachable so the toggle can always be turned back off.

## How it works

1. New setting `landing_only_mode` (boolean, default `false`) stored in `site_settings`.
2. On every page load, the app reads the setting via the existing `getPublicSiteSettings()` fetcher (already cached with React Query).
3. A new `<LandingOnlyGate>` wrapper around the router:
   - If `landing_only_mode = false` → render the site normally.
   - If `landing_only_mode = true` AND the visitor is not a super admin → force the standalone landing page for any non-allowlisted route; allowlist is `/login`, `/reset-password`, and static assets.
   - If super admin → render the full site normally, with a persistent banner reminding them "Landing-only mode is ON — visitors see the standalone page."

## Landing page

- Duplicate the current homepage into a new standalone route/component so it can be trimmed independently without touching `HomeFramework`.
- New file: `src/routes/landing.tsx` rendering `<StandaloneLanding />`.
- New component: `src/components/landing/StandaloneLanding.tsx` — starts as a copy of `HomeFramework` so nothing visually changes on day one; future edits happen only here.
- The standalone page uses a minimal header (logo only, no nav, no CTA to `/register`) and a minimal footer (privacy/terms/contact-mailto only, no site links) so it truly stands alone.

## Routing behavior

- Path resolution when `landing_only_mode` is ON and viewer is not super admin:
  - `/login`, `/reset-password` → render normally (so admin can sign in and toggle off).
  - Anything else, including `/`, `/build`, `/register`, `/dashboard/*`, `/admin/*` → render `<StandaloneLanding />` at the current URL (no redirect, so shared links still "work" and show the landing page).
- Super admins see the site exactly as today. The `AuthenticatedLayout` gate is unchanged; the landing-only gate wraps *outside* it and short-circuits first for non-super-admins.

## Admin control

- New "Site mode" section in `src/routes/_authenticated/_admin/admin.settings.tsx`, visible to super admins only:
  - Toggle: **Landing-only mode** (writes `landing_only_mode` to `site_settings`).
  - Helper text explains what it does and warns that all visitors, including approved members, will only see the standalone landing page.
- Uses existing `updateSiteSetting()` — no new backend endpoint required.

## Files to add / change

- Add: `src/routes/landing.tsx`, `src/components/landing/StandaloneLanding.tsx`, `src/components/landing/StandaloneHeader.tsx`, `src/components/landing/StandaloneFooter.tsx`, `src/components/site/LandingOnlyGate.tsx`, `src/components/admin/LandingOnlyBanner.tsx`.
- Change: `src/App.tsx` (wrap router children with `LandingOnlyGate`), `src/lib/site-settings.functions.ts` (add `landing_only_mode` to `SiteSettings` with default `false`), `src/routes/_authenticated/_admin/admin.settings.tsx` (new toggle), `src/hooks/use-auth.tsx` if needed to expose `isSuperAdmin` (currently only `isAdmin`).

## Technical notes

- `isSuperAdmin` derivation: `roles.includes("super_admin")`. Add to `use-auth` alongside `isAdmin`.
- No DB migration required — `site_settings` is a key/value table already used for feature flags.
- Setting is public-readable (already is) so the gate works before auth resolves; the gate treats "not-yet-authenticated" as non-super-admin, which is safe.
- Preserves SPA routing: gate returns a component, never a redirect, so refreshing on `/build` while landing-only mode is on still shows the landing page without a 404.
