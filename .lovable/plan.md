## Goal

Rewrite all 8 `/build/[slug]` workshops so each page reads as a real, high-conversion workshop landing page — not a generic data record. Same structure, sharper copy, more concrete value, stronger psychological pull at every section.

## Where the work happens

A single file: `src/lib/build-workshops.ts`. Every visible string on `/build/[slug]` is data-driven from this file, so no route/component changes are needed. The 8 slugs:

1. `brand-identity` — $297
2. `website-that-converts` — $397
3. `social-presence` — $197
4. `content-engine` — $297
5. `ai-operating-system` — $397
6. `email-crm-automation` — $397
7. `sales-systems` — $397
8. `legal-financial-ops` — $197

## What each workshop page must do (the conversion model)

Top to bottom, the page should run this sequence in the visitor's head:

1. **Hero** — name the desired end state in their language, anchor the price as trivial vs. the stakes
2. **Pains** — make the cost of inaction specific and quantified
3. **Walk-outs** — prove they leave with tangible artifacts, not "frameworks to think about"
4. **Agenda** — show how a half-day actually produces those artifacts
5. **Fit** — disqualify aggressively to raise trust + perceived selectivity
6. **Decision moment** — remove pressure, frame the in-room choice (DIY / hire us / hire elsewhere)
7. **Agency upsell** — the credit-back guarantee makes the workshop the obvious first step
8. **FAQ** — kill the last 4 objections

Sections 6 and 7 are already strong and shared across pages — no per-workshop change needed. Sections 1–5 + per-workshop FAQ tone are where the lift comes from.

## The per-workshop copy upgrade (applied to all 8 slugs)

For each workshop I'll rewrite these fields:

- **`oneLiner`** — make it a desire/outcome line in 10 words or less. Lead with what the buyer wants, not what we do. No category labels.
- **`subhead`** — 2 sentences. First sentence names the wrong way most founders do it. Second sentence promises the specific shift the workshop delivers.
- **`pains[3]`** — each pain gets a punchy headline that names a dollar-cost or time-cost outcome, plus a 1–2 sentence body with a concrete mechanism. Stop saying "you'll regret it" — show the math.
- **`walkOuts[6]`** — every item is a noun phrase naming a real artifact (not a verb phrase about learning). Add specificity (counts, formats, examples) so it reads as deliverables, not topics.
- **`agenda[4]`** — keep the time blocks. Tighten titles to verb phrases. Rewrite details so each block names: input → working session → output. Reader should believe the artifact is actually produced in that window.
- **`forYou[3]`** — situational, present-tense. Specific enough that the right buyer thinks "this is me."
- **`notForYou[3]`** — disqualify the tire-kicker, the not-ready-yet, and the unrealistic expectation. Keep them sharp and slightly funny; that's part of the brand voice.

Common shared sections that already work — left untouched:
- `priceCents` / `priceLabel` (already tiered correctly)
- `agencyServiceTagline` (just rewrote in last pass)
- `faq` via `makeCommonFaq()` (already consistent and tight)

## Workshop-specific angles (the differentiators I'll lean into)

Each workshop needs a sharper, distinct positioning so the 8 pages don't bleed together:

- **Brand identity ($297)** — "premium perception in 3 seconds." Lean into pricing-power outcomes: bad brand = freelancer-tier rates.
- **Website that converts ($397)** — "your homepage is a revenue surface, not a brochure." Conversion-rate math is the hero.
- **Social presence ($197)** — "two channels, owned." Lean into focus and cadence over reach.
- **Content engine ($297)** — "the only marketing line item that gets cheaper every month." Compounding asset framing.
- **AI as your operating system ($397)** — "two people doing the work of ten." Workflow ROI math, not tool tourism.
- **Email/CRM/automation ($397)** — "most revenue lives in touches 2, 5, and 12." Lifecycle LTV framing.
- **Sales systems ($397)** — "stop closing on mood, start closing on system." Pipeline-as-forecast framing.
- **Legal/financial/ops ($197)** — "the boring stuff that decides whether you're bankable." Risk-of-the-call-from-the-bank framing.

Each one already gestures at this — the rewrite makes it the spine of the whole page so a visitor can describe the workshop in one sentence after scanning it.

## Copy guardrails

- 20-year conversion-copywriter voice (Adam Anderson). Second person, present tense, short clauses, em-dashes used as scalpels not decoration.
- Specific over generic ("3 sequences written live in the room" > "you'll learn email sequencing").
- One concrete number or proof point in every pain card and every walk-out where credible.
- No empty intensifiers ("absolutely," "truly," "really").
- No "framework," "deep dive," "unlock," "leverage" (verb), "elevate," "synergize."
- Keep the existing workshop-shows-strategy-plus-tools-plus-process positioning the user just asked for. Every workshop page must reinforce that the buyer leaves with the strategy, the templates, and the tool stack.

## Out of scope

- No page layout or component changes.
- No price changes.
- No new sections, no new fields beyond what's already on `BuildWorkshop`.
- No edits to `/services`, `/build`, or homepage copy — only the per-slug data.
- No changes to the common FAQ helper (already rewritten last turn).

## Acceptance

- All 8 workshops have rewritten `oneLiner`, `subhead`, `pains`, `walkOuts`, `agenda`, `forYou`, `notForYou`.
- A visitor skimming any `/build/[slug]` can answer in 10 seconds: what's the outcome, what artifacts do I walk out with, why does it cost what it costs, and what happens if I don't do this.
- No two workshops sound interchangeable.
- Typecheck passes; no shape changes to `BuildWorkshop`.
