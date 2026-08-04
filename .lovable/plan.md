# Sync the hero's typed question to the image on screen

## The problem

On a build workshop (Brand, Website, Sales, Email/CRM, Social, Content, AI Ops, Legal/Money) the hero runs two unrelated loops:

- The photo and the "Now fixing: …" caption cycle through the ten pain scenes, shuffled per visit.
- The typed ghost question in the chat box cycles a separate list of four generic examples on its own timer.

So the screen can show the "quoting low because the brand can't carry more" photo while the chat box types "My logo looks like I made it myself." Now that the images are sharper and more specific, the mismatch reads as sloppy.

Foundation is untouched — it already types its own scene phrases and stays as-is.

## The fix

Give every pain its own first-person question, then drive the typed text from the same index the image uses. One pain = one photo + one caption + one question, always in step.

```text
scene index ──┬─→ hero photo
              ├─→ "Now fixing: <pain>"
              └─→ chat box types "<question>"
```

Because the pain set is shuffled per visit, the pairing stays fresh without ever drifting apart.

## What changes

1. **`src/lib/workshop-pains.ts`** — add a `question` field to `WorkshopPain` and write one for each of the 80 pains across the eight build workshops. Written as the founder would say it out loud, matching the photo's moment (e.g. the two-business-cards photo pairs with "People decide I'm the cheap option before I speak.").
2. **`src/lib/workshop-scenes.ts`** — carry `question` through onto `WorkshopScene`.
3. **`src/components/home/CinematicHero.tsx`** — for pain rotations, feed the scene questions into the single existing scene cycle and use its typed output as the ghost text. Remove the second `useSceneCycle` call for build workshops so there's only one timer. Foundation keeps its current behavior.
4. **`src/lib/workshop-catalog.ts`** — leave `promptExamples` in place as the fallback for any workshop whose images haven't been generated yet (it still drives the founder-scene fallback path). No copy changes there.

## Notes

- No backend, no schema, no new dependencies.
- Timing is unchanged: 7s per scene, the question types and clears with the crossfade it belongs to.
- Longer questions are kept short enough to finish typing inside one cycle.
