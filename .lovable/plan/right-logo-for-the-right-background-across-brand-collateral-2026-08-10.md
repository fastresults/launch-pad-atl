# Right logo for the right background across brand collateral

The presentation master and brand guidelines covers are dark navy, but they are drawing the light-background full-colour mark. Collateral only ever loads **one** logo (the primary vector) and tries to recolour it on the fly; when the artwork can't be recoloured (embedded raster, gradients, CSS-class fills), the light version survives on the dark ground — exactly what the screenshot shows.

## The rule to enforce

Every piece decides its mark by the surface it lands on:

| Surface | Mark used |
| --- | --- |
| Light paper | Primary / full-colour artwork |
| Dark ground (brand primary, ink, deck cover, guidelines cover, closing slide) | Reversed artwork |
| Reversed artwork missing | Primary artwork knocked out to a single legible ink |
| Artwork that cannot be recoloured and no reversed slot | Mark sits on a small light plate rather than disappearing |

## What changes

**1. Collateral loads the logo set, not one logo.**
`venture-collateral` resolves two pieces of artwork instead of one:
- Light: today's primary vector (unchanged).
- Dark: first match of — uploaded logo with `variant: "reversed"`, then the generated `variants.knockout`, then `variants.mono`.

Both go into `CollateralCtx` (`logoSvg` / `logoSvgDark`, plus the isolated symbol for each). Nothing else about loading changes, so ventures with only a primary mark behave exactly as before — they just get the knockout path below.

**2. The mark drawer picks by background, not by the caller's guess.**
`markAt` in `collateral-svg.ts` already receives the surface colour. It will now:
- Compute the surface luminance and select dark artwork when the ground is dark and dark artwork exists.
- When it isn't available, force the single-ink knockout (today this only happens if the caller passed an ink, which the deck cover and guidelines logo grid do not always do).
- Recolour reliably: fills declared in `style="fill:…"`, in `<style>` CSS blocks and `currentColor` are rewritten too, not just `fill="…"` attributes.
- Detect genuinely untintable artwork (embedded `<image>`, gradient-only fills). In that case, if no reversed artwork exists, draw a subtle light plate behind the mark so it stays visible instead of vanishing into the navy.
- A reversed slot uploaded as PNG/JPG/WebP is embedded as an image rather than skipped.

**3. Templates stop hand-picking.**
The deck cover, the closing slide, the guidelines cover and the guidelines logo grid pass the surface and let the drawer choose. The guidelines "Logo" page then genuinely shows Primary (light panel, full colour) versus Knockout (dark panel, reversed artwork) — right now both panels can render the same file.

**4. QC records it.**
Each drawn mark records which artwork it used and the surface it landed on; `collateral-qc` flags any mark drawn full-colour on a dark ground so a bad set is caught before it reaches the founder.

## Technical notes

- Files touched: `supabase/functions/venture-collateral/index.ts`, `supabase/functions/_shared/collateral-svg.ts`, `supabase/functions/_shared/collateral-qc.ts`.
- No schema change — `venture_brand_kits.logos` already carries the `variant` field and generated `variants.knockout` / `variants.mono` paths.
- Existing collateral is unaffected until regenerated; regenerating the presentation master and brand guidelines will pick up the correct marks.
