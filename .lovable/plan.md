
# Reimagine the Founder Roadmap

The current roadmap reads like a checklist for a strategy partner — terse bullets, tables, and acronyms. For a founder leaving the workshop, it needs to feel like the **single document they'd hand to their co-founder, their spouse, an angel, or a VC** and have it land. That means narrative voice, momentum, encouragement grounded in their actual artifacts, and a much bigger sense of "look what you've built and where it goes."

This plan changes the **prompt + structure + presentation** of the roadmap. No new feature surface, no new buttons, no schema changes.

---

## What changes for the user

When they click **Open Founder Roadmap**:

- The dialog opens with a **cover** — venture name, tagline pulled from value-prop, a one-line verdict ("You are 72% of the way to a fundable seed story"), and a quick stat strip (documents synthesized, hours of work represented, addressable market, target ICP, recommended first-year revenue).
- The body reads like a **narrative founder playbook**, not a strategy memo: warm, confident, second-person ("Here is what you've built…"), with named ICPs, real prices, real channels, real numbers from their kit woven into prose.
- Sections feel like **chapters** rather than headers — each opens with a 2–3 sentence narrative lead-in before any list or table.
- New emotional spine: **What you've built → Why it can win → The fight ahead → Your first 45 days → Your year → How to talk about this → The one thing.**
- Designed to be printable and handed to an investor — investor-ready language, no "AI-ese," no doc-by-doc rehash, no jargon dumps.

---

## New roadmap structure (rewritten system prompt)

The H1 stays `# Your Founder Roadmap`, then:

1. **Cover & Verdict** — one paragraph that names the venture, what it is in one sentence, the founder by name, and a confident-but-honest verdict ("You are closer than you think, and here's why.").
2. **The Stat Strip** — small markdown table the dialog renders as a hero band: # of artifacts synthesized, market size, target ICP, recommended Year-1 revenue, recommended raise size, breakeven month.
3. **Chapter 1 — What You've Built** — narrative synthesis of the workshop's output: the concept in plain English, the wedge, the ICP as a human story, the pricing logic, the GTM motion. Written as prose, not bullets. Ends with a 1-line "Why this matters."
4. **Chapter 2 — Why This Can Win** — the strategic case, written as if pitching the founder back to themselves. 3 narrative reasons, each anchored to a specific deliverable, each ending with a named proof point.
5. **Chapter 3 — The Honest Fight Ahead** — the real risks, framed as challenges with named mitigations already in the kit. Encouraging tone: every risk paired with the deliverable that addresses it. No fear-mongering.
6. **Chapter 4 — Your First 45 Days** — narrative sprint plan. Each horizon (Days 1–7 / 8–21 / 22–35 / 36–45) opens with a 1-paragraph theme ("This is your validation fortnight…") followed by 3–5 specific actions with owner, dependency, success metric, and which deliverable to pull from. Ends with **"By Day 45, you will have…"** — a confident, bolded outcomes list.
7. **Chapter 5 — Your First Year** — month-by-month, but grouped into 3 named phases ("Validate," "Build," "Compound") each with a paragraph of narrative before the month list. Picks up exactly from Day-45 exit criteria. Each month: theme · 2-3 outcomes · KPI to watch · which deliverable powers it.
8. **Chapter 6 — Money & Runway, In Plain English** — narrative version of financial reality: starting cash, monthly burn, breakeven month, funding gap, recommended raise size and timing — written as a paragraph a non-finance partner could read, then a tiny supporting table.
9. **Chapter 7 — How to Talk About This** — the founder's communication kit: a 60-second pitch (verbatim, ready to read aloud), a 1-paragraph version for email, the 3 numbers to memorize, and the 3 questions an investor will ask with suggested answers anchored in the kit. This is the section that makes the doc shareable with VCs.
10. **Chapter 8 — Your Operating Cadence** — weekly / monthly / quarterly rituals tailored to track and stage, written as habits not bullets.
11. **Chapter 9 — Read Next** — the 5 most important documents from their kit to read first, each with a 1-line "why now."
12. **The One Thing** — closing blockquote callout. A single move for the next 30 days that will most change their odds. Encouraging, specific, named.
13. **Closing Note to the Founder** — 3-sentence personal-tone sign-off by name, acknowledging the work they did in the workshop and setting them moving.

