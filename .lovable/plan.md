## What's missing — and where to put it

The user named four threads not represented in the curriculum or the walk-out list:

1. **Idea research** — a structured way to research every angle of the startup idea.
2. **Viability analysis** — a clear go/no-go on the idea before money and time get spent.
3. **Funding strategy + fundraising tools** — how to fund the business and what to use to raise money.
4. **Operationalized workflows** — SOPs and repeatable workflows specific to the business.

The 7-stage / 8h30m schedule is already maxed out, so the right move is to **fold these into the existing stages where they naturally belong** rather than invent an 8th stage. Schedule times stay; per-stage walk-outs and tasks expand. Home-page walk-out list grows to reflect the additions.

## Where each thread lands

| Thread | Lands in | Why it fits |
|---|---|---|
| Idea research | Stage 2 — Customer & market | Research is upstream of "who buys." It belongs before the prospect list. |
| Viability analysis | Stage 3 — Offer & product | Go/no-go happens once you know the buyer, the offer, and the unit economics. Slots in next to break-even. |
| Funding strategy + fundraising tools | Stage 1 — Form the business | Capital structure decisions sit with entity setup. Bank, EIN, and funding plan are one conversation. |
| Operationalized workflows | Stage 4 — Build the first working version | SOPs are the durable form of "how a sale becomes a happy customer." |

## Stage-by-stage edits in `src/lib/curriculum-data.ts`

### Stage 1 — Form the business
- **New task #4 (funding strategy & fundraising kit):** `Funding plan & raise-ready kit`
  - Deliverable: a one-page funding plan picking the right path for this business (bootstrap, friends & family, revenue-based, SBA microloan, line of credit, equity), a 12-month capital needs table, and the artifacts needed to ask for money.
  - Details: pick the funding path; build a 12-month cash needs table (startup costs + monthly burn + runway); draft a 1-page raise summary (problem, offer, traction proof, ask, use of funds); save a lender/investor outreach list with 10 named contacts and the templates to message them.
  - Take-home: your funding path chosen, 12-month capital needs costed, raise-ready 1-pager, and 10 named funders to contact.
- **walkOut additions:**
  - `Your funding path chosen (bootstrap / F&F / revenue-based / SBA microloan / line of credit / equity) with a 12-month capital needs table`
  - `Raise-ready 1-pager (problem, offer, ask, use of funds) + 10 named funders or lenders to contact`
- **takeHome** sentence updated to include the funding line.

### Stage 2 — Customer & market
- **New task #4 (idea research):** `Research the idea from every angle`
  - Deliverable: a one-page research brief covering market size, trend direction, regulation/permits, supplier/competitor landscape, pricing benchmarks, and 5 real customer quotes pulled from forums, reviews, or interviews — with source links.
  - Details: define 5 research questions that would kill or confirm the idea; pull market-size and trend data; scan regulation/permits/licensing for the business type and county; collect 5 verbatim customer quotes from reviews/forums/Reddit/Facebook groups; log every source URL.
  - Take-home: your idea-research brief — sourced, dated, and decision-ready.
- **walkOut addition:** `1-page idea-research brief: market size, trend, regulation, supplier/competitor scan, and 5 sourced customer quotes`
- **takeHome** sentence updated.

### Stage 3 — Offer & product
- **New task #4 (viability analysis):** `Score the idea — go / no-go`
  - Deliverable: a one-page viability scorecard with a clear go / pivot / kill recommendation, scored on demand evidence, willingness to pay, unit economics, founder fit, regulatory load, and time to first dollar — each scored 0–5 with the evidence cited.
  - Details: score each of the 6 dimensions against the research, offer, and pricing built in stages 2–3; require a written sentence of evidence per score; compute the total and apply the rule (≥22 go, 15–21 pivot the weakest dimension, <15 kill); write the one-sentence recommendation and sign it.
  - Take-home: your signed viability scorecard with a go / pivot / kill decision and the evidence behind it.
- **walkOut addition:** `Signed viability scorecard with a go / pivot / kill decision, scored on 6 dimensions with evidence`
- **takeHome** sentence updated.

### Stage 4 — Build the first working version
- **New task #4 (operational workflows):** `Operationalize the workflows`
  - Deliverable: 3 written SOPs specific to this business (sales intake, fulfillment, customer onboarding) — each with trigger, steps, owner, tools, definition of done, and the failure modes to watch — saved into the project hub created earlier.
  - Details: pick the 3 highest-leverage workflows; write each as a numbered SOP with trigger / inputs / steps / owner / tools / definition of done; add a "what breaks this" section; load all 3 into Notion / ClickUp / Trello as runnable templates.
  - Take-home: 3 written SOPs loaded into your project hub — runnable on day one with a real customer.
- **walkOut addition:** `3 written SOPs (sales intake, fulfillment, onboarding) loaded into your project hub as runnable templates`
- **takeHome** sentence updated.

> Note: each affected stage now has 4 tasks instead of 3. The `tasks` tuple type in `curriculum-data.ts` is currently `[Task, Task, Task]` — change it to `Task[]` (the only consumer is `STAGES.map(...)`, and the `/schedule` route iterates tasks without an index assumption — quick grep to confirm before editing).

## Edits in `src/routes/index.tsx` (home page `WalkInWalkOut`)

Insert the four new bullets into the existing 17-item `walkOut` array so the page reflects the curriculum truth. New plain-English wording, kept in stage order, no pricing:

- After the Stage 1 bullets, add: `Your funding path picked, a 12-month money plan, a one-page raise summary, and 10 named lenders or investors to contact`
- After the Stage 2 bullets, add: `A one-page research brief on your idea — market size, trends, rules and permits, suppliers and competitors, and 5 real customer quotes with the links`
- After the Stage 3 bullet, add: `A signed go / pivot / kill score for your idea across 6 areas, with the proof behind each score`
- After the Stage 4 bullets, add: `Three written playbooks for your business — how a sale comes in, how you deliver it, how a new customer is welcomed — loaded into your project hub`

New total on the home page: **21 finished pieces** (was 17). No copy outside these bullets needs to change.

## Schedule timing (`src/lib/schedule-data.ts`)

Each affected stage gains one task without growing its time slot — the new tasks are 8–12 minute artifacts that compress into the existing 60–75 minute blocks. No changes to:

- `EVENT` times, `SCHEDULE` rows, break lengths, start/end ISO, calendar exports.
- `FLOW_STAGES` derivation (it reads from `STAGES`, so the new walk-outs flow through automatically).

The only edit to `schedule-data.ts` is none — it picks up the new walk-out bullets and `takeHome` text via the existing `FLOW_STAGES` mapping. Confirmed by re-reading lines 71–79.

## Out of scope

- No 8th stage, no schedule-time changes, no new routes or components.
- No edits to `FlowStrip`, `AIToolkit`, `ValueByTheNumbers`, `/schedule` route layout, or the home page outside the `walkOut` array.
- No pricing, dollar figures, or value pills.
- No changes to the `walkIn` list.

## Files touched

- `src/lib/curriculum-data.ts` — add one task to each of stages 1, 2, 3, 4; extend their `walkOut` and `takeHome`; relax the `tasks` tuple type to `Task[]`.
- `src/routes/index.tsx` — insert four new bullets into the `WalkInWalkOut` `walkOut` array in stage order.