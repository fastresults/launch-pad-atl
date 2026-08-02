## Goal

On the home page, the top hero band becomes a blank, quiet cream band. All of its current content (masthead line, kicker, headline, deck, pull quote, "Designed for" list, coffee cup, and price/CTA card) moves — unchanged in wording — into a new section immediately below it.

## Changes

**File: `src/components/home/HomeFramework.tsx`**

1. Rename the existing `Hero()` content into a new component `HeroCopy()` — same 8/4 editorial grid, same left column (kicker, H1, deck, pull quote, "Accelerators work on your pitch…" line, "Designed for" list) and same right column (steam SVG + coffee cup + price card, "Reserve your seat", "See the other two ways", private-session line). The masthead rule ("Issue No. 01 — The Pivot / Pull up a chair") moves down with it and sits at the top of this section.
2. Replace `Hero()` with an empty band: the same cream surface, radial gradient, and bottom hairline border, at a fixed responsive height (roughly 240px mobile / 320px desktop), containing no text, no image, no CTA. Marked `aria-hidden` since it carries no content.
3. Update the page composition order:

```text
SiteHeader
Hero            (blank band)
HeroCopy        (all moved content)
VideoTestimonials
Framework
...unchanged
```

## Notes

- The `<h1>` stays with the moved copy, so the page keeps exactly one H1 and SEO/heading structure is unaffected.
- Copy is moved verbatim — no rewriting, no removals.
- Only this file changes; no other pages, no backend, no landing-page variant.
