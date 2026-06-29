## Why the current output looks generic

Two root causes in `venture-social-cover`:

1. **The logo is never seen by the model.** We pass the locked Brand Kit as *text* ("primary logo present, do not redraw") to `openai/gpt-image-2` via `/v1/images/generations`, which is text-to-image only. The model has no pixels of the actual mark, so avatars and covers can't reflect it.
2. **The director prompt is generic and the quality tier is `low`.** No reference imagery, no agency benchmarks, no per-asset typographic system, and avatars are treated the same as banners (they shouldn't be — an avatar IS the logo).

Result: covers feel like stock-AI, avatars are unrelated to the venture's mark.

---

## Fix: split avatars from covers, and make both multimodal

### A. Avatars are composed, not "generated"

For every avatar asset (Instagram, X, LinkedIn, etc.) we will **not** call an image model. Instead, in `venture-social-cover`:

1. Fetch the primary logo bytes from the Brand Kit (`kit.logos[].storage_path`, bucket `user-media`).
2. Composite on the server with `npm:@napi-rs/canvas` (Deno-compatible):
   - Square canvas at the platform's exact avatar spec (e.g. 400×400).
   - Background = locked palette `bg` role (or `primary` if bg is white and the logo is dark-on-light — pick the role with best contrast against the logo's dominant tone, measured from the image).
   - Logo centered, scaled to ~70% of canvas, transparent background preserved (PNG).
   - Subtle 1px inner stroke in `border`/`muted` role for crisp edge at small sizes.
3. Output PNG, upload to `user-media`, insert into `venture_social_assets` exactly as today.

This gives a **pixel-perfect, on-brand avatar** every time — which is what an agency would actually deliver.

### B. Covers/banners use multimodal image gen with the logo as a reference

Switch the generation path for non-avatar assets to **`google/gemini-3-pro-image`** via `/v1/images/generations` using the OpenRouter chat-completions image shape (per `ai-image-generation` docs). Gemini accepts an input image, so we feed:

- **The primary logo PNG** (so the model preserves the mark and composes around it instead of redrawing).
- **Up to 3 optional reference tiles** generated once: a swatch grid of locked palette hex colors, a type specimen of the heading family (rendered server-side with canvas), and the venture's hero/mood image if `media_assets` has one tagged `mood`/`hero`. These give the model concrete brand pixels, not adjectives.

Request body shape:
```json
{
  "model": "google/gemini-3-pro-image",
  "messages": [{ "role": "user", "content": [
    { "type": "text", "text": "<director prompt>" },
    { "type": "image_url", "image_url": { "url": "data:image/png;base64,<logo>" } },
    { "type": "image_url", "image_url": { "url": "data:image/png;base64,<palette tile>" } },
    { "type": "image_url", "image_url": { "url": "data:image/png;base64,<type specimen>" } }
  ]}],
  "modalities": ["image", "text"]
}
```

Stream is off here (server job — single PNG to storage), matching the existing flow.

### C. Rewrite the director prompt (`cover-art-director.ts`)

New structure — same function signature, sharper content:

1. **Role**: "You are <Pentagram/Collins/Mother NY>-tier art director shipping a launch-day asset."
2. **Reference imagery**: explicitly tell the model the attached images are the locked logo and brand pixels, to be honored exactly.
3. **Composition system per asset kind** (banner vs cover vs thumbnail), not just per direction. Banners get a 3-column grid spec with logo lockup zone, generous left margin, headline typography zone, and platform UI safe areas (16:9, 4:1, 3:1). Covers get a hero-frame spec. Thumbnails get a tight type-led spec.
4. **Direction briefs upgraded** with named references: Editorial → *Wallpaper, Apartamento, It's Nice That*; Geometric → *Bauhaus Dessau posters, Sagmeister*; Photographic → *Annie Leibovitz / Steve McCurry editorial portrait*; Illustrative → *Malika Favre, Christoph Niemann*.
5. **Banned list** expanded: no "tech mesh", no glowing orbs, no AI-generated text, no fake UI, no neon gradients, no isometric people, no centered headline-on-photo cliché.
6. **Output discipline**: WCAG AA contrast, real typographic hierarchy with the locked heading family, ≥60% negative space, max 2 palette roles + background, platform-safe insets defined per asset.

### D. Quality tier + variants

- Upgrade `quality: "low"` → omit (Gemini ignores it; default is full-quality). For OpenAI fallback, use `"medium"`.
- Cover generation returns **3 variants** per (platform, asset, direction) so the user picks the strongest — agencies present options, not a single take. The existing `is_selected` column already supports curation; Step 5 UI gets a "Pick one" interaction in a follow-up.

### E. Edge cases & fallbacks

- If no logo is uploaded: avatars fall back to a monogram composed from the venture initials in the heading family on the bg role (still on-brand). Covers proceed without the logo reference image but with palette + type specimen tiles.
- Logo is JPEG/SVG: convert to PNG server-side (`@napi-rs/canvas` decodes JPEG; for SVG, rasterize via `resvg-js`).
- Logo is too large to inline as data URL (>5MB): downscale to 1024px max edge before base64.
- Gemini 4xx/5xx: degrade to `openai/gpt-image-2` *text-only* with the existing prompt, but flag the asset row with `model_used` so we can see degradation rate.

### F. Minor UI follow-up (Step 5)

No layout change in this plan, but the existing thumbnail strip will now show the actual logo-aware output. Add a small "v1 / v2 / v3" pill row inside each cover card so the founder can switch between the 3 variants and tap one to mark `is_selected`. Avatars don't get variants (they're deterministic).

---

## Technical changes

**Edge function `venture-social-cover/index.ts`**
- Branch on `asset.kind === "avatar"` → composite path; else → Gemini multimodal path.
- Add `fetchLogoBytes(kit, admin)` helper that pulls the primary logo from storage and normalizes to PNG ≤1024px.
- Add `renderPaletteTile(kit)` and `renderTypeSpecimen(kit)` using `npm:@napi-rs/canvas`.
- Add `composeAvatar({ logoBytes, kit, asset })` — returns PNG bytes.
- Replace `callImageGateway` with `callGeminiMultimodal({ prompt, images, size })`; keep an `openai/gpt-image-2` fallback.
- Loop to produce N=3 variants when `asset.kind !== "avatar"`, insert each row with the same `(platform, asset_kind, art_direction)` and unique `id`.

**Shared `cover-art-director.ts`**
- Add per-asset-kind composition blocks (`AVATAR_NA`, `BANNER_SYSTEM`, `COVER_SYSTEM`, `THUMBNAIL_SYSTEM`).
- Add `REFERENCES` section instructing the model that attached image #1 is the canonical logo.
- Tighten direction briefs with named references and banned list.

**Client `SocialAutopilot.tsx` (Step 5) — minor**
- Treat avatars as single-variant (current UI works).
- For non-avatar tasks, render a small `v1 / v2 / v3` switcher inside each thumbnail card driven by `is_selected`. Calls existing `select` action on `venture-social-cover`.

**No DB migration required** — `venture_social_assets` already has `is_selected`, `art_direction`, `model_used`, and supports multiple rows per (platform, asset_kind).

---

## Acceptance check

For a snapshot with a locked Brand Kit and an uploaded logo:
1. Generating an Instagram avatar produces a PNG that visibly contains the uploaded logo on the brand bg color, sized to 400×400.
2. Generating an X header produces 3 PNG variants that visibly reference the logo placement, use only locked palette hexes, and look like agency work (no "tech mesh" / orb tropes).
3. Step 5 thumbnails show the real outputs; covers expose a v1/v2/v3 picker.
4. `model_used` column reads `google/gemini-3-pro-image` on covers and `composer:napi-rs-canvas` on avatars.
