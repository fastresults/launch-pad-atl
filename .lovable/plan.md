Remove the Hero section from `/services` and promote the Tracks section to hero styling so it becomes the page opener.

**`src/routes/services.tsx`:**

1. Remove `<Hero />` from the page composition and delete the `Hero` function entirely.
2. Restyle `Tracks` to serve as the hero:
   - Section: swap `border-t border-white/5 bg-white/[0.02] py-16 md:py-24` → `border-b border-white/5 py-16 md:py-24` (matches old Hero framing, no muted band).
   - Add the eyebrow chip above the heading: rounded pill with `<Sparkles />` + copy `Done-for-you · Three tracks, built by our team` (replaces the current "Bundles that map to where you are" small-caps label).
   - Promote the heading from `h2` to `h1` and bump to `text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.05]`. Keep current copy ("Three tracks. Pick the one that matches the stage you're in.") with the gradient span on the second clause.
   - Keep the current intro paragraph as-is (it already reads as hero subcopy).
   - Add the two hero CTAs above the track grid: primary "Book a discovery call" → `/contact?intent=discovery` (hero-gradient pill), secondary "Start with a workshop — from $197" → `/build` (outline pill).
   - Add the proof line below CTAs: `Work shipped for Citigroup · Mayo Clinic · 3M · Disney · government, Main Street, and online brands alike` (small-caps, muted).
   - Track cards grid: unchanged.
3. Imports: `Sparkles` and `ArrowRight` stay (both already imported). No new imports.

Nothing else on the page changes.
