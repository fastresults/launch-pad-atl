# Venture Timeline — a sliding, panning launch cadence

A hallmark visual: one horizontal track that runs from **Day 0 (the idea)** to **Day 180 (a full quarter past launch, cash flowing)**, showing the exact sequence of steps, who on a three-person team owns each, and how long it realistically takes for *this* venture — generated from the Second Brain, not a generic template.

## What the user sees

A full-width, dark cinematic band at the top of the venture hub (and as its own section in the shareable showcase):

```text
 IDEA        VALIDATE       BUILD        PRE-SELL      LAUNCH        SCALE
 |------------|--------------|-------------|-----------|--------------|
 Day 0       D7            D21          D35         D45           D90 ... D180
 [ Founder  ]■■■■■■■■■□□□□□□□□
 [ Builder  ]      ■■■■■■■■■■■■■■■□□□
 [ Marketer ]              ■■■■■■■■■■■■■■■■■■■
                    ▲ today
```

- **Drag to pan, wheel/pinch to zoom** through time. Zoom levels snap between Days / Weeks / Months so labels never crowd.
- **Three swimlanes**, one per team member (Founder/closer, Builder/operator, Marketer/content). Each bar is a real step with a duration in working days.
- **Phase bands** behind the lanes (Idea → Validate → Build → Pre-sell → Launch → Scale) with a soft gradient, plus a "today" playhead when the venture has a start date.
- **Milestone diamonds** for the moments that matter: first customer conversation, offer priced, page live, first message sent, first dollar, breakeven month — pulled from the venture's own metrics.
- **Click any step** → a side panel with the why, the definition of done, the owner, and a link to the exact asset in the venture that powers it (pricing sheet, warm list, landing PRD…). Clicking through in the showcase opens that asset in the reading pane.
- **Dependencies** drawn as faint curves; a step that can't start early is visibly hooked to its predecessor.
- Keyboard: arrows pan, `+/-` zoom, `Home` resets. Reduced-motion respected. On mobile the same data collapses to a vertical scroll-snap version — no pinch gymnastics.

## Library recommendation

Researched the realistic options:

| Option | Verdict |
| --- | --- |
| `vis-timeline`, `react-calendar-timeline` | Heavy, dated DOM styling, fights the design system. No. |
| `frappe-gantt`, `wx-react-gantt`, DHTMLX/Bryntum | Project-management chrome (grids, editing, licenses). Wrong genre — this is a narrative, not a PM tool. |
| `gsap` Draggable + Inertia | Nice feel, but Inertia is a paid plugin. No. |
| **`d3-scale` + `d3-zoom` inside our own SVG, animated with the `framer-motion` already installed** | **Recommended.** ~15KB, gives correct time scaling, kinetic pan/zoom, and total control of the art direction. Same approach that made the mind map stable after the force-graph failure. |

So: a bespoke SVG timeline, `d3-zoom` for the pan/zoom transform (non-passive wheel listener, cursor-anchored zoom, clamped extents), `framer-motion` for bar entrances and the detail panel. No new heavyweight dependency.

## Where the schedule comes from

The step list is not hardcoded. A new generator reads the Second Brain — brief, concept, pricing, GTM plan, financial model, operating plan, sprint assets — and emits a typed schedule: phases, steps (owner lane, start day, duration, dependency, definition of done, linked asset key), and milestones (including breakeven month from `executive_metrics`). Physical/inventory ventures get longer build and supplier legs; service ventures get a compressed pre-sell. A default 3-person capacity model caps concurrent work per lane so the plan stays honest.

### The default cadence (three-person team, ~90 focused hours/week combined)

| Phase | Days | The point | Lane weight |
| --- | --- | --- | --- |
| Idea → sharpened concept | 0–5 | One sentence, one customer, one price hypothesis | Founder |
| Validate | 5–14 | 15–20 real conversations, problem confirmed, price tested | Founder + Marketer |
| Foundation | 10–24 | Entity, bank, brand, domain, payments — running in parallel with validation | Builder |
| Build the offer | 18–35 | Offer priced, fulfilment SOP, landing page live | Builder + Founder |
| Pre-sell | 30–45 | Warm list worked, first messages sent, deposits taken | Founder + Marketer |
| Launch | 45–60 | Public open, content engine on, first paying customers | All three |
| Prove & repeat | 60–120 | Repeatable sales motion, reviews, unit economics confirmed | Founder + Marketer |
| Cash-flow quarter | 120–180 | Breakeven tracking, first hire or first system, scale the one channel that worked | All three |

First revenue lands in the 35–60 day band; the timeline marks it explicitly.

## What-if mode — the timeline you can argue with

A static schedule tells a first-time founder what *should* happen. The people this is for — someone still in a W-2 looking for a Plan B, a trades operator with a day job, a couple building together, someone with an idea and no path to a first customer — don't ask "what's the plan?" They ask "what happens to my plan if my life is what it actually is?"

So the timeline gets a **Scenario bar** docked under the phase ruler. Change an input, and every bar, milestone and money marker slides and re-labels in real time (~200ms spring), with the original schedule left behind as a faint ghost track so the cost of the change is visible.

