## Goal

Two passes in one edit:
1. Reflect the new homepage "What you walk out with" items in the curriculum data that drives `/schedule`.
2. Stop overusing the word "plan." Strip the redundant trailing "plan" from item labels in BOTH `src/routes/index.tsx` (`WALKOUT_PHASES`) and `src/lib/curriculum-data.ts`.

The 90-day plan and the launch plan stage keep the word — those are literally what they are. Everything else drops it.

## Rename table (label → new label)

| Where | Old | New |
|---|---|---|
| Home Phase 2 | Operations & workflow plan | Operations & workflow |
| Home Phase 2 | Funding model & 12-month money plan | Funding model & 12-month runway |
| Home Phase 3 | Marketing & communications plan | Marketing & communications |
| Home Phase 3 | Go-to-market plan | Go-to-market |
| Home Phase 3 | Investor-ready pitch deck | *(unchanged)* |
| Home Phase 3 | Fundraising kit | *(unchanged)* |
| Home Phase 3 | Signed 90-day plan + launch-day kit | *(keep — this IS the 90-day plan)* |
| Stage 4 task | "Operationalize the workflows" → renamed to "Operations & workflow plan" in prior plan | "Operations & workflow" |
| Stage 6 task | "1-page marketing plan" → "Marketing & communications plan" | "Marketing & communications" |
| Stage 6 stage title | "Marketing plan & creatives" | "Marketing & creatives" |
| Stage 7 walkOut | "Go-to-market plan: …" | "Go-to-market: …" |
| Stage 1 task | "Funding plan & raise-ready kit" → "Funding model, pitch deck & fundraising kit" | *(unchanged from prior plan — no trailing "plan")* |

Stage titles kept as-is because they describe a working block, not a deliverable: "Launch plan" stays. "Marketing plan & creatives" → "Marketing & creatives" (the word "plan" mid-phrase reads as a deliverable label, which we're cutting).

## Edits — `src/routes/index.tsx` (`WALKOUT_PHASES`)

- Phase 2 items: rename "Operations & workflow plan" → "Operations & workflow"; "Funding model & 12-month money plan" → "Funding model & 12-month runway." Update each `desc` opening only if needed so it still reads naturally (no other copy changes).
- Phase 3 items: rename "Marketing & communications plan" → "Marketing & communications"; "Go-to-market plan" → "Go-to-market." Keep "Investor-ready pitch deck," "Fundraising kit," and "Signed 90-day plan + launch-day kit" unchanged.

## Edits — `src/lib/curriculum-data.ts`

**Stage 1 (Form) — Funding task**
- Task title: "Funding model, pitch deck & fundraising kit" (no trailing "plan").
- Extend `deliverable`, `details`, `takeaway` to call out three artifacts: (a) funding model & 12-month runway with break-even, (b) 10-slide investor-ready pitch deck in your brand (problem, solution, market, offer, traction, model, GTM, team, ask, use of funds), (c) fundraising kit — 1-page raise summary + funder outreach plan with email template + path picked across grants/microloans/SBA/F&F.
- Update Stage 1 `walkOut` lines: replace the two existing funding bullets with three matching the homepage labels (model & runway / pitch deck / fundraising kit).
- Update Stage 1 `takeHome` final clause to "…plus a funding model with 12-month runway, an investor-ready pitch deck, and a fundraising kit ready to send."

**Stage 2 (Customer) — Competitor task**
- Task title: "Competitive research pack".
- Tighten `deliverable`/`takeaway` to "Competitive research pack — 3 competitors compared on offer, price, and positioning, with sourced customer quotes and a one-page 'what makes you different' summary."
- Replace `walkOut` entry "3-competitor grid + your one-sentence positioning" with the new phrasing.

**Stage 4 (Build) — Ops task**
- Task title: "Operations & workflow" (drop trailing "plan").
- Extend `deliverable` and `details` to add "one-page weekly operating rhythm" alongside the 3 SOPs.
- Replace `walkOut` entry "3 written SOPs… loaded into your project hub as runnable templates" with "Operations & workflow: 3 runnable SOPs (intake, fulfillment, onboarding) in your project hub plus a one-page weekly operating rhythm."

**Stage 6 (Marketing) — Plan task + stage title**
- Stage title: "Marketing plan & creatives" → "Marketing & creatives" (covers stays unchanged).
- Task title: "1-page marketing plan" → "Marketing & communications".
- Extend `deliverable`/`details` to include messaging pillars alongside audience, channels, calendar, KPIs.
- Update Stage 6 `walkOut` entry to "Marketing & communications: audience, channels, messaging pillars, 30-day content calendar, weekly budget, 3 weekly KPIs."

**Stage 7 (Launch) — GTM**
- Add new `walkOut` line near the top: "Go-to-market: target segment, offer, pricing, channel mix, week-by-week tactics, and KPIs that prove it's working."
- Add a brief bullet inside the "Sign your 90-day plan" task `details`: "Lock the go-to-market: target segment, offer, pricing, channel mix, and week-by-week tactics feeding the 30/60/90."
- Update Stage 7 `takeHome` opening clause to mention GTM: "Your signed, dated 90-day plan with a go-to-market feeding it…"

## Scan rule applied across both files

Any new/edited label of the form `<deliverable name> plan` becomes `<deliverable name>`, except:
- "30/60/90 plan", "90-day plan", "launch plan," "Launch plan" stage title — these stay.
- Existing labels we didn't touch in this round (e.g., the existing "30-day marketing plan" string when it appears inside a description sentence) stay only if rewording would change meaning beyond a label.

## Out of scope

- No changes to `SCHEDULE` times or breaks in `src/lib/schedule-data.ts`.
- No changes to `/schedule` route layout.
- No edits to `walkIn`, value grid, pricing, or styling.
- No new tasks or stages. No reordering.
