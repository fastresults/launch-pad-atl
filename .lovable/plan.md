# Fix: share link shows "Link unavailable — Load failed"

## What's actually wrong (verified against the live site)

The published build calls the backend at:

```text
https://undefined.supabase.co/functions/v1/venture-share
```

I downloaded the live JavaScript from startuplabs.online and confirmed the literal string `https://undefined.supabase.co/functions/v1` is in it. That host doesn't exist, so the browser's request fails at the network level — the page catches it and renders "Link unavailable / Load failed".

Cause: the share code builds the URL from an environment variable (`VITE_SUPABASE_PROJECT_ID`) that is not injected into production builds. It works in the editor preview, which is why the page looked fine there.

The backend itself is healthy — I called the endpoint directly and it responded correctly, signed out, with no login required.

## The fix

In `src/lib/venture-share.functions.ts`, stop deriving the functions base URL from the project-id variable. Build it from `VITE_SUPABASE_URL` (which is injected in production) with a hard-coded fallback to the known project URL, so the value can never resolve to `undefined`:

```ts
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://hflfxytqrlkobhuugsca.supabase.co";
const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`;
```

This is the only place in `src/` that used that variable.

Additionally, so a broken backend call never again looks like a missing/expired link, the error branch in `src/routes/v.$token.tsx` will distinguish a network failure ("Couldn't reach the server — check your connection and try again", with a Retry button) from a genuine revoked/expired link.

## Verification before handing back

1. Build the app and grep the output bundle to confirm no `undefined.supabase.co` string remains.
2. Load a real share token in a headless browser against the local build and confirm the showcase renders with its sidebar and assets.
3. Then publish, and re-check the deployed bundle for the corrected URL.
