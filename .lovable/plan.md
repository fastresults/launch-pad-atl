# Practical 6-hour curriculum — Idea → Formed Business → Launch Plan

Reframe the day around what a 20-year business development expert would actually run: **business formation is the foundation**, and **a written launch plan is the exit deliverable**. Everything in between — customer, market, product, brand, marketing — is sequenced so each hour produces an asset the next hour builds on.

By 4:00 PM every attendee leaves with: a **legally formed business**, a **validated offer**, a **live web presence**, a **set of marketing materials**, and a **dated 30/60/90 launch plan**.

## The six stages, re-sequenced

```text
1. Form         the business        (legal foundation)
2. Customer     & market            (who + proof there's demand)
3. Offer        & product           (what you sell + how it's delivered)
4. Brand        & web presence      (identity + a place customers land)
5. Marketing    materials           (the assets that do the selling)
6. Launch       plan                (the dated, executable 30/60/90)
```

## Working time = 6 hours (360 min)

Adjusted schedule, breaks excluded from the 6 working hours:

```text
 9:00  Check-in & kickoff                30 min
 9:30  Stage 1 — Form the business       60 min   ← foundation
10:30  Stage 2 — Customer & market       60 min
11:30  Lunch                             45 min
12:15  Stage 3 — Offer & product         60 min
 1:15  Stage 4 — Brand & web presence    75 min
 2:30  Coffee reset                      15 min
 2:45  Stage 5 — Marketing materials     45 min
 3:30  Stage 6 — Launch plan             30 min
 4:00  Close — signed launch plan in hand
```

## Curriculum — 6 stages × 3 essential tasks

### Stage 1 — Form the business (60 min)
*The foundation. You leave this hour with a real legal entity you can sell from.*
1. **Choose structure + register the entity** — LLC (default) vs sole prop vs S-corp; file Georgia LLC online during the session. *Deliverable:* Articles of Organization submitted. *Tool:* GA Secretary of State filing walk-through.
2. **Get your EIN and open the bank account** — IRS EIN online (5 min), then open a business checking account with a partner bank. *Deliverable:* EIN issued + bank application started. *Tool:* IRS EIN portal + business banking checklist.
3. **Lock the compliance basics** — Registered agent, GA business license / county occupational tax, sales-tax registration if applicable, simple bookkeeping account. *Deliverable:* compliance checklist signed off. *Tool:* GA compliance checklist.

### Stage 2 — Customer & market (60 min)
*Who you serve, what they'll pay for, and proof the market is real.*
1. **Pick one beachhead customer** — Define one specific customer (role, context, geography, budget) — not three. *Deliverable:* one-page customer profile. *Tool:* customer profile worksheet.
2. **Name the top-3 pains + willingness to pay** — Pull from real conversations or 5 quick calls/DMs during the session. *Deliverable:* pain list + a dollar figure they'd pay to remove it. *Tool:* validation script + 5-call sprint.
3. **Size the market and map 3 competitors** — TAM/SAM in one paragraph, plus a 3-row competitor grid (what they do, price, gap you fill). *Deliverable:* market & competitor one-pager. *Tool:* market snapshot template.

### Stage 3 — Offer & product (60 min)
*What you actually sell, how it's delivered, and the price tag.*
1. **Write the offer in one sentence** — "[Product] helps [customer] get [outcome] in [timeframe] for [price], unlike [alternative]." *Deliverable:* signed-off offer sentence. *Tool:* offer-builder template.
2. **Define the V1 deliverable + fulfillment** — What does the customer literally receive? Who does the work? What's the SOP for fulfilling the first 10? *Deliverable:* V1 scope + 1-page SOP. *Tool:* MVP scope canvas + fulfillment SOP.
3. **Set price, margin, and payment terms** — Price, cost to deliver, gross margin, deposit terms, refund policy. *Deliverable:* completed pricing sheet + break-even units. *Tool:* pricing & margin calculator.

