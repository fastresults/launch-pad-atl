# Share links must never point at Lovable

## The problem

The share URL is built from `window.location.origin`. When a founder copies the link from inside the editor preview, that origin is the Lovable preview domain, which requires a Lovable account to open. Anyone who receives the link gets a Lovable login wall instead of the venture showcase.

## The fix

1. **Always mint public URLs.** Share links resolve to a fixed public origin (`https://startuplabs.online`) instead of the current browser origin. If the app is running on a `lovable.app` or `localhost` host, the public origin is used anyway; on the real domain nothing changes.
2. **Guarantee `/v/<token>` stays public.** Add `/v` to the always-allowed paths so landing-only mode (and any future gate) can never swallow a shared showcase, and confirm the route sits outside the authenticated layout.
3. **No Lovable references on the page.** Verify the showcase page and its head metadata carry only the venture's own branding — no Lovable badge, no editor chrome, no auth redirect. If a Lovable badge is being injected by hosting, note that it is turned off in project settings (badge visibility), not in code.
4. **Copy/preview buttons use the same public URL** in the share bar and share dialog, so what the founder copies is exactly what a stranger can open.

## Technical notes

- Add a `publicOrigin()` helper (site constant, single source of truth) used by `shareUrl()` in `src/lib/venture-share.functions.ts`; the preview button opens that URL too.
- `ALLOWED_PREFIXES` in `src/components/site/LandingOnlyGate.tsx` gains `/v`.
- No backend changes: the `venture-share` edge function is already public (`verify_jwt = false`) and serves signed image URLs, so a signed-out visitor loads everything.

## Note

While the app is only reachable via preview, a copied link will point at the published domain — correct for sharing, but it only renders once the latest frontend has been published.
