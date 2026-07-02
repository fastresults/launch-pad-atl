# Fix: Headline overlay missing on Content Studio ads

## Root cause
`supabase/functions/_shared/headline-compositor.ts` fetches Inter Bold from `cdn.jsdelivr.net/gh/rsms/inter@v4.0/docs/font-files/Inter-Bold.otf` at runtime. That URL is 404-ing (or blocked) in the edge runtime. Edge logs on every recent generation:

```
WARNING headline-compositor: no font, skipping
```

When the font load fails, `compositeHeadline` short-circuits and returns the original bytes unchanged — so the AI model (which we instructed to leave the top band empty) produces a blank band and nothing paints over it. That's exactly the "no headline anywhere" you're seeing.

## Fix

1. **Ship the font with the function instead of fetching it.**
   - Add `supabase/functions/_shared/fonts/Inter-Bold.ttf` (checked into the repo, ~300 KB).
   - In `headline-compositor.ts`, replace the `fetch(FONT_URL)` path with `Deno.readFile(new URL("./fonts/Inter-Bold.ttf", import.meta.url))`. Keep the cached-promise pattern so it's read once per isolate.
   - Keep a network fallback to a second CDN (Google Fonts `fonts.gstatic.com` Inter-Bold ttf) only if the local read fails, so future refactors don't silently regress.

2. **Make the failure loud, not silent.**
   - If the font still can't load, paint a solid brand-surface band across the headline area and stamp the truncated headline using imagescript's built-in bitmap font as a last-resort readable fallback, so an ad never ships text-less.
   - Bump the QA telemetry: set `qa.headline_composited = "font_missing"` (instead of `false`) when we hit the fallback, so this shows up clearly in logs.

3. **Redeploy `venture-content-ad`** so the packaged font ships with the function.

4. **Verify**: regenerate one failing frame, confirm the top band renders the headline in Inter Bold, and confirm edge logs show no `no font` warning.

## Files touched
- `supabase/functions/_shared/fonts/Inter-Bold.ttf` (new, binary)
- `supabase/functions/_shared/headline-compositor.ts` (font loader + fallback)
- Redeploy `venture-content-ad` (and `venture-social-cover` if it imports the same compositor).

No client-side changes; no prompt changes.
