# Add a third hero rotation lane: remote professional careers

Today the hero rotates 76 scenes in a two-beat cadence: Main Street, online, Main Street, online. This adds a third lane — remote work for professionals — so the cadence becomes Main Street → online → remote → Main Street → online → remote, still fully shuffled on every visit.

## What gets added

30 new remote-professional scenes, each with its own cinematic photo in the same look as the current set (natural window light, shallow depth of field, real workspaces, no stock-photo gloss). Concepts span the roles a corporate escapee can realistically sell:

Fractional CFO, fractional CMO, bookkeeping practice, tax prep, HR consulting, recruiting agency, executive coaching, resume and LinkedIn service, project management consulting, Salesforce/HubSpot admin, data analytics consulting, IT support desk, cybersecurity advisory, cloud migration consulting, technical writing, grant writing, medical billing, insurance claims support, legal research support, virtual paralegal, remote customer success, remote sales development, RevOps consulting, translation services, remote bookkeeping for trades, proposal writing, market research, remote therapy/coaching practice, online notary/loan signing, and remote operations consulting.

Final mix: 41 Main Street, 35 online, 30 remote — 106 scenes.

## How the rotation works

The shuffle keeps its current guarantees and gains one more:

- Every scene appears exactly once before any repeat.
- The three pools are each shuffled independently on every page load.
- They are then woven together in a repeating three-beat cycle.
- The starting lane is picked at random, so a visit can open on any of the three.
- The opening scene still never matches the previous visit's opener in the same session.

Because the pools are uneven, once the shortest pool (remote, 30) runs out, the cycle continues with the remaining two lanes alternating; when only one pool is left, its remainder plays out in shuffled order. The strict three-beat cadence therefore holds for the first ~90 scenes, which is far past what any visitor sees.

## Technical notes

- `src/lib/founder-scenes.ts`: widen `SceneCategory` to `"main-street" | "online" | "remote"`, add the 30 imports and entries tagged `category: "remote"`.
- Replace `interleaveByCategory`'s two-pool logic with a generic round-robin over an ordered list of pools, rotated to start at a random lane. Signature stays `(scenes, startWith)` so callers don't change.
- `shuffleScenesForVisit`: pick `startWith` uniformly from the three categories; the existing "don't repeat last opener" swap still looks for the next scene of the same category, so cadence is preserved.
- `CinematicHero.tsx` needs no change — it is length- and category-agnostic.
- Images generated into `src/assets/scenes/` as JPGs, same dimensions and treatment as the existing 76.
