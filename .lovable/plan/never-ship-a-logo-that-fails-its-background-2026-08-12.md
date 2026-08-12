# Never ship a logo that fails its background

## What I verified for this venture

- The uploaded set is correct: a light primary (paints `#21c0ff`, `#373f4c`, `#383f4c`) and a reversed mark (`#21c0ff`, `#c1bfbf`, `#f7f7f7`).
- Asking the live logo endpoint right now for `dark` and for the brand teal `#005662` returns the reversed artwork, and every one of its paints clears 3:1 on both grounds. So the endpoint logic is currently right.
- The failure in the screenshot is therefore not the audit — it is what the tiles were showing at that moment. Two confirmed causes:
  1. **Stale cache.** The endpoint answers with `Cache-Control: public, max-age=300` and the preview URL never changes. The primary was saved at 22:42:40 and the reversed at 22:42:49; a request in that 9-second window pinned the "no reversed exists" answer — the dark navy mark — for five minutes on the *dark* and *brand* tiles. The screenshot is 22:43:17.
  2. **A second board that never audits at all.** `BrandIdentityHeader.tsx` renders all three tiles from the raw `logo.url` (the primary file), so its On dark / On brand tiles are black-on-dark by construction, regardless of what the endpoint would have returned.
- One quality defect also confirmed: on white, the repair rewrites the brand blue `#21c0ff` to flat `#111111`. Contrast is fixed, brand colour is destroyed.

## The rule to enforce

A mark is never drawn on a surface until that exact pairing has passed a per-paint audit, and the answer a surface asks for can never be older than the logo set it describes.

## Build

1. **Version the logo request so a stale answer is impossible**
   - Derive a short fingerprint from the kit's logo set (paths plus their timestamps) and append it to every `brand-logo/.../auto` request.
   - Serve versioned requests as immutable and unversioned ones as no-store, so a new upload changes the URL and the old answer can never be reused.
   - Invalidate the fingerprint on every upload/remove so all three tiles repaint together instead of one at a time.

2. **One audited preview component, no raw-URL boards**
   - Replace the three raw `logo?.url` tiles in `BrandIdentityHeader.tsx` with the same audited endpoint tiles `LogoSetPanel` uses.
   - Sweep for any other place a mark is drawn on a coloured ground from a stored URL and route it through the same path.

3. **Repair that keeps the brand colour**
   - When a paint fails, walk its own hue's lightness until it clears the floor, instead of collapsing it to black or white. `#21c0ff` on white becomes a deeper version of the same blue; only a hue with no legible lightness at all falls back to neutral ink.
   - Keep passing paints untouched, as today.

4. **Audit the brand surface, not just light and dark**
   - Audit and store verdicts for every surface the brand actually paints on: page background, primary, accent, ink. These are the grounds collateral, decks and the showcase use.
   - Show a small pass / repaired chip on each tile so the founder can see which surfaces are original artwork and which are auto-corrected.

5. **Gate the lock**
   - Locking the brand requires every surface to be pass-or-repaired. If a surface can only be saved by plating a raster, say so plainly and offer the reversed-upload slot as the fix.
   - At lock time, write the repaired variants out as real files per surface, so downstream generators read a guaranteed-legible file instead of re-repairing at draw time.

6. **Regression coverage**
   - Cached-answer test: upload primary, then reversed, and assert the dark answer switches immediately.
   - Hue-preserving repair test: `#21c0ff` on white stays blue and clears 3:1.
   - Brand-surface test: dark teal `#005662` never receives a paint below 3:1.
   - Header-board test: the identity header requests the audited endpoint, not the stored file.

## Technical scope

- `supabase/functions/brand-logo/index.ts` — versioned cache headers, per-surface verdict header.
- `supabase/functions/_shared/logo-ink.ts` — hue-preserving repair, surface-set audit.
- `src/components/hub/brand/LogoSetPanel.tsx` — fingerprint in URL, verdict chips.
- `src/components/hub/brand/BrandIdentityHeader.tsx` — audited tiles.
- Brand upload handler — recompute `contrast_audit` for the full surface set and bump the fingerprint.
- No schema change; `contrast_audit` already lives on each logo entry.
