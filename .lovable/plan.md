## Goal

Add more startup scenes to the hero rotation, led by the two you named plus a few popular adjacent ones.

## New scenes (6)

| id | Ghost phrase | Label |
|---|---|---|
| `autoauction` | "I want to be an auto auction consultant" | Auto auction consulting |
| `daycare` | "I want to open a daycare" | Daycare |
| `seniorcare` | "I want to start a senior aging consultancy" | Senior care consulting |
| `homehealth` | "I want to start a home health care agency" | Home health agency |
| `trucking` | "I want to start a trucking company" | Trucking company |
| `foodtruck` | "I want to launch a food truck" | Food truck |

That takes the rotation from 15 to 21 scenes.

## Work

1. **Generate 6 cinematic photos** in the same style as the existing set — real founder in their environment, moody low-key lighting, deep navy/amber palette, shallow depth of field, 1536x1024 — saved to `src/assets/scenes/scene-<id>.jpg`.
2. **`src/lib/founder-scenes.ts`** — import the new images and append six entries with `id`, `phrase`, `label`, `image`, and descriptive `alt` text, matching the existing tone.
3. No changes needed to the hero, shuffle, or typing cycle — they read the array length dynamically.

## Verification

Playwright load to confirm all images resolve and the new phrases appear in the rotation, plus a screenshot of one new scene.
