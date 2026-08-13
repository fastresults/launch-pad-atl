# Raise the PRD contract: logo scale, parallax heroes, real typography art direction, top-tier imagery

Four things are missing or under-specified in the contract every Website PRD emits. Each becomes a hard, machine-checked rule so the builder can't ship a compromise.

## 1. Logo presence (header + footer)

Today the contract says the header lockup is "28–40px desktop" — that is exactly why it renders small, and the footer lockup has no rule at all.

Replace with a presence rule:
- Header: lockup height 44–56px desktop (56–72px when the header is transparent over a hero), 36–44px mobile, scrolled state may shrink at most 20%. Never below 36px desktop.
- Footer: the logo is a deliberate brand moment — 72–120px tall (or full-width wordmark up to 320px), sat on its own row above the link columns, not inline with legal text.
- Clear space stays at half the mark height; both lockups stay inside the Container; both use the `/auto?on=<hex>` endpoint on non-light surfaces.

## 2. Parallax on every hero and full-bleed band

Parallax exists in the depth addendum but nothing enforces it and heroes aren't called out. Promote it to the locked contract:
- Every hero with a background image runs a three-plane depth stack: background plate 0.25x scroll, midground subject 0.6x, foreground type 1.0x, driven by transform only.
- Every full-bleed image band on interior routes runs at minimum a two-plane version.
- The darkening is a CSS gradient scrim between plate and type — never baked into the render.
- Reserve `aspect-ratio`, use `will-change: transform` on the plate only, and collapse to a static composition under `prefers-reduced-motion`.
- Section 4 must name the parallax treatment per route; the master prompt repeats the technique verbatim.

## 3. A real typography contract (tone, weight, opacity, serif pairing)

Right now font direction is one line per archetype plus "use the kit fonts." Add a Typographic Contract block, applied to every PRD:
- **Pairing logic**: state explicitly which family is display and which is text, and why the pairing works (serif display / humanist sans text, or grotesk display / serif text). Never one family doing both jobs at all sizes.
- **Scale**: a named modular scale (1.250 or 1.333) with a display clamp, and stated tracking per tier — display negative (-0.02 to -0.03em), body 0, eyebrow +0.12–0.16em micro-caps.
- **Weight & tone**: at most three weights across the site; contrast comes from size and case, not from bolding everything. Body copy at 17–19px / 1.6–1.75 leading, 62–70 char measure.
- **Opacity as hierarchy**: a token ladder — primary text 100%, secondary 72%, tertiary/meta 56%, disabled 38%; over imagery, text is never below 90% and hierarchy comes from the scrim instead. No arbitrary opacity values.
- **Editorial devices**: at least two per site from drop cap, oversized pull quote, statistic set as display type, running section numerals, hanging punctuation.
- **Hygiene**: tabular numerals in tables and metrics, `font-display: swap`, preloaded display face, no faux bold/italic, optical sizing where the face supports it.

## 4. Highest-resolution, highest-tier imagery

Verified gap: `venture-generate-document` fires PRD header art without a `quality` flag, so it silently generates on the fast image model (`gemini-3.1-flash-image`) — only the manual Regenerate button can request Pro. Fix:
- PRD/document-triggered header art requests the Pro image model by default, at the largest supported aspect and resolution, with the existing legibility retry intact.
- Inside the PRD itself, the imagery table and master prompt name the model and resolution explicitly (Pro-tier image model, 2x-density source, hero plates rendered wide enough for full-bleed at 1920px) instead of the vague "highest-quality tier available".

## Enforcement

Add these to `craftVerdict` so a PRD that omits them is repaired before it ships:
`logo_scale`, `parallax_hero`, `type_contract`, `opacity_ladder`, `image_tier`. Failures route through the existing `repairWebsitePrdCraft` Pro pass, and the new items get lines on the Build Acceptance Checklist.

## Technical notes

- `supabase/functions/_shared/layout-contract.ts` — rewrite rule 9 (logo), add rules for parallax, typography and image tier; extend the acceptance checklist.
- `supabase/functions/_shared/website-prd.ts` — extend `buildDepthAddendum` with the typographic contract and logo/parallax specifics, add the five new checks to `craftVerdict`, surface them in `prdQualityMetrics`.
- `supabase/functions/venture-generate-document/index.ts` — pass `quality: "hq"` on the header-art call.
- `supabase/functions/venture-document-image/index.ts` — default to the Pro image model for PRD document types; keep flash only for low-value thumbnails.
- Tests extended in `website-prd-craft.test.ts`; both edge functions redeployed.