### Stage 4 — Brand & web presence (75 min)
*Identity + the digital storefront customers will judge you on.*
1. **Name, domain, basic brand kit** — Name passes trademark + .com check, domain purchased, logo / colors / typography generated. *Deliverable:* live domain + brand kit folder. *Tool:* domain check + AI brand kit.
2. **Publish a one-page sales site** — Hero, problem, offer, proof, pricing, CTA, FAQ — using your real offer sentence from Stage 3. *Deliverable:* published URL. *Tool:* landing page builder.
3. **Wire the basics: email, capture, payments, analytics** — Business email at your domain, lead form to inbox, Stripe/PayPal pay link, analytics installed and tested. *Deliverable:* test lead + test $1 transaction confirmed. *Tool:* essentials setup checklist.

### Stage 5 — Marketing materials (45 min)
*The assets that do the selling when you're not in the room.*
1. **Core messaging kit** — Headline, sub-headline, 3 value props, elevator pitch (30 sec), one-line bio. *Deliverable:* messaging one-pager. *Tool:* messaging kit template.
2. **Sales assets pack** — One-page PDF sell-sheet, social profile copy (LinkedIn / IG / Google Business Profile), email signature, business card design. *Deliverable:* zipped assets folder. *Tool:* sales asset templates.
3. **Outreach + content starter kit** — 5 outreach DMs/emails, 3 ready-to-post social posts, 1 intro video script. *Deliverable:* content folder ready to send Monday. *Tool:* outreach + content templates.

### Stage 6 — Launch plan (30 min)
*The dated, executable plan you leave the building with.*
1. **The 30/60/90 launch plan** — Day 1–30: get first 3 paying customers. Day 31–60: get to 10. Day 61–90: install one repeatable channel. Each week has one outcome and one owner: you. *Deliverable:* signed 30/60/90 PDF. *Tool:* launch plan template.
2. **First-week action board** — The exact 10 actions for the next 7 days — outreach sent, posts published, calls booked — with dates. *Deliverable:* week-1 action board. *Tool:* week-1 board.
3. **Accountability + metrics check-in** — Pair with another attendee, lock 4 weekly 20-min check-ins, define the 3 weekly metrics you'll report (revenue, leads, conversations). *Deliverable:* calendar invites sent + metrics sheet live. *Tool:* accountability pairing + weekly metrics sheet.

## What changes on the site

**Stage names + order rewritten** (replaces `FLOW_STAGES` and `SCHEDULE` in `src/lib/schedule-data.ts`):

```text
1 form  →  2 customer  →  3 offer  →  4 brand  →  5 marketing  →  6 launch
```

**New curriculum module** as the single source of truth for stage content:

```text
src/lib/curriculum-data.ts
  STAGES: [{ n, slug, title, summary, duration, tasks: [{title, deliverable, tool}] }]
```

`schedule-data.ts` re-exports session timing and pulls title/tasks from `curriculum-data.ts` so the Home flow strip and Schedule timeline never drift apart.

**Home page** — `FlowStrip` updated to the new six stage names with one-line summaries; each card deep-links to `/schedule#stage-N`.

**Schedule page** — each stage card gets a "3 essential tasks" sub-block (title + deliverable + tool chip) rendered from the curriculum module. Stage anchors added.

**Hero copy** — tightened to the new exit promise:
> *"Walk in with an idea. Walk out with a formed business and a 30/60/90 launch plan."*

**Out of scope for this iteration:** dedicated `/curriculum` page, downloadable workbook PDFs, per-task checklists, facilitator script. We can add those in Phase 2 once the curriculum copy is approved.

## Open questions (defaulting unless you say otherwise)

1. **Legal/banking specifics** — name the partner bank and registered agent we recommend, or keep it generic? *Default: generic; attendees pick during the session.*
2. **Surface for the tasks** — render under each Schedule card (one canonical view), or build a separate `/curriculum` page? *Default: inline on Schedule.*
