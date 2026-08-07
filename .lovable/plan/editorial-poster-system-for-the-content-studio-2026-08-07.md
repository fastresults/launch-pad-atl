# Editorial Poster System for the Content Studio

Goal: content-studio posts should look like the reference samples — full-bleed cinematic photography, a quiet gold kicker, a confident serif display headline, and one clear call to action. Today's ads use a heavy opaque top band with Arial and no kicker/CTA layer, so even good imagery reads like a coupon.

## What changes (visible)

1. **Poster layout replaces the top band.** Type moves to the lower third over a soft bottom-up gradient scrim instead of a solid rectangle covering 20-45% of the frame. The photo stays the hero.
2. **A three-part type lockup**, matching the samples:
   - Kicker: small, letterspaced, all-caps, brand accent color, with a short rule above it (e.g. "STARTUP LABS · ATLANTA").
   - Headline: serif display, tight leading, 2-4 lines, real brand typeface.
   - CTA line: one light sans line under the headline (the post's CTA, which today is deliberately excluded from the canvas).
3. **Real fonts.** Serif display (Lora/Playfair-class) plus a sans for kicker/CTA, embedded into the render instead of `Arial, Helvetica`.
4. **Alternate poster layouts** so a week of posts doesn't look identical: `bottom-scrim` (default, matches samples), `centered-plate` (like the third reference card — headline centered on a darkened field), and `edge-rule` (left-aligned with a vertical accent rule). Chosen per post from a stable hash, overridable in the UI.
5. **Photography direction upgrade.** Ad prompts get a cinematic-editorial layer: golden-hour or single-source lighting, real depth, negative space reserved in the lower third for type, no flat vector illustration, no collage, no text glyphs.
6. **Copy quality.** The headline is currently the raw calendar hook (up to 180-220 chars, which forces tiny 4-line type). Add a poster-copy pass that produces a tight display headline (≤ 60 chars), a kicker, and a CTA from the post — so type can be big and the message lands.
7. **UI controls** in the Content Studio: layout picker, kicker text, CTA on/off, and the existing headline override — all per-asset, with regenerate.

## Technical detail

- `_shared/content-ad-svg.ts` — rewrite the compositor: gradient scrim (`linearGradient` from surface at 92% opacity to transparent), lockup builder (kicker + rule + headline + CTA) with per-block fitting, three layout variants, embedded fonts as base64 `@font-face` in an SVG `<defs><style>`. Keep the existing no-truncation fitter, but re-tier sizes for a serif at ≤ 60 chars.
- Font bytes: reuse the CDN-TTF fetch pattern from `_shared/headline-compositor.ts` (Inter for sans, add a serif TTF), cached per cold start; fall back to generic `serif`/`sans-serif` families if the fetch fails.
- New `_shared/poster-copy.ts` — one small Lovable AI call (`google/gemini-3.6-flash`, JSON output) turning `{hook, body, cta, pillar, brand voice}` into `{kicker, headline, cta_line}`. Cached on the ad row so regenerating the image doesn't re-bill; skipped when the founder supplies a custom headline.
- `_shared/content-ad-director.ts` — pass the poster layout + reserved type zone into the prompt; add the cinematic photography block; keep the existing prop-ban and on-topic rules from `cover-art-director.ts`.
- `venture-content-ad/index.ts` — thread `layout`, `kicker`, `ctaMode` through generate/regenerate; persist them on `venture_content_ads` (new nullable columns `poster_layout`, `kicker`, `cta_line`, `display_headline`) so re-renders are deterministic.
- `_shared/logo-compositor.ts` usage in ads — keep the recently fixed vector-ink logo (no chip); on posters the mark sits opposite the type block.
- Client: `SocialAutopilot` / content-ad card gets the layout + kicker + CTA controls and shows the resolved display headline.

## Order of work

1. Compositor rewrite + fonts + three layouts (biggest visual jump, no AI cost).
2. Poster-copy pass and DB columns.
3. Prompt/photography direction upgrade.
4. UI controls and regenerate wiring.

Existing generated ads stay valid; they render with the default layout until regenerated.
