## Goal

Landing page should reflect the 3-free-seat offer and never link out to full-site routes (which are hidden while landing-only mode is on).

## Changes — `src/components/landing/LandingFramework.tsx`

1. **Seat count fixes**
   - Line 294: `Just 20 seats` → `Just 3 seats · free`
   - Line 388 (HonestRoadmap included list): `A seat next to Adam and 19 other founders…` → `A seat next to Adam and 2 other founders — coffee, snacks, and a small room building alongside you`

2. **Remove full-site CTAs**
   - **Build-layer cards (lines ~457–491):** The 4 cards currently link to `/build/:slug`. Convert them from `<Link>` to plain `<div>` cards, remove the "Learn more →" affordance and hover-link styling. Keep the visual card + copy so the "8 more mornings" story still lands.
   - **Build-layer CTA row (lines ~501–514):** Remove the entire two-button row ("See all 8 mornings" → `/build`, "Or have us build it for you" → `/services`).
   - **`ServicesTeaser` section (lines 569–593) + its render at line 74:** Delete the section and its usage. The landing shouldn't pitch the services page while it's hidden.
   - **`BottomCTA` (lines 648–682):** Remove the secondary `<Link to="/services">See our services</Link>` button, keeping only the "Reserve your interest" primary button.

3. **`LandingAccessModeDialog.tsx`** — not rendered by the landing (confirmed via grep), so no change needed. Leave file untouched.

## Out of scope

- No copy changes beyond the two seat-count strings above.
- No changes to `HomeFramework` / full-site pages.
- No layout redesign — just removing/neutralizing the offending CTAs and section.