### The five levers (chosen for this ICP)

1. **Hours per week I actually have** — 5 / 10 / 20 / 40+, set per person. The W-2 founder drags themselves to 8 and watches launch move from Day 45 to Day 84. This is the single most honest control in the product.
2. **Who's on the team** — toggle lanes on and off, or rename them ("me", "my wife", "my brother-in-law who does the socials"). Drop to one person and the timeline serialises work instead of parallelising it — no more pretending a solo founder does three lanes at once.
3. **Start date and blackout weeks** — pick a real start, mark the busy season, the holiday, the two weeks of overtime. Bars flow around them; the "today" playhead becomes real.
4. **Budget** — a slider from bootstrapped to funded. Money buys speed on specific steps only (a contractor for the site build, paid ads compressing the pre-sell). Steps that money cannot accelerate — customer conversations, licensing, regulatory waits — visibly refuse to move, which is the lesson.
5. **Quit-my-job line** — the founder types the monthly income they need to walk away. A horizontal "freedom line" is drawn across the revenue ribbon under the timeline, and the timeline says the plain-English date the projection crosses it — the answer this ICP actually came for.

### What responds

- **Every step bar** re-times through the capacity model (lane hours ÷ step effort, dependencies respected, blackouts skipped).
- **A revenue ribbon** beneath the lanes, driven by the venture's own pricing and financial-model figures already in `executive_metrics`: first dollar, breakeven month, the freedom line crossing.
- **A verdict strip** that reads like a person, not a dashboard: "At 10 hrs/week solo, you open on 3 November and clear $4,200/mo by February — one month past your $4,000 line."
- **Drag a step** to push it later; dependents move with it and the strip re-reads. Undo/reset always one keystroke away.
- **Three preset scenarios** so nobody faces a blank set of sliders: *Nights & weekends* (1 person, 10 hrs), *Two of us, evenings* (2 people, 15 hrs each), *All in* (3 people, 40 hrs).
- **Compare** pins the current scenario against the baseline: two ghosted tracks, one line of difference ("6 weeks slower, $9k less cash needed").
- **Save & share**: the scenario is part of the venture and travels into the shareable showcase, so a spouse, partner or lender sees the same picture. Visitors can play with the sliders read-only; only the owner can save.
- **Ask the second brain about it**: a "Why is this step here?" action on any bar opens the existing chat pre-loaded with that step's context.

All of this is deterministic client-side math over the generated schedule — no model call per drag, so it feels instant. The AI only writes the schedule and the verdict sentence.

## Technical notes


- **Data**: new `venture_timeline` jsonb column on `venture_snapshots` (phases, steps with *effort in person-hours* rather than fixed days, dependencies, milestones, capacity model, generated_at) plus `venture_timeline_scenario` jsonb for the founder's saved levers. Typed in `src/lib/venture-timeline.ts` with a deterministic fallback schedule so the UI never renders empty.
- **Scheduler**: `src/lib/timeline-schedule.ts` — a pure function `(schedule, scenario) => laidOutSteps` doing topological ordering, per-lane capacity, blackout skipping and money-buys-speed multipliers. Pure and unit-tested; the UI just renders its output. `src/lib/timeline-revenue.ts` projects the revenue ribbon and freedom-line crossing from `executive_metrics`.
- **Generation**: new edge function `venture-timeline` following `venture-exec-summary`'s shape — owner auth, `loadVentureContext` + `brainCorpusBlock`, strict JSON output, validation/clamping of effort and dependency graphs (cycle rejection), `force` regenerate. Backfilled by `venture-hero-sweep` and by bulk generation so a share link always has it.
- **Components**: `src/components/timeline/VentureTimeline.tsx` (scale + zoom shell), `TimelineLane.tsx`, `TimelineStepBar.tsx`, `TimelineMilestones.tsx`, `TimelineRevenueRibbon.tsx`, `ScenarioBar.tsx`, `ScenarioVerdict.tsx`, `TimelineStepPanel.tsx`, `TimelineMobile.tsx`. Rendered in `hub.$snapshotId.tsx` under the dark studio scope and as a pinned showcase section.
- **Share**: `venture-share` returns the timeline plus the saved scenario in the payload (no client DB reads); the showcase gets a `timeline` section and a sidebar entry next to Second Brain; sliders run read-only for visitors; step→asset clicks reuse the existing `onOpenItem` hash routing.
- **Safety**: wrapped in the existing boundary pattern so a render failure degrades to a static phase list rather than breaking the page.

## Build order

1. Types, effort-based schema, deterministic fallback schedule, and the pure scheduler + unit tests.
2. `VentureTimeline` UI with pan/zoom, lanes, phases, milestones, detail panel — driven by the fallback.
3. Scenario bar: hours, team, start date/blackouts, budget, freedom line — plus presets, ghost track, verdict strip, revenue ribbon.
4. `venture-timeline` edge function + columns + hub "Generate/Regenerate cadence" control and scenario save.
5. Showcase integration (payload, section, sidebar, read-only sliders, asset deep-links) + sweep backfill.
6. Mobile variant, keyboard, reduced motion, and QA on a real venture.

