## What's actually wrong (verified, not guessed)

I reproduced your screenshot exactly. The Lovable desktop preview frame renders the page at roughly **1000 CSS pixels wide**, not 1512. I rendered the homepage at 1512px, 1280px, 1140px, 1024px and 1000px — the 1000px capture is pixel-for-pixel your screenshot (same collapsed nav: no "schedule", no "facilitator", CTA reading "Reserve — $297"; same oversized glass card).

Two things stack up at that width:

1. **Desktop composition is still gated behind Tailwind's `lg` (1024px)** in the places that matter most. The earlier fix moved a lot of layout from `lg` to `md`, but the header still hides `schedule`/`facilitator` at `hidden lg:inline-flex`, swaps to the short CTA at `lg:hidden`, and `HomeFramework` / `LandingFramework` / `services` / `build` still each carry ~16 `lg:`-only layout switches. At 1000px the page falls one pixel-class short of desktop and serves the tablet arrangement.

2. **The hero doesn't scale — it stretches.** `IdeaPrompt` uses a fixed `min-h-[240px]` card with `max-w-[1100px]`, and the H1 is capped at 48px. At 1000px the card is 952px wide but still 240px tall with the input pinned to the top and the CTA pinned to the bottom, so you get a huge empty glass slab — that's the "mobile UI blown up" feel. The H1 also stops growing, so the type/card proportion is wrong at every width above ~900px.

## The fix

**A. Move the desktop threshold down to `md` (768px) for public-site composition**
- `Header.tsx`: reveal `schedule` and `facilitator` at `md` instead of `lg`; switch the full CTA label at `md`; move the `lg:gap-7` rhythm to `md:gap-6 xl:gap-7`.
- `HomeFramework.tsx`, `LandingFramework.tsx`, `services.tsx`, `build.tsx`: audit each `lg:` grid/flex/spacing variant and re-key the ones that control *composition* (column counts, side-by-side vs stacked, section padding) to `md`, keeping `lg`/`xl` only for genuine wide-screen refinements. Leave dashboard/admin routes alone — they aren't part of this complaint.

**B. Make the hero fluid instead of fixed**
- `IdeaPrompt.tsx`: replace `min-h-[240px]` with a proportional height (`clamp`-based, roughly 200px → 260px) and center the input vertically inside the card rather than top-pinning it, so the card never reads as empty space.
- `CinematicHero.tsx` / `styles.css`: give the H1 a `clamp()` size so it grows continuously from ~2rem to ~4rem instead of stepping and stopping at 48px, and tie the card's max width to the same container as the headline so they stay visually locked.

**C. Verify across the real range**
Re-capture the homepage at 1000, 1140, 1280, 1512 and 1920 CSS px with Playwright and confirm all five read as one desktop design, with 1000px specifically matching the intended composition rather than the tablet fallback.

## Technical note

Tailwind's default `lg` is 1024px. Any preview or browser window narrower than that gets the tablet branch — so "desktop" must be defined as `md` (768px) for this site's public pages, with `lg`/`xl` reserved for extra breathing room, not for turning desktop on.
