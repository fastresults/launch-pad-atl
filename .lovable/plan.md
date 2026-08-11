# Operationalize: a guided experience for first-time founders

Today the runway shows ~136 tasks at once, behind seven filter pills, four phase pills, day headers, and a status chip that cycles through five states when clicked. That reads like project-management software for people who already run projects. A novice opens it and does not know what to touch first.

The retool keeps every task and all the data, and changes how it is presented: **one next step at a time, in plain language, with a way to zoom out when the founder wants to.**

## The new shape

Three views, one toggle at the top. Guided is the default.

```text
[ Guided ]  [ Checklist ]  [ Timeline ]
```

### 1. Guided (default)

A single focused card: the one thing to do next.

- Big step title, a "why this matters" line, and **What done looks like**.
- **How to do it** — 3-5 numbered plain-language steps (see Content section).
- What you need before starting (e.g. EIN, bank login), and a rough time estimate.
- Linked assets from the showcase open right there ("Your priced offer sheet").
- Three large buttons: **Mark it done** · **I'm stuck** · **Not now**.
  - "I'm stuck" opens a short note box and offers "Ask Adam's team" (existing consultation flow) instead of the raw "Blocked" status.
  - "Not now" pushes the step down the queue rather than looking like failure.
- Under the card: "Step 12 of 136 · Week 2 — Wire it" plus a slim progress bar and a "Show me the next 3" peek so it never feels like a black box.
- When a whole day/stage completes, a short celebration state: what was accomplished, what unlocks next.

### 2. Checklist

The current grouped list, cleaned up:

- Phases become **Weeks/stages with human names** ("Week 1 — Prove people want it"), each collapsible and collapsed by default except the active one.
- Locked-looking future stages are dimmed with "Comes after Week 1" so the founder is not overwhelmed.
- Filter pills reduced from seven to three: **What's next · Everything · Waiting on the agency**. Creative/growth/overdue move into a single "Filter" dropdown for power users.
- Status is no longer a mystery cycle button: the circle is a real checkbox (done / not done), and the other states live behind a small "..." menu with plain labels ("Working on it", "Waiting on my team", "Stuck").

### 3. Timeline

A read-only, scannable arc of the 4 stages with counts and dates so the founder sees the whole journey and where they are — the "am I on track?" answer, no interaction required.

## Onboarding and orientation

- **First-run intro** (once per venture, dismissible, re-openable from a "?" ): three panels — what this is, how it works, who does what. Ends with "Start step 1".
- **Start-here banner** when nothing has been touched yet: "Nobody has started this runway. Begin with step 1 — about 20 minutes."
- **Owner clarity**: every step is badged **You** or **Adam's team** in plain words, with a one-tap "Hand this to Adam's team" that also flips the status.
- **Jargon pass**: retire "runway", "phase", "waiting_client", "proof URL", "cadence" from the visible UI. Use: journey/steps/stage, waiting on the agency, "Add a link as proof (a receipt, screenshot, or dashboard link)".

## Creative sign-off, simplified

Same tab, novice framing: one asset at a time, big preview, two primary buttons — **Looks good, publish it** and **Ask for changes** (with a required note). The state machine underneath is unchanged.

## Same experience in both places

`OpsDashboard` is already shared by the share link (`ShareOpsRunway`) and the dashboard (`hub.$snapshotId.operations`), so all of the above lands in both automatically. Differences kept intentionally small:

- Share link (founder): Guided default, agency-owned steps read-only-ish and clearly labeled, consultation CTA present.
- Dashboard (agency): Checklist default, bulk-friendly, client-editing toggle stays.
- Mobile: Guided view is single-column and thumb-reachable; the view toggle sticks to the top; the action buttons stack full-width.

## Content work (the part that makes it actually guided)

The task catalog currently carries `title`, `why`, `done_when`. Guided mode needs a short **how** for each step. Plan:

1. Add an optional `how: string[]` (3-5 steps) and optional `needs: string[]` / `minutes: number` to the catalog type in `supabase/functions/_shared/ops-runway.ts`, persisted on the task rows.
2. Author `how` for the ~60 highest-friction steps first (legal, EIN, bank, QuickBooks Online, GoHighLevel, domain/DNS, funnel, first outreach). The rest fall back to `why` + `done_when`, which already read well.
3. Where a step maps to a vendor, add a single labeled external link ("Open QuickBooks setup").

## Technical notes

- New: `src/components/ops/GuidedStep.tsx` (focused card), `src/components/ops/OpsOnboarding.tsx` (first-run intro), `src/components/ops/OpsTimeline.tsx` (read-only arc), `src/lib/ops-guided.ts` (next-step selection, stage naming, "not now" ordering).
- Rework: `OpsDashboard.tsx` becomes a shell with the view toggle + shared header; the existing list becomes `OpsChecklist.tsx`. `TaskRow` keeps its detail drawer with the simplified status menu.
- "Not now" needs a per-task deferral. Simplest path with no schema change: reuse `due_at` (push out a few days) — or add a `snoozed_until` column if we want it explicit. Recommend the column; it is one small migration and keeps due dates honest.
- First-run intro dismissal stored per venture in `venture_ops_state` (new boolean) so it is consistent across the share link and the dashboard rather than per-browser.
- Migration additions: `venture_ops_tasks.how text[]`, `needs text[]`, `minutes int`, `snoozed_until timestamptz`; `venture_ops_state.intro_dismissed boolean default false`. Grants follow the existing pattern on those tables.
- Redeploy `venture-ops` after the catalog and seeding changes; existing runways backfill on next load through the current upsert-on-`(snapshot_id, task_key)` path.

## Order of work

1. Copy + labels pass and the reduced filter set (no schema) — immediate readability win.
2. View toggle + Checklist restructure (collapsed stages, checkbox status).
3. Guided view with next-step logic, stuck/not-now, celebration states.
4. Migration + `how`/`needs`/`minutes` authoring for the top ~60 steps.
5. Onboarding intro, Timeline view, creative sign-off simplification, mobile polish.
