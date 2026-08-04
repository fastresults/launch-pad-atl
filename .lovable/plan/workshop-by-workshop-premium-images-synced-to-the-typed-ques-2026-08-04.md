# Workshop-by-workshop: premium images synced to the typed question

## The problem

Two things are out of step in the hero for the eight build workshops:

1. **Image quality.** Only Brand has been regenerated on the premium tier. The other seven still run the older, artifact-prone set.
2. **Text sync.** The photo and the "Now fixing: …" caption cycle the ten pain scenes, while the chat box types a separate list of four generic examples on its own timer. They drift, so the screen shows one pain and the chat box asks about another.

Foundation is untouched throughout.

## The fix

One pain = one photo + one caption + one typed question, locked to the same index. Then walk the workshops one at a time, regenerating each set on the premium tier and writing the question to match the exact photo produced.

```text
scene index ──┬─→ premium photo (pain id .jpg)
              ├─→ "Now fixing: <pain>"
              └─→ chat box types "<question>"
```

## Phase 0 — wire the sync (once, before any workshop)

- **`src/lib/workshop-pains.ts`** — add a `question` field to `WorkshopPain`.
- **`src/lib/workshop-scenes.ts`** — carry `question` through onto `WorkshopScene`.
- **`src/components/home/CinematicHero.tsx`** — for pain rotations, feed the scene questions into the single existing scene cycle and use its typed output as the ghost text; drop the second timer. Foundation keeps its current behavior. Falls back to `promptExamples` when a workshop has no pain images yet.

## Phases 1–8 — one workshop per pass

Brand is first because its premium images already exist; it only needs the questions and a review. The rest get the full pass.

| Pass | Workshop | Images |
| --- | --- | --- |
| 1 | Brand | already premium — question pass + review only |
| 2 | Website that converts | regenerate 10 |
| 3 | Sales systems | regenerate 10 |
| 4 | Email + CRM automation | regenerate 10 |
| 5 | Social presence | regenerate 10 |
| 6 | Content engine | regenerate 10 |
| 7 | AI operating system | regenerate 10 |
| 8 | Legal + financial ops | regenerate 10 |

Each pass runs the same four steps:

1. Read that workshop's ten pains and sharpen each `imagePrompt` for the premium model — one clear human moment, one light source, no text or UI in frame.
2. Generate the ten images on the premium tier at 1920x1080, overwriting `src/assets/scenes/workshops/<slug>/<pain-id>.jpg` so the rotation picks them up with no import changes.
3. Write the ten `question` lines to match the photo that actually came back — first person, said out loud, short enough to finish typing inside one 7-second cycle. Adjust the `pain` caption if the image landed on a sharper moment than the original wording.
4. Review the workshop's hero in the preview at `/?w=<slug>`, confirming photo, caption, and typed question agree across several cycles, then move to the next pass.

## Notes

- Frames that need legible text use `premium.gpt`; everything else uses the default premium tier.
- Filenames and pain ids never change, so nothing else in the app needs updating.
- No backend, schema, or dependency changes.
- `promptExamples` in `src/lib/workshop-catalog.ts` stays as the pre-image fallback.
