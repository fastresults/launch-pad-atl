## Why the overlay is missing

Edge function logs on the last generation:

- `local font read failed NotFound: .../functions/_shared/fonts/Inter-Bold.ttf`
- `no fit found for headline`

The bundled-font approach in `_shared/headline-compositor.ts` relies on `Deno.readFile(new URL("./fonts/Inter-Bold.ttf", import.meta.url))`. Supabase edge deploys only ship files that are **statically imported as modules** — the raw `.ttf` sitting next to the `.ts` is not uploaded, so the read 404s at runtime. The two CDN fallbacks return `.woff` / `.woff2`, which `imagescript` cannot parse, so they silently fail too. With no font loaded, the compositor returns the original image untouched and the top band renders blank.

## Fix

Bundle the font as data inside a TS module so it travels with the deploy.

1. **Encode the font once** (build-time, local): read `supabase/functions/_shared/fonts/Inter-Bold.ttf`, base64-encode, and write `supabase/functions/_shared/fonts/inter-bold.ts` that exports `export const INTER_BOLD_BASE64: string = "..."`. Because it's a `.ts` import, Supabase includes it in the bundle.

2. **Rewrite the font loader** in `supabase/functions/_shared/headline-compositor.ts`:
   - Import `INTER_BOLD_BASE64` from `./fonts/inter-bold.ts`.
   - Decode once into a `Uint8Array` and cache in module scope — no `Deno.readFile`, no CDN fetch on the hot path.
   - Keep a single TTF CDN fallback (raw GitHub `rsms/inter` `Inter-Bold.ttf`) only for the case where the base64 import itself somehow fails; drop the `.woff/.woff2` URLs since `imagescript` cannot use them.
   - Log the byte length on first load so future regressions are obvious in the logs.

3. **Redeploy** `venture-content-ad` and `venture-social-cover` (both import the shared compositor).

4. **Verify** by regenerating one ad and checking the logs:
   - Expect `[headline-compositor] font loaded (bytes=NNNNNN)` on cold start.
   - Expect no more `no font, skipping` or `no fit found` warnings on normal-length hooks.
   - Visually confirm the headline paints into the reserved top band on the preview.

## Files touched

- `supabase/functions/_shared/fonts/inter-bold.ts` (new — base64 payload)
- `supabase/functions/_shared/headline-compositor.ts` (loader rewrite)
- Redeploy: `venture-content-ad`, `venture-social-cover`

## Out of scope

- No prompt / director / logo-compositor changes. Typography fit logic, band sizing, and truncation rules stay as-is — they were already correct; they just never got a font to render with.
