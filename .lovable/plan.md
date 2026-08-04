# Screen content + gender balance pass on workshop hero images

Two problems across the 80 build-workshop hero images (Foundation untouched):

1. **Dead screens.** The shared style string ends with "no text, no logos, no readable UI copy," so every laptop, monitor and phone in frame renders as a blank glow. A social pain shows a dark phone instead of a feed; a website pain shows an empty monitor instead of a page. The screen is the subject in many of these shots and it's saying nothing.
2. **All men.** Nearly every scene with a person reads male. The audience is Plan-B seekers, Main Street operators and family/couple operators — roughly half of them women.

## What changes

### 1. Screens show what the pain is about

Split the style rule. Instead of one global "no readable UI copy," the scene helper takes a flag:

- **Default (objects, hands, rooms):** unchanged — no text, no logos.
- **Screen-forward scenes:** allow generic, non-readable-but-recognizable on-screen content. Shapes, not copy: a feed of square post tiles, a stalled page skeleton, an inbox list of unread rows, an analytics line trending flat, a video call grid, a spreadsheet of blurred figures. Still no legible words, no brand marks — the screen reads as *a social feed* or *a checkout page* at a glance without the model inventing garbled text.

Every scene whose subject includes a monitor, laptop, phone or tablet gets a specific screen description matched to its question. Examples of the intended mapping:

| Pain | Question | Screen now shows |
| --- | --- | --- |
| `posting-into-void` | "I post and nobody ever sees it." | A grid of square post tiles, every engagement count a faint zero |
| `slow-load` | "My pages load so slow people give up." | A half-rendered page — grey placeholder blocks, one spinner |
| `leads-in-inbox` | "My leads sit in my inbox until they go cold." | A long list of unread rows stacking down the screen |
| `no-tracking` | "I have no idea which email actually worked." | A flat analytics line with no spike |
| `blank-page` | "I stare at a blank page every single time." | A genuinely empty document with a lone blinking cursor (this one stays blank on purpose) |
| `no-visibility` | "I'm guessing whether this month made money." | A ledger app with the totals column cut off the frame edge |

A handful of scenes are *supposed* to be blank — `blank-page`, `never-email`'s dead calendar, the dark phone that nothing is arriving on. Those stay, because the blankness is the pain.

### 2. Gender balance

Every scene with a visible person gets an explicit subject descriptor, alternating across each workshop's ten so each set lands close to half women, half men, with a couple of two-person and hands-only frames left neutral. Descriptors stay documentary and age-varied (a woman in her forties at a shop counter, a man in his thirties in a parked truck, two partners at a kitchen table) — no stock-photo styling, same midnight-navy grade.

Balance is per workshop, not just across the whole set, so a visitor who only ever sees the Social lane still sees both.

### 3. Regenerate

Each touched scene is regenerated on the premium tier at 1920x1080, same filename, so nothing downstream changes. Questions and captions already synced in the last pass stay exactly as they are — this is a picture-quality pass only.

## Order of work

Workshop by workshop, same sequence as the last pass, so you can review a lane before the next one starts:

1. Brand identity
2. Website that converts
3. Sales systems
4. Email & CRM automation
5. Social presence
6. Content engine
7. AI operating system
8. Legal & financial ops

Foundation is not touched.

## Technical notes

- `scenePrompt(subject)` in `src/lib/workshop-pains.ts` gains an options argument (e.g. `scenePrompt(subject, { screens: true })`) that swaps the "no readable UI copy" clause for a "recognizable-but-illegible on-screen content" clause. Default behavior is unchanged for object-only scenes.
- `imagePrompt` strings are rewritten in place with the screen description and the subject descriptor; ids, `pain`, `fix` and `question` are untouched.
- Images regenerate to their existing paths under `src/assets/scenes/workshops/<workshop>/<id>.jpg`, so `workshop-scenes.ts` and `CinematicHero.tsx` need no changes.
