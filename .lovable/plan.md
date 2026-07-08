# Fix awkward Launch/Pivot Method copy across the homepage and pages

## The problem

The two names collide in body copy. Right now readers hit sentences like:

> "The 14-Day Launch Method is The 14-Day Pivot Method in one focused morning."

That reads like a tautology. The distinction we established last turn is real but only useful once — it should not appear inside a single sentence, and never as an "X is Y" definition. It also shouldn't be repeated in an eyebrow + headline stack on the same page.

## The rule going forward

- **The 14-Day Launch Method** = the offer name. Used in eyebrows, buttons, agendas, meta titles, pricing, "what you're attending / buying."
- **The 14-Day Pivot Method** = the process name. Used sparingly in body copy when we need to describe the *underlying method* — the pivot from job/side-hustle/fantasy startup to real income in 14 days.
- Never define one in terms of the other in a single sentence. Never stack both names in the same eyebrow + H1 + first paragraph.
- On any page, name the offer (Launch Method) in the eyebrow / hero. Only reach for "Pivot Method" once, later in the body, when we're describing the method itself — and only if it adds meaning.

## Rewrites

### 1. `src/components/home/HomeFramework.tsx` — the offending paragraph (line 100)

Current:
> The 14-Day Launch Method is **The 14-Day Pivot Method** in one focused morning — the done-with-you playbook quietly replacing accelerators, courses, and raw AI…

Rewrite (drops the "X is Y" collision, keeps Pivot Method as the *method* reference later):
> The 14-Day Launch Method is one focused morning of **The 14-Day Pivot Method** — the done-with-you playbook quietly replacing accelerators, courses, and raw AI. The way modern founders skip the year of guessing and pivot to their first paying customer in two weeks. Run live by Adam, the operator who built it. $297 once, yours forever. **Full support during and after**, if you want it.

Rationale: same information, no tautology, "pivot" now earns its keep in the follow-on sentence.

### 2. `src/routes/build.tsx` — hero H1 (line 21) collides with the eyebrow

Eyebrow already says "The 14-Day Launch Method · 8 Working Sessions with Adam", so the H1 shouldn't reintroduce the sibling name.

Current H1:
> Scale it with **The 14-Day Pivot Method** — one morning at a time.

Rewrite:
> Scale it with the same method that launched you — one morning at a time.

Then in the body paragraph (line 24) we already reference "the done-with-you method behind The 14-Day Launch Method" — no change needed. Pivot Method doesn't need to appear on this page.

### 3. `src/routes/one-on-one.tsx` — eyebrow + H1 collision (lines 82–85)

Eyebrow: "The 14-Day Launch Method · Done for you"
H1 currently starts: "The 14-Day Pivot Method,"

Rewrite H1 to lead with the outcome, not the sibling name:
> Your launch, **done for you in 14 days.**

Keep the surrounding subhead referencing "The 14-Day Launch Method, run for you by Adam and our team" (already true in meta description).

### 4. `src/routes/webinar.tsx` — line 40

Current:
> **The 14-Day Pivot Method**, run live over video in a small cohort —

Rewrite (this page's offer is the Zoom cohort of the Launch Method; Pivot Method is the wrong name here):
> **The 14-Day Launch Method**, run live over video in a small cohort —

And to avoid Launch Method appearing 4× in a row on this page, soften the paragraph opener above it to "the same method, run live over video…"

### 5. `src/lib/hub-dashboard-copy.ts` — line 17/18 collision

Eyebrow: "01 · 14-Day Launch Method"
Body currently starts: "The 14-Day Pivot Method — the proven 14-day sprint…"

Rewrite body:
> The proven 14-day pivot — every asset in your kit maps to a specific day, so you know when to read it, not just what it is.

Drops the naming collision, keeps the word "pivot" as a verb where it works naturally.

### 6. `src/lib/chatbot-knowledge.ts` — already correct

Lines 200–207 correctly document the offer-vs-process distinction for the concierge. No change.

## Files touched

- `src/components/home/HomeFramework.tsx` — rewrite one paragraph
- `src/routes/build.tsx` — rewrite hero H1
- `src/routes/one-on-one.tsx` — rewrite hero H1
- `src/routes/webinar.tsx` — swap Pivot → Launch in one sentence, soften preceding line
- `src/lib/hub-dashboard-copy.ts` — rewrite one line

## Out of scope

- No changes to the offer name, pricing, page structure, routes, or eyebrows.
- No mass find/replace — every remaining "Launch Method" reference is contextually correct (eyebrows, buttons, meta titles, agenda headers, pricing copy).
- Facilitator, AccessModeDialog, services, build.$slug, schedule pages already read cleanly — left alone.

## Verification

- `rg "Pivot Method" src/` should show Pivot Method used at most once per page, and never in an "is a" definition next to Launch Method.
- Read the homepage hero + framework block end-to-end for cadence.
