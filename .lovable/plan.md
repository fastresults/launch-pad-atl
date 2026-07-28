## Goal

A visitor should know this is an in-person Atlanta workshop within the first screen — no scrolling.

## Changes (all in `src/components/landing/LandingFramework.tsx`, hero area only)

1. **Masthead line (top of page, line ~98-105)**
   - Right-side italic "Pull up a chair" becomes a location + date stamp: `Atlanta, Georgia · Thursday, August 20, 2026`.
   - Keeps the magazine masthead look, puts the city in the very first line of text on the page.

2. **Hero kicker (line ~111-114)**
   - From: `One focused morning · IGNITE Center · Coffee's on us`
   - To: `In person in Atlanta · One focused morning · Coffee's on us`
   - Swap the star icon for a map-pin so it reads as a place, not a badge.

3. **Headline sub-deck (line ~123-129)**
   - Add the venue plainly in the supporting paragraph: "One quiet morning in Atlanta — at the IGNITE Center at Greater Atlanta Christian School in Norcross…" so the actual room is named above the fold instead of only in the map section far below.

4. **Offer card (line ~226-258)**
   - Add a single map-pin line under the "3 seats. Zero cost." block: `In person · Norcross, GA (metro Atlanta)` so the location sits right next to the CTA button people click.

5. **Designed-for list (line ~146-151)**
   - Localize the first item slightly: "Atlanta-area Plan-B seekers ready to stop guessing" — one mention only, no repetition.

6. **Page title / meta** (`src/routes/landing.tsx`)
   - Title and description get "Atlanta" up front for search and social previews.

## Guardrails

- No layout restructuring, no new sections, no new components.
- Location mentioned deliberately, not repeated in every paragraph — masthead, kicker, deck, offer card, meta strip.
- Free-offer framing, August 20 date, apply-by date, and all existing sections stay untouched.
- Homepage (`HomeFramework.tsx`) is not touched — landing fork only.
