## Convert testimonial slider to edge-to-edge marquee

### What changes
Replace the centered single-video player in `src/components/home/VideoTestimonials.tsx` with a full-bleed, continuously scrolling marquee of 9:16 portrait video cards.

### Behavior
- **Edge-to-edge**: section breaks out of the page container; row spans the full viewport width with no horizontal padding on the strip itself.
- **Continuous auto-scroll**: cards translate right-to-left at a steady speed (admin-configurable; default 40px/sec). When the first set scrolls off-screen, it loops seamlessly by duplicating the list (standard CSS marquee trick).
- **Hover pauses** the entire row (animation-play-state: paused).
- **All videos play simultaneously**, muted, looped, `playsInline`, `autoPlay`. This is the natural fit for a marquee — every visible card is alive.
- **Per-card hover**: unmute button + pause button overlay on the hovered card.
- **`prefers-reduced-motion`**: marquee freezes, becomes a normal horizontal scroll the user drags.
- **Mobile**: same marquee, slightly smaller cards (~280px wide × 500px tall). Hidden entirely if `show_on_mobile` is off.

### Card design (9:16 portrait, ~420px tall on desktop)
- Width ~236px, height 420px, rounded-2xl, subtle ring.
- Video fills the card (`object-cover`).
- Bottom gradient overlay with founder name, role · startup, and the quote (clamped to 2 lines).
- Small "play" icon top-right when muted.

### Settings adjustments (admin page)
- Drop the now-irrelevant `autoplay`, `start_muted`, `loop`, `pause_seconds` fields from the active form (keep them in DB for compatibility, just hide).
- Add: **Scroll speed (px/sec)** — default 40, range 10–200.
- Add: **Direction** — left ↔ right (default left).
- Keep: enabled, heading, subheading, show_on_mobile.

### Files
- `src/components/home/VideoTestimonials.tsx` — rewrite as marquee.
- `src/routes/_authenticated/_admin/admin.testimonials.tsx` — swap settings UI.
- `src/lib/testimonials.functions.ts` — extend `TestimonialSliderSettings` with `scroll_speed_px_s` and `direction`, with defaults.
- Section is mounted inside `<HomeFramework />` at full width by using `w-screen relative left-1/2 -ml-[50vw]` wrapper for the strip; the heading stays in the centered max-w container above it.

### Why the data already loaded but you didn't see it
The current component renders centered with a max-width — it *is* on the page, just not full-bleed and not a scroller. The rebuild fixes both at once.
