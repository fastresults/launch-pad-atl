# Add "Build" as a first-class stage

The current curriculum covers Form → Customer → Offer → Brand → Marketing → Launch, but skips the operational work of actually assembling the thing the attendee will sell. We'll add **Stage 4: Build** (operational MVP), shift Brand/Marketing/Launch down one slot, and rebalance times to stay inside the 6-hour window. Same strict, conservative posture: in-session = drafts, decisions, and ready-to-run artifacts; anything requiring outside vendors/time moves to `followUp`.

## New stage map (still 6 hours total)

| # | Stage | Duration | Change |
|---|---|---|---|
| 1 | Form the business | 50 min | −10 |
| 2 | Customer & market | 55 min | −5 |
| 3 | Offer & product | 50 min | −10 |
| **4** | **Build (operational MVP)** | **60 min** | **NEW** |
| 5 | Brand & website | 65 min | −10 |
| 6 | Marketing plan & materials | 50 min | −10 |
| 7 | Launch plan | 40 min | −5 |
| — | Breaks / transitions | ~10 min | unchanged |
| **Total** | | **~370 min** | fits the 6-hour day |

The Offer stage already touches a "fulfillment SOP." Build picks that up and goes deeper into the *operational stack* the attendee will actually run on day one — without promising a finished product.

## Stage 4: Build — three tasks (each conservative, in-seat)

The stage is **archetype-aware** because attendees will fall into one of three buckets. Each task offers the same deliverable shape, branched by archetype: **Service**, **Digital product / software**, **Physical product**.

### 4.1 Pick your build archetype & lock the V1 workflow (20 min)
- **Deliverable:** Archetype selected + a 1-page V1 workflow diagram (sale → intake → delivery → handoff) with named tools at each step.
- **In-session:**
  - Service: intake → kickoff → delivery template → recap loop.
  - Digital: no-code/template/scaffold choice (e.g. Lovable, Notion, Framer, Webflow, Shopify, GHL) + the first screen/page identified.
  - Physical: supplier/manufacturer shortlist + sample-order checklist + packaging decision.
- **followUp:** Run the workflow end-to-end with one test buyer (or sample order) in the first 2 weeks.

### 4.2 Assemble the operational toolkit (20 min)
- **Deliverable:** Tool stack chosen and accounts created where free + integration map drawn (no paid plans signed in-session).
- **In-session:**
  - Project/ops hub (Notion / ClickUp / Trello) — workspace seeded with V1 templates.
  - Files & assets (Drive / Dropbox) — folder structure created.
  - Comms (business email alias + scheduling link — Cal.com / Calendly free tier).
  - Service-delivery or production tool specific to the archetype (e.g. Loom for service walk-throughs, Figma for digital, supplier portal accounts for physical).
- **followUp:** Upgrade to paid tiers as revenue justifies; connect any integrations that require billing.

### 4.3 Draft your V1 customer-delivery artifact (20 min)
The single tangible thing the customer will receive in week one — drafted in-session, not shipped.
- **Service:** Kickoff doc + delivery template + recap email — all three drafted.
- **Digital:** Landing/demo screen wireframed in the chosen builder + onboarding flow outlined + first email drafted.
- **Physical:** Product spec sheet + unboxing/insert-card draft + first-customer thank-you note.
- **Deliverable:** Three drafted artifacts saved to the attendee's workspace, plus a 5-point QA checklist they can run before delivering to a real customer.
- **followUp:** Run the artifacts past your first paying customer; iterate after their feedback.

## How this threads through the existing plan

- **Curriculum data (`src/lib/curriculum-data.ts`):** Insert the new Build stage as `n: 4`, renumber Brand → 5, Marketing → 6, Launch → 7. Adjust `duration` strings on the four affected stages.
- **Schedule (`src/lib/schedule-data.ts`):** Recompute session start/end times so the day still ends at 4:30 PM ET. Add a Build session block between Offer and Brand.
- **Homepage (`src/routes/index.tsx`):** Update the "6 stages" line to "7 stages" (or "Form → Build → Launch in one day"); add Build to the "What you leave with" list as "an operational V1 workflow with the artifact your first customer receives."
- **Schedule route (`src/routes/schedule.tsx`):** No structural changes — it renders whatever is in `STAGES`. Verify the `followUp` rendering and stage-card grid still look right with 7 stages on desktop and mobile.
- **Intake form (Phase 1 of the app plan):** Add three fields so the Build stage can branch correctly the day-of:
  - `build_archetype` enum: `service | digital | physical`
  - `existing_tools` jsonb (what they already use)
  - `delivery_format_detail` text (already partially captured — extend, don't duplicate)
- **AI prompts (Phase 3 of the app plan):** Add three Build-stage prompts (one per task), each branching on `build_archetype` so the AI assist generates the right workflow diagram, tool-stack recommendation, and delivery artifact drafts.
- **Admin/facilitator view:** Add Build to the progress grid (7 columns instead of 6).

## Conservative-promise audit for the new stage

| Activity | In-session? | Why it's safe |
|---|---|---|
| Pick archetype + draw V1 workflow | ✅ | Pure decision + diagram |
| Create free-tier accounts | ✅ | Instant, attendee-controlled |
| Draft delivery artifacts | ✅ | Drafts only, not sent to a real customer |
| Sample order from supplier | ❌ (followUp) | Requires payment + shipping |
| Paid tool subscriptions | ❌ (followUp) | Requires billing decision |
| Real end-to-end test with a buyer | ❌ (followUp) | Requires a real customer |
| Shipping a production digital build | ❌ (followUp) | Beyond 60 min |

## Out of scope (intentionally not added)

- A second "Build day" or post-workshop sprint.
- Live coding / live manufacturing in-session.
- Per-archetype certification or vendor partnerships.
- Replacing the existing Offer-stage SOP task — Offer stays focused on *what* you sell and *price*; Build owns *how you operate*.

## Open question

1. **Archetype branching depth in v1:** Should we ship Stage 4 with full per-archetype templates (3× the content for each task), or start with a shared template plus a one-page archetype-specific addendum and expand after the first cohort? Recommendation: ship the addendum approach first — faster to build, easier to iterate.

Want me to proceed with this enhancement?
