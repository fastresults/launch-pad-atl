# Add 10 modern online business scenes to the hero rotation

Extend the homepage hero's random image rotation with ten of the strongest online/digital business concepts for 2026, matched to the existing cinematic photographic style (warm directional light, real founder in a real workspace, shallow depth of field, moody dark grade).

## The ten concepts

1. AI automation agency — building workflow bots for local businesses
2. AI-assisted content studio — short-form video for brands
3. Newsletter / paid community operator
4. Digital products & templates shop (Notion, spreadsheets, courses)
5. Print-on-demand and merch brand
6. Amazon / Walmart online reseller (retail arbitrage & wholesale)
7. Virtual assistant / remote ops agency
8. Online coaching & cohort courses
9. Local lead-gen websites (rank-and-rent for trades)
10. Subscription box / DTC niche brand

Each gets a first-person phrase ("I want to start an AI automation agency"), a short label for the "Now building" line, and alt text — same shape as the existing scenes.

## What changes

- Generate 10 new 1536x1024 photographic scene images into `src/assets/scenes/`, matching the current look (no text, no logos, real person at work, cinematic warm/dark grade).
- Add 10 entries to `founderScenes` in `src/lib/founder-scenes.ts` with imports, `id`, `phrase`, `label`, `image`, `alt`.

No changes to rotation logic — `shuffleScenesForVisit`, Ken Burns drift, and crossfade timing already handle any list length, so the new scenes join the random order automatically. Total goes from 41 to 51 scenes.

## Notes

- Images are lazy-loaded after the first scene, so the added weight does not affect initial load.
- If any generated image comes back poor quality, it gets regenerated before shipping.
