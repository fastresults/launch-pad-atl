## Goal
Replace the abstract "framework" labels from the prior plan with the **real productized AI Generator names** from your catalog. Each of the 21 workshop tasks gets a named take-home artifact attributed to the specific Generator that produces it in the room. The full 20-generator catalog is also surfaced on the home page (grouped in your 3 phases — Foundation / Strategy / Launch) so prospects see the underlying AI product, not just the day's schedule.

## Mapping — 20 Generators → 21 workshop tasks
Some Generators power multiple artifacts (one Generator = one productized surface, several outputs). Three Generators (Business Plan, Financial Projections, Funding Strategy) are post-launch / fundraising tools and don't fit the one-day workshop arc — they live in the catalog section on the home page as "after the workshop" scale tools.

**Stage 1 — Form** · *Powered by Legal Checklist Generator*
- 1.1 → GA LLC Entity Pack — entity decision tree + filing-ready Articles of Organization *(Legal Checklist Generator)*
- 1.2 → EIN & Banking Setup — EIN application queued + business-bank shortlist *(Legal Checklist Generator)*
- 1.3 → Contract Pack — signed Terms, Privacy Policy, Master Service Agreement *(Legal Checklist Generator)*

**Stage 2 — Customer & market** · *Powered by Customer Research, Market Analysis, Competitive Analysis Generators*
- 2.1 → Ideal Customer Profile (ICP) — 1-page profile: demographics, jobs-to-be-done, willingness-to-pay *(Customer Research Generator)*
- 2.2 → Market Sizing + Validation Script — TAM/SAM/SOM snapshot + Mom-Test-style interview script *(Market Analysis Generator)*
- 2.3 → Competitive Positioning Matrix — 3-competitor grid + 1-sentence differentiation statement *(Competitive Analysis Generator)*

**Stage 3 — Offer & product** · *Powered by Concept Brief, Product Development, Pricing & Packaging Generators*
- 3.1 → Concept Brief — one-sentence value proposition + startup DNA card *(Concept Brief Generator)*
- 3.2 → MVP Scope & Service Blueprint — first-version deliverable mapped from sale to handoff *(Product Development Generator)*
- 3.3 → Pricing & Margin Model — pricing sheet + exact break-even number *(Pricing & Packaging Generator)*

**Stage 4 — Build the working version** · *Powered by Business Model Canvas, Operations Plan Generators*
- 4.1 → Business Model Canvas — chosen build type + 9-block canvas *(Business Model Canvas Generator)*
- 4.2 → Operations Stack — free-app accounts provisioned and mapped to the canvas *(Operations Plan Generator)*
- 4.3 → Delivery Rehearsal — first customer's deliverable drafted and rehearsed end-to-end *(Operations Plan Generator)*

**Stage 5 — Brand & website** · *Powered by Brand Builder, Vision & Mission, Website Copy, Operations Plan Generators*
- 5.1 → Brand Identity + Vision/Mission — logo, palette, fonts, claimed domain + one-line vision and mission anchoring the brand *(Brand Builder Generator + Vision & Mission Generator)*
- 5.2 → Website Copy Pack — Home, Offer, About, Contact drafted directly in your site builder *(Website Copy Generator)*
- 5.3 → RevOps Stack — Stripe, email-on-domain, analytics application checklists complete *(Operations Plan Generator)*

**Stage 6 — Marketing plan & creatives** · *Powered by Marketing Strategy, Social Launch Generators*
- 6.1 → Messaging House — headline, 3 value props, 30-second pitch, founder bio *(Marketing Strategy Generator)*
- 6.2 → Launch Creative Kit — business card + flyer + 6 on-brand post drafts + 60-second video script *(Social Launch Generator)*
- 6.3 → 30-Day GTM Plan — channel calendar + budget + 3 weekly KPIs *(Marketing Strategy Generator)*

