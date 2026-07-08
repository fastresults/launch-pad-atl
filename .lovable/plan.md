# Kill the twin headlines — give /build and /services their own hooks

## The problem

Both pages open with the same skeleton:

- **/services**: "Launched and taking money? *Scale with the same Process that launched you.*"
- **/build**: "Launched already? *Scale it with the same method that launched you — one morning at a time.*"

Same setup ("Launched…?"), same payoff ("Scale with the same [X] that launched you"), same gradient span, same rhythm. Reads like one page cloned from the other. Also weak conversion — neither headline names *what makes that specific page different* from the other.

## What each page actually sells

- **/build** — eight standalone working sessions, $197 each. **DIY with the operator in the room.** Differentiator: *one morning per capability, done by lunch.*
- **/services** — three done-for-you Scale Tracks by the team. **Hand it off.** Differentiator: *agency-replacement, we run it for you.*

The headlines should surface those differentiators, not repeat a shared setup.

## Rewrites

### `src/routes/build.tsx` (line 19–22)

**Before:**
> Launched already? *Scale it with the same method that launched you — one morning at a time.*

**After:**
> One morning. *One layer. Live by lunch.*

Rationale: rhythm-of-three that literally describes the offer's structure (each session = one morning, one capability, shipped by noon). Punchy, memorable, tells the reader exactly what they're buying. The "$197 each · 8 working sessions" already lives in the eyebrow, so the H1 doesn't need to carry price.

Backup, more explicit option if the metaphor feels too abstract:
> Ship the next layer of your startup. *One morning. $197.*

### `src/routes/services.tsx` (hero H1, around line 44)

**Before:**
> Launched and taking money? *Scale with the same Process that launched you.*

**After:**
> You launched. *We'll scale it.*

Rationale: brutally short, sharp contrast, high persuasion. Names the exact handoff — you did part one, we do part two. Fits the done-for-you positioning. The existing subhead already carries "our team running The 14-Day Pivot Method at scale" — the H1 stops describing the method and starts making a promise.

Backup, if the user wants "launched" retired from *both* headlines:
> Past first revenue? *Hand the scale build to us.*

## Why this converts harder than what's there

- **Distinct promise per page.** A visitor bouncing between /build and /services now hears two different offers, not one restated.
- **Verb-first.** "Ship" and "scale" are action verbs; "Launched already?" is a question that makes the reader qualify themselves before the promise lands.
- **Each headline stands on the page's own differentiator** (morning cadence for /build, handoff for /services), so the H1 is doing conversion work, not just decoration.

## Files touched

- `src/routes/build.tsx` — one H1 rewrite
- `src/routes/services.tsx` — one H1 rewrite

## Out of scope

- No changes to eyebrows, subheads, body copy, CTAs, gradients, layout, or any other page.
- No changes to the 14-Day Pivot Method naming already locked in.

## Verification

Read the two pages back-to-back. They should now feel like two chapters of the same story, not two prints of the same page.
