# Alternate Main Street and online scenes in the hero rotation

Keep the existing per-visit randomization, but make the order alternate between a hands-on Main Street business and an online business — and grow the online pool with 25 hot 2026 concepts so the alternation holds nearly the whole way through.

## The counts

Today: 41 Main Street scenes, 10 online scenes. Adding 25 new online scenes brings it to **41 Main Street / 35 online = 76 total**, close enough to 1:1 that a true A/B/A/B cadence runs for 70 slots before the last few Main Street scenes tail out.

## 25 new online business scenes for 2026

1. AI agent builder for small teams
2. AI voice receptionist service for local trades
3. Faceless YouTube / automation channel
4. UGC creator studio for brands
5. Micro-SaaS founder (one narrow tool)
6. Prompt & AI workflow marketplace seller
7. AI headshot / product photo studio
8. Etsy digital downloads shop
9. Online bookkeeping for creators
10. Cold email lead-gen agency
11. Short-form video editing agency
12. Course-in-a-box / cohort platform operator
13. Paid Discord / Skool community operator
14. Shopify store buildout & CRO freelancer
15. Amazon FBA private label brand
16. Dropshipping brand with a real niche
17. Affiliate review site operator
18. Online tutoring & test prep service
19. Remote telehealth-adjacent admin service
20. AI resume & interview coaching platform
21. Podcast production agency
22. Newsletter ad sales / media brokerage
23. Web design subscription (productized service)
24. E-book & audiobook publishing brand
25. Online fitness coaching app operator

Each gets a first-person phrase ("I want to start an AI voice receptionist service"), a short "Now building" label, alt text, and a generated 1536x1024 cinematic photo in `src/assets/scenes/` matching the existing look (warm directional light, real person working, shallow depth of field, moody dark grade, no text or logos).

## What changes

1. Generate 25 new scene images into `src/assets/scenes/`.
2. Add the 25 entries to `founderScenes` in `src/lib/founder-scenes.ts` with imports.
3. Tag every scene with a `category: "main-street" | "online"` field (added to the `FounderScene` type).
4. Add an `interleaveByCategory` step inside `shuffleScenesForVisit`:
   - Shuffle each pool independently (existing Fisher-Yates).
   - Alternate Main Street → online → Main Street → online. When one pool empties, the remaining scenes from the other pool continue in shuffled order — with 41/35 that's just the final handful.
   - No scene repeats until all 76 have shown; the opening scene is still random and still avoids repeating last visit's opener via `sessionStorage`.

## Technical notes

- Only `src/lib/founder-scenes.ts` changes in code. `CinematicHero.tsx`, the Ken Burns drift, and the crossfade timing are length-agnostic.
- Images stay lazy-loaded after the first scene, so the added weight does not affect initial load.
- The interleave is deterministic given the two shuffled pools, so randomness still comes entirely from the per-visit shuffle.
