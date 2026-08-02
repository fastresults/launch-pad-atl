## Problem

Both hero micro-labels — `ATLANTA · IGNITE CENTER…` and `NOW BUILDING: …` — use `--hero-fg-faint`, which is white at **44% opacity** with no shadow. Now that the scene photos are brightened and the scrim is lighter, 44% white over a mid-tone photo lands well under WCAG AA (roughly 2:1). The blue accent (`#4C8CFF`) on a dark-blue frame is similarly weak.

Wide letter-spacing (0.3em) at 11px makes it worse — thin, spaced glyphs need more contrast than body text, not less.

## Recommended fix (three layers, all in `src/styles.css`)

1. **Raise the label opacity**
   - `--hero-fg-faint`: 0.44 → **0.78** white. Keeps the labels visually secondary to the H1 (which is 100%) but pushes them past AA on the brightened scenes.

2. **Add a text shadow to detach text from photo**
   - Apply the same treatment already on the H1 to `.hero-kicker` and `.hero-nowbuilding`:
     `text-shadow: 0 1px 2px rgba(5,7,15,.75), 0 2px 18px rgba(5,7,15,.6)`
   - This is what makes wide-tracked type legible over unpredictable imagery — a photo-independent dark halo, no matter which of the 21 scenes is showing.

3. **Brighten the accent word**
   - `--hero-accent` stays `#4C8CFF` for buttons, but the inline accent used in "NOW BUILDING: **FOOD TRUCK**" gets a lighter tint (`#8FB6FF`) plus the same shadow, so the highlighted phrase reads brighter than the label rather than dimmer.

Optionally, bump the two labels' font-weight from 500 to 600 — a small stroke-weight increase buys real perceived contrast at that size.

## What I'm not doing

No re-darkening of the scrim or the photos — that would undo the brightness fix from the last pass. The correct place to solve label legibility is on the text itself, not by dimming the imagery again.

## Verification

Screenshot the hero across several rotation cycles (dark food-truck scene and bright trucking/daylight scenes) and confirm both labels stay readable at both extremes.
