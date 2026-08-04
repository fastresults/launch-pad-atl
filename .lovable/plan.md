# What the modal does for each workshop

## Where it stands today

Every workshop — Foundation and the other eight — opens the same modal. The AI is told to read the answer "through the lens" of the selected workshop, but the frame it fills is still Foundation's: verdict, reach tier, revenue ranges, startup cost, three signals, four first moves, three watch-outs, "why Atlanta." The closing invitation is hardcoded Foundation too: Aug 20, $197, live page + priced offer + first outreach, "Reserve my seat."

That's the problem. Type "Instagram, but I post twice a year" into Social and you get monthly revenue ranges and a startup-cost tile. And the CTA sells a workshop that isn't the one they clicked — the other eight open Sep 2026 through Apr 2027, so "Reserve my seat" isn't even real for them yet.

## The strategy

One shared frame, two different jobs:

- **Foundation asks "can this work?"** — it's a viability read, because the visitor has no startup yet.
- **The other eight ask "how bad is it, and what does one morning fix?"** — a diagnostic. They already have a startup. What they don't have is the one asset that lane builds. The modal names the gap, shows the cost of leaving it, shows the exact thing they'd walk out with, and — because the workshop is months out — converts to the waitlist plus Foundation as the door that's open now.

So every non-Foundation modal follows the same five beats:

1. **The read-back** — what they typed, named back to them sharper than they said it
2. **The gap** — the specific thing missing, in their language, from that workshop's ten pains
3. **What it's costing** — one honest, non-numeric cost statement (no revenue ranges outside Foundation)
4. **What gets built that morning** — the named artifact, tied to their answer
5. **The invitation** — waitlist for that workshop (with its real month) + Foundation as the open door

## Per workshop

**Brand — "Be impossible to ignore."**
They type how they want to be seen. Read: the distance between how they want to land and what a stranger currently sees. Gap: no visual or verbal consistency, so they read as a hobby. Built that morning: the mark, the palette, the type, and the sentence they say when someone asks what they do. Opens Sep 2026.

**Website — "Make your site sell."**
They type the one job the page has. Read: whether that job is actually a single, clickable action or a wish. Gap: the current page describes them instead of asking for that one action. Built: the live page written around that one action, published. Opens Oct 2026.

**Sales — "Name your dream client."**
They type who they want. Read: how findable that buyer actually is, and where they cluster in metro Atlanta. Gap: no list, no message, no order of operations. Built: the named list, the first message, and the follow-up sequence. Opens Nov 2026.

**Email & CRM — "Who stopped replying?"**
They type who they keep losing. Read: which stage of the handoff those people fall out of. Gap: no automatic second touch, so interest expires quietly. Built: the follow-up sequence live in their tool, firing on its own. Opens Dec 2026.

**Social — "Where are your buyers?"**
They type where their buyers are. Read: whether that channel matches the buyer they actually want, or is just the one they're comfortable in. Gap: profile that doesn't say what they sell, and no repeatable thing to post. Built: the profile rewritten to convert, plus the first set of posts scheduled. Opens Jan 2027.

**Content — "What do buyers ask?"**
They type the question buyers ask first. Read: what that question reveals about where the buyer hesitates. Gap: the answer lives in their head, so they answer it one text at a time forever. Built: that answer published as the piece, plus the repurpose path to the other channels. Opens Feb 2027.

**AI ops — "What's eating your week?"**
They type the manual work. Read: how many hours a week that is, framed in hours — not dollars. Gap: no written process, so nothing can be handed off to a person or a model. Built: that task running as a working automation before they leave. Opens Mar 2027.

**Legal & money — "What are you avoiding?"**
They type the avoided thing. Read: what specifically is exposed while it stays undone — stated plainly and never as legal or tax advice. Gap: no entity, no contract, no separation between personal and startup money. Built: the entity filed, the contract they can send, the books separated. Opens Apr 2027. Extra guardrail: this lane never asserts a rule; anything jurisdictional says "confirm with the county."

## The CTA for all eight

Same shape, workshop-specific wording:

- **Primary:** "Get first access — <Workshop> opens <Month Year>" → the existing waitlist form, prefilled with the workshop and the answer they typed
- **Secondary:** "Start with Foundation, Aug 20 — $197" → /register
- **Tertiary:** "See the morning" → the workshop's own page

Foundation's modal keeps exactly what it has today: viability, the money picture, and "Reserve my seat."

## Technical notes

- `supabase/functions/atlanta-viability/index.ts`: split the system prompt into a Foundation viability prompt and a diagnostic prompt for the eight, keyed on `workshopSlug`. Diagnostic JSON drops `reach` and `economics` and adds `gap`, `cost_of_leaving_it`, and `walk_out_with`. Keep the "no numbers as promises" and no-advice rules in both, plus the copy standards already in the prompt (startup, assets, never plan/blueprint/roadmap for the offer).
- `src/components/home/IdeaSnapshotModal.tsx`: keep the shell, header, streaming, and sticky bar. Render the money/reach blocks only for Foundation; render gap → cost → walk-out for the other eight. Feed the eight from `getWorkshopPains(slug)` and `getWorkshopProduct(slug)` so the artifacts named in the modal match the page below.
- The closing invitation and `ActionRow` take the workshop as input instead of hardcoding Aug 20 / $197 / Reserve. `opensLabel` and `href` already exist on `CatalogWorkshop`.
- Reuses the existing `WaitlistForm` for the primary CTA — no new table or migration.
