# Alternate Main Street and online scenes in the hero rotation

Keep the existing per-visit randomization, but make the order alternate between a hands-on Main Street business and an online business.

## The constraint

The scene list has 41 Main Street scenes (coffee shop, roofing, trucking, lawn care, etc.) and 10 online scenes (AI automation agency, content studio, newsletter, digital products, print-on-demand, online reseller, virtual assistant, online coaching, lead gen, subscription box). A strict A/B/A/B pattern only survives 20 slots before the online pool runs out.

Recommended rule: **alternate strictly while online scenes remain, then spread the remaining Main Street scenes out.** Better still — and what this plan implements — is *even interleaving*: the 10 online scenes are dropped into evenly spaced positions across the full shuffled 51-scene run, so the viewer sees Main Street → online → Main Street → online at a steady cadence for the whole loop instead of alternating hard for 20 scenes and then never seeing an online scene again.

Since the rotation loops, the visible experience is: a physical business, then an online one, roughly every other-to-every-fourth slot, all the way through, with a fresh random order each visit.

## What changes

1. Tag each scene in `src/lib/founder-scenes.ts` with a `category: "main-street" | "online"` field (add to the `FounderScene` type; the 10 online entries at the end get `"online"`, the other 41 get `"main-street"`).
2. Add an `interleaveByCategory` step used inside `shuffleScenesForVisit`:
   - Shuffle each pool independently (existing Fisher-Yates).
   - Walk the combined length, placing an online scene whenever the ratio says it's that pool's turn, otherwise a Main Street scene. With 41/10 this yields an online scene about every 5th slot at worst and adjacent-alternating early — no two online scenes ever land back to back, and no scene repeats until all 51 have shown.
   - Preserve the existing "don't open on the same scene as last visit" rule via `sessionStorage`.

If you'd prefer the strict A/B/A/B version instead (online scene every second slot until the 10 run out, then Main Street for the rest), that's a one-line change to the placement rule — say the word.

## Technical notes

- Only `src/lib/founder-scenes.ts` changes. `CinematicHero.tsx`, the Ken Burns drift, and the crossfade timing are length-agnostic and need no edits.
- The interleave is deterministic given the two shuffled pools, so randomness still comes entirely from the per-visit shuffle.
