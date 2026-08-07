# Fix: Social Studio covers ignore the locked brand kit

## What actually happened

The Social Studio does read your locked Brand Kit — but three things broke between the kit and the pixels. I verified all three against your venture's saved data.

### 1. Your logo never reached the image model (biggest one)

The logo saved from Logo Studio is an **SVG** (`mark-...svg`). The cover generator explicitly refuses SVGs: every asset on this venture recorded `logo_skipped: "svg_unsupported"` and `logo_composited: false`. So no cover or avatar has your mark on it — the model was drawing blind, with no visual reference to your brand at all. That's why the Instagram avatar is a black rectangle.

### 2. The brand color was silently replaced with a neon teal

Your palette is "Earthy Professional": deep slate green `#2F4F4F`, sage `#8FBC8F`, gold `#B8860B`, warm neutral surface.

The generator picks a "signature" color, then runs it through a booster that rewrites any color it judges too dark or too muted into a punchy mid-tone. `#2F4F4F` got rewritten to **`#2DD2D2`** — an electric teal that exists nowhere in your kit. That single substitution is why the LinkedIn cover is a neon-teal cityscape. The saved canvas plan on every asset confirms it.

### 3. Type and subject matter were unanchored

Typography is passed to the prompt only as a name ("Lora", "Inter") with no rendered sample, so text on the Facebook cover came back in an unrelated font — and rendered a stray line of copy ("scale elderly care across Georgia") that wasn't a requested headline. The photographic direction also had no subject grounding from your venture, which is how a passport-and-travel-desk photo ended up representing an elderly care business.

## The fix

**A. Make the logo usable everywhere**
- Rasterize the saved SVG mark to a high-resolution transparent PNG at the moment it's saved to the live brand, and store that PNG alongside the SVG on the brand kit.
- The cover generator prefers the PNG; if only an SVG exists on an older venture, rasterize on demand rather than skipping.
- If a logo still can't be resolved, fail the generation with a clear message instead of quietly shipping a logo-less asset.

**B. Stop the color substitution**
- Restrict the signature booster so it can only lift *lightness* enough to stay visible, never change hue or blow out saturation — and cap how far it may move from the kit hex.
- If a brand color is genuinely too dark to carry a large area, pick a different **kit** color for that role (sage, gold) instead of inventing one.
- Show the exact palette in the UI before generating, so an off-palette swatch is caught before spending a generation.

**C. Anchor type and subject to the kit**
- Include the actual heading/body font names *and* a rendered type sample in the reference tile handed to the model, so letterforms match Lora/Inter.
- Default headline mode to "none" for covers unless the founder explicitly enters one, killing stray copy.
- Feed venture subject matter (what the business is, who it serves) into photographic/illustrative directions so imagery is on-topic.

**D. Regenerate**
- Once fixed, clear the current off-brand Instagram / LinkedIn / Facebook assets and regenerate the set, then verify the logo composited and the observed colors match the kit.

## Technical notes

- `supabase/functions/_shared/canvas-plan.ts` — `deriveDisplaySignature()` is the source of the `#2F4F4F → #2DD2D2` jump; constrain it and add a hue-drift guard. `pickSignature()` gains a "prefer another kit role over inventing a hue" pass.
- `supabase/functions/venture-social-cover/index.ts` — `fetchPrimaryLogo()` returns `svg_unsupported`; add SVG rasterization (via `resvg`/`@resvg/resvg-wasm` in Deno) and treat a missing logo as a hard error for covers.
- Logo Studio save path (`venture-logo-studio` + `append_brand_logo`) — persist a `png_path` next to the SVG so downstream consumers (social covers, content ads, deck, PRD) all get a raster.
- `supabase/functions/_shared/cover-art-director.ts` — headline default flips to suppressed; add venture-subject block to photographic/illustrative direction text.
- `supabase/functions/_shared/palette-tile.ts` — add rendered type specimen rows to the reference tile.
- Same palette/logo path also feeds `venture-content-ad` and `venture-style-preview`, so the fixes carry to Content Studio ads too.
