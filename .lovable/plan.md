## What's not realistic in 7 hours

A scan of the 21 home-page bullets and the underlying curriculum data turns up four promises that imply *finished outside-the-room research* the workshop can't actually deliver:

| # | Current bullet | Why it's not real |
|---|---|---|
| 1 | "…5 sourced customer quotes" | Pulling and citing 5 verbatim quotes from forums/reviews mid-session is research work, not workshop work. |
| 2 | "…25 real names to message" | Researching 25 named prospects takes hours of LinkedIn/local-list work, not a 60-min block. |
| 10 | "…10 funders to contact" | Naming 10 vetted lenders/investors is a research project on its own. |
| 20 | "…10 outreach drafts ready" | Personalizing 10 unique messages to named people requires having the named people — see #2. |

The fix: keep the artifacts, drop the quantified outside-the-room research. The founder leaves with the **system** (template, plan, scoring rubric) instead of a phantom finished dataset.

## Cleaned-up 21 bullets (same order, same length budget)

**Investigate**
1. A 1-page idea brief: market size, trend, permits, competitor scan, and real customer quotes you've pulled

**Validate the buyer**
2. Your first customer profiled, their problem priced, and a prospect list you start building in-session
3. An outreach message written for you, 3 competitors mapped, and what makes you different

**Shape the offer**
4. Your offer in one sentence, scope mapped step-by-step, and a price built from real costs

**Decide — go / pivot / kill**
5. A signed go / pivot / kill score across 6 areas, with the proof behind each

**Form the business**
6. Your Georgia LLC paperwork, pre-filled and ready to file
7. Your EIN issued before lunch
8. Terms, Privacy, and a customer agreement customized to your business
9. Business-bank shortlist plus local license and sales-tax steps

**Fund it**
10. Funding path picked, a 12-month money plan, a raise 1-pager, and a funder outreach plan ready to send

**Build the first working version**
11. Your sale-to-customer map with the free apps set up in your name
12. Your first customer's deliverable drafted, with a 5-point quality checklist
13. Three SOPs — intake, fulfillment, onboarding — loaded into your project hub

**Brand & publish**
14. Your logo, 4-color palette, and font pair, built from your business name
15. A 4-page website (Home, Offer, About, Contact) in your voice, ready to publish
16. Payments, business email, and GA4 set up and queued for one click

**Print & promote**
17. Headline, 3 reasons to buy, 30-second pitch, and 100-word founder bio
18. Print-ready business card and 1-page flyer in your brand
19. 6 social posts, a 60-second video script, and a 30-day plan with 3 weekly KPIs

**Launch**
20. Your signed 30/60/90 plan, announcement list, and personal outreach drafts ready to send
21. Launch-day timeline, starter CRM, 3 weekly KPIs, and an accountability partner on the calendar

## Curriculum-data alignment (`src/lib/curriculum-data.ts`)

The same overpromises live deeper in the curriculum and feed the schedule page. Soften them so the home page and `/schedule` agree:

- **Stage 1, Funding task** — change deliverable/walkOut/takeaway from "10 named lenders or investors to contact" to "a funder outreach list you start building with the message templates ready to send." Follow-up text stays — sending the messages happens after.
- **Stage 2, takeHome** — drop "25-name prospect list pulled for your niche and zip." Replace with "a prospect list you start building in-session."
- **Stage 2, walkOut item** — change "25-name prospect list pulled… exported as a CSV" to "a starter prospect list with the source template and the CSV export ready."
- **Stage 2, Research task** — change "Collect 5 verbatim customer quotes…" to "Pull real customer quotes from Reddit, Facebook groups, or product reviews — log every URL." (Drop the count of 5.)
- **Stage 2, Research task takeaway / walkOut** — replace "5 sourced customer quotes" with "sourced customer quotes."
- **Stage 2, Market task** — soften the "25-name prospect list pulled for you" line to "a starter prospect list you begin building in-session, with the source template."
- **Stage 7, Launch task** — change "10 personalized outreach drafts written for your contacts" to "personal outreach drafts ready to send from a template you've personalized." Drop the 10 count from walkOut and takeaway.
- **Stage 7, takeHome** — drop the "personalized outreach drafts ready to send" count language so the home page and curriculum match.

The follow-up text in each task ("send the messages within 2 weeks", etc.) stays. That's the right place for the homework promise.

## Files touched

- `src/routes/index.tsx` — replace the `walkOut` array with the 21 tightened, realistic bullets above.
- `src/lib/curriculum-data.ts` — surgical edits to Stage 1 funding task, Stage 2 (takeHome, walkOut, research task, market task), Stage 7 (takeHome, launch task). No structural changes, no new tasks, no removed tasks.

## Out of scope

- No edits to `/schedule` route layout (it reads from `STAGES` and updates automatically).
- No changes to `walkIn`, `FlowStrip`-related sections, headings, group labels, or visual styling.
- No new promises added — only quantified outside-the-room promises softened.