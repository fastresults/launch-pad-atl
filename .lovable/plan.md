## Goal

Refine the `BringYourCard` body copy into a single, tight paragraph that adds the pre-workshop email promise without repeating what the first paragraph already covers.

## Scope

- File: `src/components/home/HomeSelection.tsx`
- Lines: ~210–220 (body text only)
- `INCIDENTALS_CAP` stays at 225; chips, styling, and layout unchanged

## Proposed copy (single paragraph)

> Your seat, the build, the brand, the materials, lunch — the workshop is entirely on us. The only costs you'll see are the ordinary startup setup expenses every founder pays: your domain (~$12), email and hosting, a state filing fee, maybe one AI tool. These go straight from you to those vendors — not a cent comes to us. If you're one of the six, we'll email you ahead of time with exactly what we recommend, why, and how it fits your startup, so you can handle everything beforehand at your own pace. Budget around $225, set it all up in your name on your card, and walk in ready to build.

## Why this works

- One paragraph, no redundancy. Every sentence advances the message.
- Sentence 1: what's free. Sentence 2: what costs are. Sentence 3: not payment to us. Sentence 4: pre-workshop email with what/why/how + flexibility. Sentence 5: budget + ownership + readiness.
- "walk in ready to build" implies no derailment without saying "we won't derail you."
- Friendly, calm, founder-respecting tone throughout.

## Files touched

- `src/components/home/HomeSelection.tsx` — body text only