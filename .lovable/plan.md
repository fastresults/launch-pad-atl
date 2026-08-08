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

## Technical notes

- **Data**: new `venture_timeline` jsonb column on `venture_snapshots` (phases, steps, milestones, capacity model, generated_at). Typed in `src/lib/venture-timeline.ts` with a deterministic fallback schedule so the UI never renders empty.
- **Generation**: new edge function `venture-timeline` following `venture-exec-summary`'s shape — owner auth, `loadVentureContext` + `brainCorpusBlock`, strict JSON output, validation/clamping of day ranges, `force` regenerate. Backfilled by `venture-hero-sweep` and by bulk generation so a share link always has it.
- **Components**: `src/components/timeline/VentureTimeline.tsx` (scale + zoom shell), `TimelineLane.tsx`, `TimelineStepBar.tsx`, `TimelineMilestones.tsx`, `TimelineStepPanel.tsx`, `TimelineMobile.tsx`. Rendered in `hub.$snapshotId.tsx` under the dark studio scope and as a pinned showcase section.
- **Share**: `venture-share` returns the timeline in the payload (no client DB reads); the showcase gets a `timeline` section and a sidebar entry next to Second Brain; step→asset clicks reuse the existing `onOpenItem` hash routing.
- **Safety**: wrapped in the existing boundary pattern so a render failure degrades to a static phase list rather than breaking the page.

## Build order

1. Types + deterministic fallback schedule (`venture-timeline.ts`).
2. `VentureTimeline` UI with pan/zoom, lanes, phases, milestones, detail panel — driven by the fallback.
3. `venture-timeline` edge function + column + hub "Generate/Regenerate cadence" control.
4. Showcase integration (payload, section, sidebar, asset deep-links) + sweep backfill.
5. Mobile variant, keyboard, reduced motion, and QA on a real venture.
