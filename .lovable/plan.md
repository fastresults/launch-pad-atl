## Goal

When `landing_only_mode` is ON, **everyone** sees the standalone free-launch landing page — including super admins. Today the gate has an `isSuperAdmin` bypass, which is why you're still seeing the old `$297` homepage.

## Change

Single file: `src/components/site/LandingOnlyGate.tsx`.

- Remove the `if (isSuperAdmin) return <>{children}</>;` bypass.
- Keep the `ALLOWED_PATHS` allowlist (`/login`, `/reset-password`) so you can always sign in / recover.
- Add `/admin/settings` (and the parent `/admin`) to the allowlist so super admins can still reach the toggle to turn landing-only mode back **off** without needing to sign out. Non-admins hitting those routes will still bounce off the existing `_authenticated/_admin` route guard, so this doesn't leak anything.
- Keep the orange "Landing-only mode is ON" super-admin banner where it is (it already renders above the gate), so you always know why the site looks stripped-down and where to toggle it.

## After this ships

- Visiting `/` (or anything else) with landing-only ON → the revised free-launch page for everyone, including you.
- To edit the rest of the site: go to **Admin → Settings**, flip landing-only **off**, and the full site returns.

## Files touched

- `src/components/site/LandingOnlyGate.tsx` — drop super-admin bypass, extend allowlist to admin settings.

## Verification

- With landing-only ON, load `/` as super admin → see "3 seats. Zero cost." hero, August 6 date, Reserve-your-interest modal wired to every CTA.
- `/admin/settings` still loads for super admins so the toggle is reachable.
- Flip landing-only OFF → full site returns for everyone.
