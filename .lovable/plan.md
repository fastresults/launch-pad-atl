## Goal

Grow the cinematic hero rotation from 21 to **31 scenes** by pulling 10 more concepts straight from the live business-ideas dataset (`src/lib/business-ideas.ts`), so the typed phrase, the "Now building:" label, and the background photo all stay in sync.

## The 10 concepts (picked from the system data, no overlap with the existing 21)

| id | Typed phrase | Label |
|---|---|---|
| `petgrooming` | I want to start a mobile pet grooming van | Mobile pet grooming |
| `junkhauling` | I want to start a junk hauling business | Junk hauling |
| `pressurewashing` | I want to start a pressure washing company | Pressure washing |
| `ghostkitchen` | I want to launch a ghost kitchen brand | Ghost kitchen |
| `notary` | I want to become a mobile notary and loan signing agent | Mobile notary |
| `pickleball` | I want to teach pickleball clinics | Pickleball clinics |
| `holidaylights` | I want to start a Christmas light install business | Holiday light install |
| `organizing` | I want to start a home organization service | Home organizing |
| `vending` | I want to run a vending machine route | Vending route |
| `handyman` | I want to build a two-truck handyman crew | Handyman crew |

These span service, main-street, food, side-hustle and family-run categories, matching the mix already in the rotation.

## Work

1. **Generate 10 new scene photos** into `src/assets/scenes/` at 1536×1024, matched to the existing look: real Atlanta-feeling operators mid-work, cinematic natural light, shallow depth of field, no text or logos, no obviously synthetic faces. Same naming convention (`scene-petgrooming.jpg`, etc.).
2. **Tone-normalize** each new image to the 65–80 mean-luma target established in the brightness pass, so no new scene reads darker or brighter than the rest of the rotation.
3. **Register them in `src/lib/founder-scenes.ts`** — add the imports and 10 new `FounderScene` entries with `phrase`, `label`, `alt`. The shuffle (`shuffleScenesForVisit`) and typing cycle pick them up automatically; no component changes needed.
4. **Verify** with Playwright: cycle the hero through several rotations and confirm the new scenes render, labels are legible against them, and there's no layout shift or flash from the added images.

## Note on loading

All hero scenes except the first are `loading="lazy"`, so going from 21 to 31 doesn't change the initial page weight — only the first frame is eager.
