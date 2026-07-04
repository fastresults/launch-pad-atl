## Goal

Set attendee expectations that post-Foundation workshops are qualitatively different from Foundation — not because staff "produce agency deliverables for you," but because each session shifts into **mentored review, expert perspective, and directional guidance** applied to the founder's specific startup, using Foundation as the source of truth.

## The framing to introduce

One-liner used consistently across surfaces:

> **Foundation** is where you draft the core of your startup. **Every stage after Foundation** is a mentored working session — expert perspective, live review, and direction applied to your specific context, using your Foundation inputs as the starting point.

Supporting language cues (used verbatim, no production/agency-output promises):
- "Mentored working session"
- "Expert perspective on your specific startup"
- "Live review, redirection, and sharpening"
- "You bring the draft; the room pressure-tests it"
- "Direction you would normally pay a mentor or advisor for"

Explicitly avoid: "we build it for you," "agency-grade deliverable," "$X agency retainer," "done-for-you."

## Where the framing lands

### 1. New "How this session works" slide (post-Foundation decks only)
Insert one new slide after the existing intro slide in each of the 7 post-Foundation decks. Shared component `MentoredSessionSlide` in `ProductizationSlides.tsx`:
- Left column: "What you bring" — your Foundation drafts + a working attempt at this stage's questions
- Middle: "What happens in the room" — expert review, targeted questions, redirection, pattern-matching against other startups
- Right column: "What you leave with" — a sharper version of your own thinking, plus artifacts you can keep iterating on
- Small footnote reinforcing: outputs live on your dashboard, revisable anytime

Each post-Foundation deck grows by one slide (bump `TOTAL_SLIDES` and `pl(11+i)` offsets in the 7 files).

### 2. Curriculum copy rewrite (`src/lib/curriculum-data.ts`, stages 2–8)
- Rewrite each stage `summary` to lead with the mentoring/review frame, not production language
- Add a new `perspective` field to `Stage`: one line naming the *lens* the session applies (e.g., Strategy → "how an operator sizes a market and picks a wedge"; Finance → "how an investor reads your model"; Brand → "how a brand lead pressure-tests positioning")
- Rewrite each `walkOut` bullet away from "you receive X" toward "you leave with clearer X, reviewed against Y"
- Foundation copy reframed explicitly as "the only stage that is pure drafting — every stage after is mentored review of your work"

### 3. Schedule page (`src/routes/schedule.tsx`)
- Add a short callout above the post-Foundation session list: "How post-Foundation sessions work — you arrive with a working draft; the session sharpens it with expert perspective"
- Session subtitles gain a small tag: "Mentored working session"

### 4. Post-Foundation stage banner on `/build/[stage]` routes
- Persistent banner on stages 2–8: "Mentored working session · expert perspective applied to your Foundation inputs · revisable anytime"
- Component: `MentoredSessionBanner` in `src/components/MentoredSessionBanner.tsx`, gated by `stage.id !== "foundation"`

### 5. Productization registry copy pass (`src/lib/workshop-productization.ts`)
No new fields. Instead, audit `buildMechanic`, `takeaway`, and artifact-preview copy for any phrasing that overpromises production ("we build," "auto-generated for you," "shipped to your dashboard as a finished deliverable") and shift to review/direction language ("you draft in-room and leave with a reviewed version," "sharpened live with staff," "a working artifact you continue to refine"). Artifact structure and generator behavior unchanged — only tone shifts.

## Files touched

- `src/lib/framework-deliverables.ts` — add optional `perspective` to `Stage` type
- `src/lib/curriculum-data.ts` — rewrite stages 2–8 summary/walkOut, add `perspective`; small Foundation reframe
- `src/lib/workshop-productization.ts` — copy audit only (no schema change)
- `src/components/workshop-slides/ProductizationSlides.tsx` — new `MentoredSessionSlide`
- `src/components/MentoredSessionBanner.tsx` — new component
- `src/components/workshop-slides/slides/{strategy,operations,finance,governance,brand,marketing,social-content}.tsx` — insert new slide, bump slide counts
- `src/routes/schedule.tsx` — callout block + session chips
- `src/routes/build.$stage.tsx` (or equivalent stage route) — mount `MentoredSessionBanner`

## Out of scope

- No generator, edge function, or DB changes
- No pricing/agency-cost comparisons anywhere
- Foundation deck untouched except one added sentence positioning it as the drafting stage
- Existing AI-generated artifacts stay — copy just repositions them as "starting points for your continued work," not finished agency deliverables

## Open questions

1. **Banner persistence** — always-on banner on stages 2–8, or dismissible after first view per stage?
2. **`perspective` line placement** — surface it only on curriculum cards, or also as a subtitle on the stage's build page and deck intro slide?
3. **Artifact copy** — keep the current artifact-preview slides and just soften language, or also rename them from "Ship-Ready Artifact" to something like "Working Artifact" / "Reviewed Draft"?
