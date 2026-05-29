## What changes from the last plan

Strip every dollar amount, market-value pill, value-math tile, and price-vs-cost line. The section is purely about the finished work each registrant carries home. No `VALUE_ROWS` dollar values rendered, no `VALUE_TOTALS`, no `PRICING`. The deliverable names still come from real data so the list can't drift from `/schedule`.

## The move

**Delete** `WalkInWalkOut` (lines 419–490 in `src/routes/index.tsx`) and its mount on line 39.
**Add** `WhatYouLeaveWith` directly after `<FlowStrip />`.

New page order:
```
Hero → NotACourseBanner → TheArtOfThePossible → FlowStrip → WhatYouLeaveWith → AIToolkit → ValueByTheNumbers → …
```

`ValueByTheNumbers` keeps doing the dollar-math job lower on the page; this new section stays clean.

## Section structure — `WhatYouLeaveWith`

**Eyebrow:** `4:30 PM — what's in your hands`
**Headline:** `Seventeen finished pieces of a real business. Not homework. Not notes.`
**Sub (8th-grade, no money talk):** `You walk in with an idea. You walk out with the work — every piece below, saved in a folder named after your business, ready to use Monday morning.`

### Seven stage cards — one per `STAGES[n]`, in order

Each card renders:

- **Header:** stage number chip + plain-English stage title.
- **One-sentence plain promise.**
- **Numbered deliverable list** — every `VALUE_ROWS` row for that `stageN`, rendered as `1. {plainLabel}`. No dollar column, no value pill.

### Full content (all 17 deliverables, plain-English)

**Stage 1 — Make it a real business**
*Your business is legally formed and ready to take money.*
1. Your Georgia LLC paperwork, filled in with your business name
2. Your EIN tax number, in your inbox before lunch
3. Your Terms, Privacy Policy, and customer agreement, written for your business
4. A short list of business banks and the steps to open your local license and sales-tax account

**Stage 2 — Find your first paying customer**
*You walk out knowing exactly who buys from you first and you have 25 names to message tonight.*
1. A one-page picture of your first customer, what their problem costs them, and 25 real names to reach out to
2. The message to send them, written for you, plus a quick look at 3 competitors and what makes you different

**Stage 3 — Lock your offer**
*What you sell, how you deliver it, and what it costs — on one page.*
1. Your offer in one sentence, your step-by-step scope of work, and a price built from your real costs

**Stage 4 — Build the first working version**
*Your business has wheels — apps set up, delivery rehearsed, before any real customer shows up.*
1. A map of how a sale becomes a happy customer and the free apps you'll use at each step, set up in your name
2. Your first customer's deliverable drafted and a 5-point checklist you run before anything goes out the door

**Stage 5 — Brand and website**
*A logo, brand colors, and a four-page website ready to publish today.*
1. Your logo, four brand colors, and a font pair, made from your business name
2. A four-page website (Home, Offer, About, Contact) written in your voice and ready to publish
3. Payments (Stripe or Square), business email, and Google Analytics all set up and queued for one click

**Stage 6 — Print and post**
*A full launch kit — print, social, and a 30-day plan you can actually follow.*
1. Your headline, three reasons to buy, a 30-second pitch, and a 100-word founder bio
2. A printable business card and a one-page flyer, designed in your brand
3. Six social posts, a 60-second video script, and a 30-day plan with three numbers to watch each week

**Stage 7 — Ninety-day launch plan**
*A dated, signed plan to get your first 3 customers, then 10, then a steady stream.*
1. Your signed 30/60/90 plan, your announcement list, and ten personal outreach messages already written
2. Your launch-day timeline, a starter CRM seeded with your list, three weekly numbers, and an accountability partner with check-ins on the calendar

### Closing line (full-width band under the 7 cards)

A single quiet line, centered, no pricing:
**`Seventeen finished pieces. One day. Built by you, with the person who's done it before sitting next to you.`**

## Visual treatment

- 7 stage cards in `md:grid-cols-2 xl:grid-cols-3`. Use `flex flex-col` so cards align cleanly even with different list lengths.
- Card chrome: `rounded-2xl border border-white/10 bg-card p-6`. Stage chip reuses FlowStrip's gradient pill so this section feels like the same chapter.
- Deliverable list: ordered list, hairline dividers (`divide-y divide-white/5`), each row a single left-aligned line — no right-side value column.
- Closing band: full-width card spanning all columns, gradient text on the headline phrase, muted underline rule.
- Section wash: `bg-hero-gradient opacity-[0.05]` to close the FlowStrip chapter visually.

## Files

- `src/routes/index.tsx`
  - Remove `WalkInWalkOut` (lines 419–490) and its render on line 39.
  - Add `WhatYouLeaveWith`, mounted right after `<FlowStrip />` (line 41).
  - Imports added: `STAGES` from `@/lib/curriculum-data`; `VALUE_ROWS` from `@/lib/value-grid` (used only to enumerate deliverables per stage — `costMin`/`costMax` are not read or rendered).
  - Plain-English copy lives in a `STAGE_COPY` constant inside the file, keyed by `stageN` and aligned by index to `VALUE_ROWS` filtered per stage.

## Out of scope

- No edits to `FlowStrip`, `ValueByTheNumbers`, `/schedule`, curriculum data, or value-grid data.
- No new assets, icons, or animations.
- No dollar figures or pricing language anywhere in this section.