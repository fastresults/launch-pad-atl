
## Goal

Close the gaps you flagged — website, social media, marketing plan, competitive analysis, launch plan — without adding a 7th stage (we'd blow the 6-hour budget). Instead, **sharpen the 3 tasks inside each stage** so every gap has a named owner, a concrete deliverable, and time on the agenda.

## Gap audit (current → fix)

| Topic | Today | Fix |
|---|---|---|
| Competitive analysis | Squeezed into "Size the market & map 3 competitors" (half a task) | Promote to its **own** Stage 2 task: 3-row grid + positioning gap |
| Website setup | One task ("Publish a one-page sales site"), light on specifics | Expand deliverable: pages (Home, Offer, About, Contact), mobile pass, on-page SEO basics, lead form |
| Social media | One line inside "Sales assets pack" | Promote to its **own** Stage 5 task: claim handles, profile copy, banner, 2-week content cadence |
| Marketing plan | Implicit across stages, no single artifact | New Stage 5 task: **1-page marketing plan** (channels, budget, 30-day calendar, KPIs) |
| Launch plan | Already Stage 6 — keep | Add launch-day checklist + announcement list (press, partners, network) |
| Other gaps closed | — | Legal basics (T&Cs / privacy / contract template) added to Stage 1; analytics/KPIs explicit in Stage 4; sales pipeline / CRM seed in Stage 6 |

## Re-shaped curriculum (still 6 stages, ~6 hrs)

**Stage 1 — Form the business (60 min)**
1. Choose structure & register the GA LLC
2. EIN + business bank account
3. Compliance & legal kit — registered agent, GA license, sales tax, **T&Cs + privacy policy + 1-page service agreement**, bookkeeping

**Stage 2 — Customer & market (60 min)**
1. Beachhead customer profile + top-3 pains (with $ figures)
2. Market size + 5-call demand test
3. **Competitive analysis** — 3-competitor grid (offer, price, channel, weakness) + your positioning gap

**Stage 3 — Offer & product (60 min)** *(unchanged)*
1. One-sentence offer
2. V1 scope + fulfillment SOP
3. Pricing, margin, break-even

**Stage 4 — Brand & website (75 min)**
1. Name, domain, brand kit (logo, colors, type)
2. **Website build** — Home / Offer / About / Contact, mobile pass, on-page SEO (title, meta, H1, alt), lead form
3. Wire email, payments, analytics — test lead + test $1 transaction + GA4/Plausible event

**Stage 5 — Marketing plan & materials (60 min, +15)**
1. Messaging kit — headline, 3 value props, 30-sec pitch, bio
2. **Social media kit** — claim handles, profile copy + banner, 2-week content cadence (3 posts/wk), 1 video script
3. **1-page marketing plan** — top-2 channels, weekly budget, 30-day content & outreach calendar, 3 KPIs

**Stage 6 — Launch plan (45 min, +15)**
1. 30 / 60 / 90 plan (first 3 → 10 → repeatable channel) — signed PDF
2. **Launch-day checklist + announcement list** — 25-name list, 10 outreach drafts, press/partner asks, day-of timeline
3. Sales pipeline + accountability — CRM seeded, 3 weekly metrics, 4 check-ins booked

Total: ~6 hrs + breaks. Stage 5 grows 15 min (the marketing plan deserves it), Stage 6 grows 15 min, Stage 4 holds at 75 min.

## Technical plan

- `src/lib/curriculum-data.ts`
  - Extend `Task` with `details: string[]` (3–5 concrete bullets — the "how" inside each task).
  - Rewrite the 6 stages per the table above; update `duration` for stages 5 and 6.
- `src/lib/schedule-data.ts` — re-derive session blocks from the new durations so the timeline stays in sync.
- `src/routes/schedule.tsx` — render `task.details` as a compact bulleted sub-list under each task; add a small "Also covered" chip-row per stage listing the gap topics it closes (e.g. *Competitive analysis*, *SEO basics*, *Social cadence*).
- `src/routes/index.tsx` — no structural change; refresh the FlowStrip blurb for Stage 5 to "Marketing plan & assets".

## Out of scope (Phase 2)

- A standalone `/curriculum` page or printable workbook
- Funding / investor track, full legal contract library, paid-ads playbook
- Per-attendee task checklists with progress tracking

## Open questions

1. **Marketing plan depth** — keep it as a 1-page artifact (channels + calendar + KPIs), or go deeper into paid vs organic budget allocation? (Deeper = trim Stage 3 by 15 min.)
2. **Social platforms** — default to Instagram + LinkedIn + one of (TikTok / YouTube / X), or let each attendee pick their 3 during the session?
