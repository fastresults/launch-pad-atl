# Integrate the launch timeline into the shareable link UX

The timeline already renders inside the public showcase (it ships in the share payload as the `overview:timeline` item and draws in the reading pane). What's missing is the surrounding experience: it's buried in the Overview list, it can't be linked to, its steps don't connect to the assets or the second brain, and the owner has no control over it when creating a link.

## What changes for the reader

1. **A pinned entry in the contents sidebar** — "Launch timeline · Idea to cash flowing", sitting alongside Second brain and Executive summary, so it reads as one of the three headline tools rather than an item buried under Overview.
2. **A full-bleed reading pane for the timeline** — when the timeline is active, the pane drops the article max-width and padding so the track uses the full canvas width (same treatment the second brain already gets), with the masthead condensing on open.
3. **Deep links that survive sharing** — `#overview:timeline` opens the timeline; `#overview:timeline/<step-id>` opens it with that step selected and the canvas panned to it. Selecting a step updates the hash, so a founder can send "look at week 3" directly.
4. **Steps connect to the rest of the showcase** — a step that references a built asset gets an "Open the asset" action that navigates the reading pane to it; an "Ask about this step" action jumps into the second brain with the question pre-filled. Both wire the existing `onOpenAsset` / `onAsk` props that `ShareSection` currently doesn't pass.
5. **Shareable what-if scenarios** — the public timeline stays read-only against the founder's saved scenario, but reader lever changes are encoded in the URL so a viewer can send back "here's how I'd run it". A "Reset to the founder's plan" control returns to the saved scenario.
6. **Mobile** — the sidebar sheet gets the same pinned entry; the timeline renders through the existing `TimelineMobile` stepper, and the full-bleed treatment is skipped there.

## What changes for the owner

In the share dialog, next to the chat and mind-map switches: **Include the launch timeline** (on by default). Off writes `overview:timeline` into the link's excluded keys, which the edge function already honors. When the venture has no generated timeline, the switch is shown disabled with a short line pointing at the hub to generate it.

## Technical notes

- `src/components/share/ShareSidebar.tsx` — add a pinned `overview:timeline` row (icon: `GitBranch` or `Route`), shown only when the payload contains that item; hide the duplicate row from the Overview tree so it appears once.
- `src/routes/v.$token.tsx` — treat `timelineActive` like `brainActive`: full-bleed pane class, condense masthead on open, keep prev/next hidden. Extend hash parsing to `key/step` and pass the step id down.
- `src/components/share/ShareSection.tsx` — pass `onOpenAsset`, `onAsk`, `selectedStepId`, `onSelectStep` through to `VentureTimeline`; the route owns the handlers (navigate, or open brain with a seeded question).
- `src/components/timeline/VentureTimeline.tsx` — accept `selectedStepId` / `onSelectStep` as controlled props (currently local state only) and a `scenarioOverride` from the URL; add the "Reset to the founder's plan" affordance in read-only mode. `TimelineStepPanel` renders the two new actions when handlers are present.
- `src/components/share/ShareBrain.tsx` — accept an optional seeded question so "Ask about this step" lands in the chat input.
- `src/components/hub/ShareVentureDialog.tsx` — add the timeline switch and fold `overview:timeline` into the excluded-keys payload on save.
- Scenario URL encoding lives in `src/lib/venture-timeline.ts` (`encodeScenario` / `decodeScenario`) with unit tests next to the existing scheduler tests.
- No database or edge-function changes: the payload, exclusion handling, and scenario columns already exist.

## Verification

Typecheck, run the timeline unit tests, then load a real share link in the browser and check: pinned entry present, full-bleed layout, deep link to a step restores selection, step actions navigate to an asset and into the brain, lever changes round-trip through the URL, and the owner toggle removes the section from a fresh link.
