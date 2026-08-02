## Goal

Match the attached reference: a centered hero with one short question, a large glassy prompt card, an in-card caption and CTA button, and a scene label underneath.

## What changes on the home hero

**1. Headline**

Replace the two-line left-aligned H1 ("Whatever you want to start, we build the foundation with you.") with a single centered line:

> **What would you like to start?**

Centered, large (roughly 3rem mobile → 4.5rem desktop), Outfit semibold, tight tracking — same weight/scale relationship as the reference.

**2. Remove the current supporting copy from the hero**

- The long sub-paragraph ("One focused morning. Your brand, your offer…") comes out — the reference has no subhead; the card carries the message.
- The small caption under the box ("Type your own, or watch a few…") comes out; it is replaced by the in-card caption.
- The Atlanta / IGNITE kicker stays but moves to centered above the headline, at the same faint uppercase treatment (it is credibility copy we agreed to keep subtle). If you'd rather match the reference exactly with nothing above the headline, say so and I'll drop it.

**3. Prompt card — bigger, glassier, centered**

Rework `IdeaPrompt` into a tall card instead of a single-row bar:

```text
┌──────────────────────────────────────────────────────────┐
│  I want to open a med spa|                               │
│                                                          │
│                                                          │
│  We build it. You own it.        [ Start For Free  → ]   │
└──────────────────────────────────────────────────────────┘
```

- Width: centered, max ~1100px (wider than today's 2xl), full-bleed to page gutters on mobile.
- Height: ~230–250px desktop / ~180px mobile, achieved with a top input row that grows and a bottom row pinned to the base.
- Corners: `rounded-3xl`; padding ~28–32px.
- Input row: same auto-typing ghost text + caret behavior as now, but at a larger type size (~1.375rem) so it reads like the reference.
- Bottom-left caption: **We build it. You own it.** (faint white).
- Bottom-right: pill button **Start For Free →** — translucent glass pill with a light border, not the current small blue square arrow button. Submits the same way (navigates to `/register?idea=…`), and remains usable even when the field is empty (falls back to the typed ghost idea).

**4. Scene label under the card**

Replace the row of progress dots with the centered label the reference shows:

> NOW BUILDING: **MED SPA**

Uppercase, wide tracking, faint white with the scene name in the electric-blue accent. Scene labels already exist in the scene data, so this just reads the active scene and switches with the cross-fade.

## Technical details

- `src/components/home/CinematicHero.tsx` — center the content column, swap the H1 copy, drop the subhead, render the new scene label row instead of `hero-dot`s, and keep the existing scene cross-fade / drift / scrim / grain layers untouched.
- `src/components/home/IdeaPrompt.tsx` — restructure to a two-row card (input row + footer row), enlarge the ghost/input type scale, replace the icon button with a labelled pill CTA, and move the caption inside the card.
- `src/styles.css` (hero block, lines ~692–839) — increase `.hero-glass` blur/inner-highlight for the larger surface, add `.hero-cta` pill styling, bump `.hero-input` / `.hero-ghost` font size, and add `.hero-nowbuilding` label styling. `.hero-dot` rules get removed with the dots.
- No copy, layout, or token changes outside the hero; all other public pages keep the cinematic system as-is.

## Verification

Screenshot the home route at desktop and mobile widths and confirm: centered headline, card size and glass read matching the reference, caption and CTA aligned to the card's bottom corners, ghost text still typing and cycling, and the scene label swapping with each scene.
