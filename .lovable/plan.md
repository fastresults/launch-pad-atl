
## What you caught

Two things wrong with my last draft:

1. **"Saturday morning" is a guess.** Cohorts can be scheduled any day. `cohort` already exposes `dateLabel` (e.g. *"Saturday, March 14, 2026"*) — I should use that or stay day-agnostic.
2. **Tone wasn't anchored to the rest of the site.** The marketing pages have an established voice I should match, not reinvent:
   - Home: *"One morning. Twenty deliverables built live for your startup — the positioning, the offer, the 90-day plan — and you walk out ready to execute on Monday."*
   - Schedule: *"One morning. Four working stages. By 11:30 AM you walk out…"*, *"Idea in at 8:45 AM. Your full plan and a signed 90-day playbook in your hands by 11:30 AM."*
   - Register: *"What you walk out with"*

The thread is: **one morning · walk out with · ready Monday**. Plain, confident, time-anchored, no day-of-week assumption, no price (they already paid).

I'm also dropping the **`$97`** I'd put in the header — marketing uses tiered pricing (`WORKSHOP_PRICE_LABEL`) and the dashboard is a post-purchase surface anyway.

## Voice rules (unchanged from last pass)

- Talk to one person (*you*, *your*).
- Plain English in the subs; doc names stay as-is because that's what you actually get.
- Confidence without bragging. One dry aside per section, max. No exclamation marks. No emoji.
- Specifics > adjectives. *"20 docs in your Drive"* beats *"comprehensive package."*

## Copy changes (copy-only, no layout)

### Page header
- **H1:** `Workshop day` → **`Your workshop morning`**
- **Sub (uses cohort context when present):**
  - With cohort: **`{cohort.dateLabel} · 8:45–11:30 AM. Show up with an idea — leave with the 20 documents that turn it into a real startup.`**
  - No cohort yet: **`One morning. Show up with an idea — leave with the 20 documents that turn it into a real startup.`**

### Hero strip
- **Eyebrow:** `AI-first multi-document workflow` → **`What you walk out with`**
- **H2:** **`Walk in with an idea. Walk out ready to execute Monday.`**
- **Body:** **`You do the thinking out loud. Your AI cofounder writes everything down — the plan, the money math, the pitch, the boring-but-important stuff. By 11:30 AM you've got 20 documents in your Drive and a really clear head.`**

### Cohort card
- Add tiny eyebrow above the date: **`You're in. Here's the where and when.`**
- Keep all date/time/address values verbatim.

### Pillars section
- **Heading:** `The framework — 5 pillars, 20 documents` → **`The 5 things every real startup needs`**
- **Sub:** **`We move through them in order. Each one feeds the next, so by the time we hit the last pillar, every document already knows your numbers, your market, and your story.`**

### Schedule section + `SCHEDULE_BLOCKS` subtitles
- **Heading:** `The morning, block by block` → **`How the morning goes`**
- **Check-in:** **`Grab coffee. Settle in. Tell us your idea in one sentence — we'll take it from there.`**
- **Foundation:** **`Lock in who you serve, what makes you worth picking, and why you'll win. 5 docs.`**
- **Strategy:** **`Your plan, your pricing, and how you get your first customers. 5 docs.`**
- **Refreshment break:** **`Stretch. Refill. Step outside for 10 minutes. Your AI keeps typing.`**
- **Operations:** **`How the business actually runs Monday morning. 4 docs.`**
- **Finance:** **`Money in, money out, and what you'll raise if you raise. 4 docs.`**
- **Governance:** **`The grown-up stuff — what could go wrong and what to tell advisors. 2 docs.`**
- **Close:** **`Hand on the door, 20 documents in your Drive. That's a wrap.`**

### What to bring
- **Heading:** `What to bring` → **`Bring four things`**
- **Items:**
  - **`Your laptop and charger. You're driving.`**
  - **`A government-issued ID — we'll use it to set up your LLC paperwork.`**
  - **`Your idea, even if it lives on a sticky note. We'll sharpen it together.`**
  - **`One question you really want answered before you leave.`**
- **Footnote:** **`Nothing to pay on the day. Any state filings happen from home afterward — we'll walk you through exactly what to click.`**

### CTAs
- Primary: `Prep my brief` → **`Start my brief`**
- Secondary: `See the full 20-document workflow` → **`Peek at all 20 documents`**

## Words deliberately killed on this page

`board-ready`, `funded company`, `strategic documents`, `multi-document workflow`, `coordinated set`, `dependencies chain`, day-of-week assumptions, `$97`, `weekend`. The footnote loses *"over the weekend"* in favor of *"afterward"* for the same reason.

## Files touched

- `src/routes/_authenticated/dashboard/day.tsx` — header (now cohort-aware), hero, cohort eyebrow, pillars, schedule heading, what-to-bring, CTAs.
- `src/lib/workshop-mode.ts` — `SCHEDULE_BLOCKS` subtitles (these also feed `RoomClock` on workshop morning, which is a bonus, not a regression).

No layout, component, data, schema, or pricing changes.
