# Hero scroll cue

Add a subtle, centered "scroll" indicator pinned to the bottom of the hero so visitors know there's more below the fold.

## Recommended approach

A small button (not a decorative div) absolutely positioned at the bottom-center of the hero:

- Chevron-down icon (lucide `ChevronDown`) inside a soft translucent circle, with a tiny uppercase "Scroll" label above it (optional, low opacity).
- Gentle 2s infinite bounce (translateY 0 → 8px → 0), easing in/out — subtle, not jumpy.
- Clicking it smooth-scrolls to the first section below the hero, so it's functional and not just visual.
- Fades out once the user scrolls past ~80px, so it never overlaps the content below.
- Respects `prefers-reduced-motion`: no bounce, still visible and clickable.
- Hidden on very short viewports / kept clear of the mobile CTA bar on small screens.

## Technical details

- `src/components/home/CinematicHero.tsx`: add a `<button class="sl-hero__scroll-cue" aria-label="Scroll to content">` as the last child of `.sl-hero`, with an `onClick` that scrolls the next section into view (`document.getElementById("hero-next")?.scrollIntoView({ behavior: "smooth" })`) and a scroll listener that toggles a `data-hidden` attribute after 80px.
- `src/components/home/HomeFramework.tsx`: give the section directly after the hero `id="hero-next"` as the scroll target (fallback: `window.scrollBy({ top: window.innerHeight * 0.9 })` if the id isn't found).
- `src/public.css`: new `.sl-hero__scroll-cue` rules (absolute, `bottom: 18px`, `left: 50%`, `translateX(-50%)`, z-index above scrim), `@keyframes sl-hero-cue-bounce`, opacity transition for the hidden state, reduced-motion override, and a mobile tweak raising it above the CTA bar.

No copy, layout, or business-logic changes elsewhere.
