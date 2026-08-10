# The showcase hero is still drawing the light-background mark

## What the screenshot shows

The masthead mark (top-left) is fine — it goes through the contrast-aware picker. The huge navy-on-navy mark inside the "At a glance" card does not: it is nearly invisible against the dark card.

## Why — two confirmed causes

**1. The reader's hero images bypass the contrast logic.**
In `venture-share`, the "At a glance", "Executive summary" and "Brand identity" cards all set `heroImageUrl: logoUrl` — the raw `/brand-logo/{id}` address, which always serves the primary (light-background) artwork. Only the masthead uses the `auto?on=dark|light` addresses.

**2. The founder's uploaded reversed mark is invisible to the picker.**
This venture has three uploaded logos in its brand kit:

| entry | variant | file |
| --- | --- | --- |
| 1 | `primary` | tap-logo-light.svg |
| 2 | `reversed` | tap-logo-dark.svg |
| 3 | `icon` | tap-symbol.svg |

They are **sibling entries in the `logos` array**. The `auto` endpoint only ever loads the entry flagged `primary` and then looks inside `primary.variants.knockout / .mono / …` — generated slots this venture doesn't have. So the reversed file the founder uploaded is never even considered, and `auto?on=dark` falls back to recolouring the light mark (and, because this SVG carries `<style>`/gradient paint the tinter treats as untintable, it can survive full-colour).

## The fix

### 1. The picker looks at the whole logo set, not one entry

`brand-logo` builds an ordered candidate list from **both** sources:

- sibling array entries, keyed on their `variant` field (`reversed`, `mono`, `knockout`, `icon`, `primary`)
- the generated `variants.*` slots on each entry

Order for a dark surface: `reversed` → `knockout` → `mono` → primary/mark → `horizontal`/`stacked` → `icon`.
Order for a light surface: primary/mark → `horizontal`/`stacked` → `icon` → `mono` → `reversed`/`knockout`.

Each candidate is still measured (`svgInkHex` / `rasterInkHex`) and must clear the 3.0 contrast bar before it is served, so the ordering is a preference, never a blind trust.

### 2. Ink measurement stops being fooled by wrappers

`svgInkHex` currently reads only `fill=`/`stroke=` paints. It will also read paints declared in `<style>` CSS blocks and `stop-color` inside gradients, and ignore paints belonging to a full-bleed background rect (a shape covering the whole viewBox is the *ground*, not the ink). That is what makes a "dark version" file measure as light ink instead of averaging into mud.

### 3. Every hero on the reader uses the surface-aware address

`venture-share` returns hero logos as the `auto?on=dark` / `auto?on=light` pair rather than the bare `logoUrl`, and the reader picks by the live theme with the existing `useSurfaceLogo` hook — the same way the masthead already does. Applies to "At a glance", "Executive summary", "Brand identity", and the PDF/DOCX covers (which are white, so they take the light address).

### 4. Existing links fix themselves

No migration and no regeneration: the decision happens per request from the brand-kit rows that already exist, so this link is correct on the next load. The endpoint's cache header stays at 5 minutes so the change lands quickly.

## Technical notes

- Files touched: `supabase/functions/_shared/logo-ink.ts` (candidate collection + smarter ink measurement), `supabase/functions/brand-logo/index.ts` (iterate the full candidate list), `supabase/functions/venture-share/index.ts` (hero logo pair), `src/components/share/ShareSection.tsx` and `src/routes/v.$token.tsx` (render the theme-matched hero), `src/lib/share-export.ts` (light address on export covers).
- Unit tests next to `color-spaces.test.ts` cover: reversed sibling chosen on dark, primary chosen on light, `<style>`-declared ink measured, background rect excluded.
- No schema change.