Final line still emits `QUALITY_SCORE: <0-100>` for the meta strip.

### Tone rules added to the prompt
- Second person, warm, confident, never patronizing. No "you should." Use "you can," "you've already," "your next move is."
- Every chapter opens with prose. Bullets/tables support prose, never replace it.
- Use the founder's first name in Chapter 1 lead and the closing note.
- Use the company name verbatim throughout.
- Cite real numbers, real prices, real channels, real ICP names from the kit. Never generic.
- No "AI-ese": no "leverage synergies," no "in today's fast-paced landscape," no "robust solution."
- Investor-readable: a stranger should be able to read it and understand the business in 10 minutes.

---

## Dialog presentation upgrades

The dialog stays the same component (`FounderRoadmapDialog.tsx`) — minor visual additions only, no new routes:

- **Hero cover band** at the top of the scroll area: large venture name, tagline, verdict line, and the stat-strip chips (parsed from the first H2 "Stat Strip" table — rendered as colored chips, then that source table is hidden so it isn't duplicated).
- **Chapter typography**: H2s render with a small "Chapter N" eyebrow label above them, a thin accent rule, and more generous top spacing. Feels like a book/report, not a memo.
- **Reading meta strip** under the cover: "≈ N min read · N words · Synthesized from N documents · Generated <date>" — pulled from the existing word count + a count of completed docs passed in (already available via the parent route; pass `documentCount` as a new optional prop).
- **Export bar** stays where it is. The DOCX/print stylesheet gets the same chapter-eyebrow + accent treatment so the printed PDF and the .docx look like a real workshop deliverable, not a markdown dump.
- **Sidebar nav** keeps the H2 jump list but labels become "Ch. 1 — What You've Built," etc.

No new dependencies. All purely presentational, parsed from the same markdown the edge function returns.

---

## Files touched

- `supabase/functions/venture-generate-roadmap/index.ts`
  - Replace `SYSTEM_PROMPT` with the new chapter-based, narrative-first prompt and tone rules above.
  - Add a small instruction to emit the **Stat Strip** as the first H2 with a specific 2-column markdown table the UI can parse (`| Metric | Value |`).
  - Keep model, budget, context bundle, citation stripping, and quality-score parsing unchanged.
- `src/components/hub/FounderRoadmapDialog.tsx`
  - Add cover band + stat-strip chip rendering (parse the first H2 "Stat Strip" table, then strip it from the rendered markdown).
  - Add "Chapter N" eyebrow label to H2 headings (skip for "Stat Strip" and the closing "The One Thing"/"Closing Note").
  - Add `documentCount?: number` prop and render the reading meta line.
  - Tighten print CSS to mirror the new typography.
- `src/components/hub/FounderRoadmapCard.tsx`
  - Pass `documentCount` (already known from the hub's completed-docs list) into the dialog.
  - Tiny copy refresh on the empty-state card to set expectations ("A narrative founder playbook synthesized from your entire workshop — designed to share with co-founders and investors.") — no layout change.

No DB migration. No new edge function. No new component files. No new routes.

---

## Verification

1. On a snapshot with a completed kit, click **Generate** → wait for `complete`.
2. Open the dialog and confirm: cover band renders with venture name + verdict, stat-strip chips appear (and the source table is not duplicated below), chapters have eyebrow labels, prose lead-ins precede every list/table.
3. Spot-check Chapter 1, 4, 7 for: founder's first name used, real ICP name, real prices, no generic phrases, no doc-by-doc rehash.
4. Confirm 45-day "By Day 45, you will have…" exit list flows directly into Chapter 5 Month 2.
5. Export to `.docx` and Print → confirm both render the chapter typography cleanly.
6. Regenerate → new content replaces old.

---

## Out of scope

- No new schema columns, no new tables.
- No new "share with investor" link/feature — the doc itself is the artifact.
- No live editing or feedback-driven regeneration.
- No PDF generation server-side (browser Print remains the path).
