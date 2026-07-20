# ICP Profile — Startuplabs

Ship a single reference document the team can use to guide copy, offers, ads, and disqualification. Written in the same plain-spoken voice we've locked into the site.

## Deliverable

**File:** `.lovable/icp-profile.md` (internal reference; can be copied to `public/` later if we want a shareable version).

Length target: ~8–10 pages. Skimmable. Tables where useful, not decorative.

## Structure

**1. One-line ICP (the north star)**
Who we exist for in a single sentence — the 25–45 W-2 employee in metro Atlanta with an idea and no plan, willing to spend one Saturday and $297 to stop guessing.

**2. Core demographics (the whole audience)**
Age, income, geography (Atlanta metro primary, US-wide via Zoom), employment status, education, family stage, tech comfort. Ranges, not fake precision.

**3. The four primary personas**
Each persona gets the same one-page treatment so the team can compare them side-by-side:

- **A. The Plan-B Seeker** — W-2 employee (nurse, teacher, ops manager, corporate mid-level), 30–45, wants a second income they own. Most common buyer.
- **B. The AI-Displaced Professional** — 35–55, recently laid off or watching their role erode, has savings + urgency, needs a business not another job hunt.
- **C. The Main Street Operator** — trades, food, wellness, retail, real estate; already runs something small or is about to; needs foundation not vibes.
- **D. The Family / Couple Operator** — husband-wife, parent-adult-child, or two friends starting together; wants a shared plan both people understand.

Per persona:
- Snapshot (age, job, income, life stage, city archetype)
- What they say out loud (2–3 real quotes)
- What keeps them up at 11pm (top 3 pains)
- What they've already tried and why it didn't stick
- What "success" looks like to them 6 months out
- The trigger event that makes them buy
- Which offer they enter through (Foundation workshop / Zoom / done-with-you) and why
- Objections + the one-line answer

**4. Buying triggers (cross-persona)**
The 5–7 life events that move someone from "thinking about it" to registering: layoff, second baby, spouse income drop, a specific dollar goal, turning 40, a friend's business win, a bad Monday.

**5. Channels + language**
Where they already are (Facebook groups, LinkedIn if displaced, Nextdoor, church, local podcasts, Instagram Reels), what words they use for their own problem ("side income," "my own thing," "get out of the rat race" — not "MVP," "GTM," "TAM").

**6. Disqualifiers (who this is NOT for)**
Series A founders, credential collectors, coach-shoppers, anyone who wants us to tell them their idea is great without pressure-testing it. Short list, blunt.

**7. Offer-to-persona matrix**
One table mapping each persona → best entry offer → likely upsell path → price tolerance ceiling.

**8. How to use this doc**
Half-page for the team: copy checks, ad targeting, sales-call qualification, when to route to `/build` vs `/services` vs `/one-on-one`.

## Voice + constraints

- Plain-spoken, 6th–8th grade reading level. Same voice as the current site sweep.
- Banned words carry over: method, framework, operator (as a noun in body copy), cohort, funnel, ICP (in copy — we can use it in section headers here since this is an internal doc), GTM, MVP, TAM, pivot (as a noun).
- Say "your business / side income / shop," never "your thing."
- Every persona quote must sound like a real human, not a marketing composite.

## Source material I'll draw from

- `public/business-case.md` (already-approved voice + $13,900 alone-cost math)
- `public/adam-funnel-v1.md` (existing archetype thinking: Cubicle Escapee, Idea Hoarder, AI-Displaced)
- Current live copy: `src/routes/index.tsx`, `HomeFramework.tsx`, `AccessModeDialog.tsx`, `/build`, `/services`
- Locked pricing: Foundation $297, lower-tier workshops $197, higher tiers $397

## Out of scope for this pass

- No code changes, no route edits, no UI.
- Not writing new ads or landing pages — this is the source-of-truth doc those get written from later.
- No PDF export yet (can add after the markdown is approved).

## Open question before I write

Do you want the four personas as I've named them above (Plan-B Seeker / AI-Displaced / Main Street / Family-Couple), or do you want to swap one out — e.g. drop Family-Couple and add "Creator going pro" or "Technical builder who can't sell"? I'll default to the four above if you just say proceed.