**Stage 7 — Launch plan** · *Powered by Launch Plan, Sales Strategy, Growth Hacking Generators*
- 7.1 → 30/60/90 Launch Roadmap — signed dated plan: first 3 paying customers → 10 → repeatable channel *(Launch Plan Generator)*
- 7.2 → Launch Sequence Playbook — launch-day checklist + 5 outreach drafts ready to send *(Sales Strategy Generator)*
- 7.3 → Sales Pipeline + Growth Loop — starter CRM populated, first repeatable acquisition loop, accountability partner on the calendar *(Sales Strategy Generator + Growth Hacking Generator)*

**Not surfaced in the workshop hour-by-hour** (live in the home-page catalog as the "Scale toolkit — for after the workshop"):
- Business Plan Generator — investor-grade frameworks
- Financial Projections Generator — forecasts for investors
- Funding Strategy Generator — capital strategy

## Edits

### 1. Data — `src/lib/curriculum-data.ts`
- Add `takeaway?: string` to `Task` type. Populate on all 21 tasks with the strings above, formatted as: `"[Artifact] — [format] · [Generator(s)]"`. Generator attribution goes after a middot so it can render as a chip.
- Add `generators?: string[]` to `Stage`. Populate per stage with the Generator names listed above.
- Leave `deliverable`, `tool`, `details`, `followUp`, and stage-level `takeHome` unchanged.

### 2. UI — `src/routes/schedule.tsx`
- **Per stage card header**: under the Stage title, add a single line `Powered by · [Generator chip] [Generator chip] …` using the existing chip style (`rounded-full bg-white/5 px-2.5 py-0.5 text-[11px]`).
- **Per task**: between the deliverable + tool row and the detail bullets, render the take-home strip:
  ```
  TAKE-HOME · Ideal Customer Profile (ICP) — 1-page profile · [Customer Research Generator]
  ```
  Container: `mt-2 rounded-md border-l-2 border-hero-gradient bg-white/[0.03] px-3 py-2`. Eyebrow: `text-[10px] uppercase tracking-[0.22em] text-muted-foreground`. Body: `text-[13px] font-medium leading-snug text-foreground/90` with the artifact name in `text-foreground`. The trailing generator name renders as a small inline chip.
- The existing italic `followUp` block (Take home: homework action) stays directly beneath, unchanged.

### 3. New section on `/` — "Your AI Toolkit · 20 Generators"
Add a new section between the existing `FlowStrip` and `WhatYouLeaveWith` (or wherever flows best — placement to be confirmed in implementation). Three grouped cards mirroring your phase structure:

- **Phase 1 · Build Your Unshakeable Foundation** (5 generators)
- **Phase 2 · Craft Your Winning Strategy** (5 generators)
- **Phase 3 · Launch With Professional Power** (10 generators)

Each phase card lists its Generators with the one-line description from your message. Visual style matches the existing `FlowStrip` cards: `rounded-2xl border border-white/10 bg-card p-6`, small "PHASE N" eyebrow, phase title, intro sentence, then a tight 2-column list of Generators with name + 1-line description. Generators that appear in the workshop get a subtle "→ in the workshop" tag; the 3 Scale generators get "→ after the workshop." No new colors, no new tokens.

Section heading: "Twenty AI generators. One day to use them in the same room with the operator."

## What stays the same
- 7-stage hour-by-hour schedule, all existing task titles, deliverables, tools, details, followUp lines.
- Stage-level `takeHome` lines (the AI-process-driven suite outputs).
- All navigation, anchors, tokens, components.

## Verification
- `rg -n "takeaway:" src/lib/curriculum-data.ts` shows 21 entries; `rg -n "generators:" src/lib/curriculum-data.ts` shows 7.
- `/schedule`: each stage card header shows Generator chips; each of the 21 tasks shows a TAKE-HOME strip with the artifact name and its Generator chip.
- `/`: new "Your AI Toolkit" section lists all 20 Generators grouped under the 3 phases, with workshop vs. scale tagging.
- Mobile: take-home strip wraps cleanly; phase cards stack 1-column.
