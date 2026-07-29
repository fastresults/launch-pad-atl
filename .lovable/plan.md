## What I missed

The earlier sweeps hit the hero, the four-foundations blocks, and the chatbot — but not the `HonestRoadmap` section, where the claims live in a plain string array. Confirmed still overpromising in two files:

- `src/components/home/HomeFramework.tsx` lines 386–391, 402, 406
- `src/components/landing/LandingFramework.tsx` lines 406–411, 422, 426

Offending strings (identical in both):
- "A live landing page at your domain — real URL, up before lunch, not a mockup" (page is not built in the room)
- "A priced offer on the page — ready to accept your first customer" (nothing is on a live page)
- "A 90-day go-to-market plan — personas + outreach sequence you can send this week" (violates the no-"plan"/no-"roadmap" rule)
- "Brand v0 — name, mark, and voice you can actually use Monday morning" ("mark" implies a designed logo)
- H2: "Two weeks to your first dollar." (promises revenue)
- Body paragraph: "plus the exact message and the named person it goes to" — fine as *written*, but sits next to live-page claims

## The fix

### 1. Rewrite the six included items (both files, identical copy)

```
"Your brand written — name, voice, and the words you lead with"
"Your one offer, priced — what it is, who it's for, what it costs"
"Your page copy, written line by line — headline, proof, and call to action, ready to build"
"Your Foundation on the dashboard — positioning, ICP, and wedge, sharpened with staff"
"Your first outreach written — the message and the named person it goes to"
"A seat next to Adam and <N> other founders — coffee, snacks, and a room building alongside you"
```
Keep the existing seat counts as-is: 19 on Home, 2 on Landing.

### 2. Retitle the section header

- Home eyebrow stays "Here's the honest promise"
- H2 becomes: **"One morning of writing. The four foundations your startup runs on."** with the gradient span on "The four foundations your startup runs on."
- Home block label: "What $197 gets you — written in the room" (keeps `WORKSHOP_PRICE_LABEL`)
- Landing block label: "What one morning gets you — written in the room" (Landing is the free offer; no price)

### 3. Tighten the lead paragraph (both files)

Replace the closing sentence so the artifact is the writing, not a shipped site: "…In one morning we write the foundation underneath it: the brand, the priced offer, the page copy, and the way the money comes in — plus the exact first message and the named person it goes to. The building happens that same week, on top of what we wrote — not instead of it."

### 4. Also correct the "Once you have your first customer" paragraph

Both files, line 455 / 475: "done before lunch" on the eight follow-on mornings implies build-in-room again. Change to "One piece at a time, done together, with our team building it out after." Keep the eyebrow.

## Out of scope unless you say otherwise

`src/routes/build.tsx` ("Live by lunch", "your website live") is the paid Build sprint page, a different offer where things genuinely do get built. I'll leave it unless you confirm those sprints also only produce written work.

`public/adam-funnel-v1.md` line 169 has the same "Live page" overclaim in the generated report. I'll leave the archived report alone unless you want it regenerated.
