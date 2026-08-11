# Productize the agency side — no labor promises

Two problems in the current copy: it commits us to physical production ("commissioned", "shoot", "art buyer", "photographer"), and it describes labor rather than the outcome the client receives. How the imagery gets made is our business — the client buys the standard, not the method.

## Language rules

Never promise a method or a body: no "commissioned", "shoot", "photographer", "art buyer", "half-day", "retouched", "book two hours". Also avoid open-ended volume ("as many rounds as it takes").

Say instead: **owned, art-directed imagery** — original frames made to your direction, not stock. Describe the standard and the finished state, with a defined scope (a set, a round, a signed-off standard).

## Heavy lifting — campaign move

- We do it: "Original art-directed imagery in place of stock, the poster system rebuilt to your direction, and the eight-week arc run to a standard we sign off."
- Role: "Campaign director" (drop "Art buyer").
- You do it stays about the founder losing the thread, not about hiring a photographer.

## Brand move

Keep "graded / art direction / refined / print-grade" — it reads as productized already. One tightening pass so the promise is a defined output: a written art direction, a refined system, and a produced collateral set at print standard.

## Same pass on the runway steps and guides

- Runway step `imagery-production`: retitle from "Shoot or commission the real imagery" to "Replace stock with owned imagery", with a done-when about every hero surface carrying original art-directed frames — no shoot brief or delivery-and-retouch promise.
- Runway step `photography`: same treatment for the founder-side variant.
- Guides for `imagery-production` and `photography`: replace "book a photographer / block a half-day / shoot on a phone" instructions with direction-first steps (write the frame list, define light, crop and colour, source or produce to it, check every crop ratio).
- `ops-significance.ts` skill line: drop "art buying and production… shot to one light" in favour of art direction and imagery standard.

## Technical detail

Files: `src/components/ops/HeavyLifting.tsx`, `src/lib/ops-significance.ts`, `supabase/functions/_shared/ops-runway.ts`, `supabase/functions/_shared/ops-guides.ts`. Copy only — no logic, matching, or scoring changes. The `venture-ops` function redeploys so refreshed titles and guides reach existing runways.
