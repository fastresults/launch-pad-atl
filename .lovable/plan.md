## Problem

Three "stage" systems don't agree. What the user sees on `/schedule` today has zero overlap with what they see on their dashboard after signing up.

| Where | Stages | Names |
|---|---|---|
| `/schedule` (curriculum-data.ts) | 7 | Form the business · Customer & market · Offer & product · Build · Brand & website · Marketing & creatives · Launch plan |
| Dashboard walk-out (framework-deliverables.ts) | 5 core + 3 bonus | Foundation · Strategy · Operations · Finance · Governance · Brand · Marketing · Social & Content |
| Dashboard workflow (workflow.ts) | 5 pillars + bonus | Foundation · Strategy · Operations · Finance · Governance (+ bonus tracks) |

Legal/entity work, launch plan, brand deliverables, and website output on `/schedule` map to nothing the dashboard shows. The 5-pillar Foundation → Governance frame the user lives in after registering doesn't appear on the marketing page at all.

## Goal

Reframe `/schedule` so the on-the-day agenda uses the **same 5 pillars (+ 3 bonuses)** the user will meet on their dashboard, and label each in-room session with the pillar(s) it produces. Keep the 2h 45m running time, check-in, two breaks, and close.

## Approach

Restructure the source of truth used only by `/schedule` — do **not** touch `workflow.ts`, `framework-deliverables.ts`, DB deliverable types, or the authenticated dashboard.

### 1. Rewrite `src/lib/curriculum-data.ts` `STAGES`

Replace the 7 current entries with 8 stages that mirror `FRAMEWORK_STAGES` exactly by number, slug, title, and shortTitle:

| n | slug | title | shortTitle | bonus |
|---|---|---|---|---|
| 1 | foundation | Foundation | foundation | — |
| 2 | strategy | Strategy | strategy | — |
| 3 | operations | Operations | operations | — |
| 4 | finance | Finance | finance | — |
| 5 | governance | Governance | governance | — |
| 6 | brand | Brand | brand | ✨ |
| 7 | marketing | Marketing | marketing | ✨ |
| 8 | social-content | Social & Content | social | ✨ |

Add optional `bonus?: boolean` to the `Stage` type.

For each stage:
- `oneLiner`, `summary`, `duration` — new copy anchored to the pillar's deliverables.
- `takeHome`, `walkOut[]`, `afterWorkshop[]` — rewritten so every item is one of the named deliverables from `framework-deliverables.ts` (e.g. Foundation walkOut = Executive Summary, Vision & Mission, Problem/Solution Brief, Value Proposition). Keep concrete workshop-day outputs (entity packet, EIN, operating agreement, terms) inside Governance where they belong per the framework.
- `tasks[]` — each task's `deliverable` field names the exact framework deliverable produced, `takeaway` restates it, `followUp` describes what happens on the dashboard after.

Preserve `covers[]` chips (short freeform labels are fine).

### 2. Rewrite `src/lib/schedule-data.ts` `SCHEDULE`

The current in-room block runs 8:45 → 11:30 with 4 working sessions. Rework to 5 core pillar sessions grouped into that window, plus a bonus preview. Concrete draft:

```
8:45  15m  Check-in — coffee & refreshments
9:00  25m  Foundation      (Stage 1)
9:25  25m  Strategy        (Stage 2)
9:50  10m  Break
10:00 25m  Operations      (Stage 3)
10:25 25m  Finance         (Stage 4)
10:50 10m  Break
11:00 25m  Governance      (Stage 5) — entity/EIN/legal packet included here
11:25  5m  Bonus tracks preview (Brand · Marketing · Social & Content — continued on dashboard)
11:30      Close — 5 pillars in hand, dashboard unlocked
```

Update the close-out description to say the user walks out with the 5 core pillars completed and 3 bonus tracks queued up on their dashboard.

### 3. Update `src/routes/schedule.tsx`

- Hero stat ribbon: change "4 stages" → "5 pillars + 3 bonus tracks". Keep "2h 45m" and update "6 things done" → "5 pillars done".
- Hero paragraph: replace "Four working stages" with "Five pillars — Foundation to Governance — plus your Brand, Marketing, and Social & Content bonus tracks queued to your dashboard."
- Timeline already renders whatever is in `SCHEDULE`, so it picks up the new blocks. Stage anchors become `#stage-1..8`; the flow strip on the home page (`FLOW_STAGES` derived from `STAGES`) auto-updates.
- Footer CTA copy: reinforce "5 pillars in hand by 11:30 AM."

### 4. Verify downstream consumers

Files that import `STAGES` from `curriculum-data.ts`:

- `src/lib/schedule-data.ts` — rewritten in step 2.
- `src/routes/schedule.tsx` — rewritten in step 3.
- `src/components/home/HomeFramework.tsx` — read to confirm it renders whatever's in `STAGES`; adjust any hardcoded count/label copy.
- `src/routes/_authenticated/welcome.tsx`, `src/routes/_authenticated/workshop.$stage.tsx`, `src/routes/index.tsx` (WalkOutPreview) — spot-check each renders generically from `STAGES` and doesn't rely on the old titles or the old `n` count (7). Adjust display strings only.

No changes to: `workflow.ts`, `framework-deliverables.ts`, DB migrations, `deliverable_types`, `attendee_deliverables`, `RegisterFramework.tsx` (already uses `FRAMEWORK_STAGES`), or any dashboard route.

## Out of scope

- Dashboard workflow/deliverables engine, DB schema, or bonus-track unlock logic.
- Changing FRAMEWORK_STAGES itself.
- Restyling the schedule timeline.

## Verification

- `/schedule`: 8 stage blocks in the "Day at a glance" rail, hero says "5 pillars + 3 bonus tracks", timeline shows Foundation → Governance with a bonus preview and close, deep-links `#stage-1..8` scroll correctly.
- Home page flow strip renders the same 8 stages with matching titles.
- Register page walk-outs (already framework-based) still render 8 stages unchanged.
- Dashboard workflow page unchanged (5 pillars + bonus tracks).
- No TS errors from consumers of `STAGES`.

## Open decision for you

One thing I need your call on before implementing:

**Do you want the on-site day to still include the entity formation packet, EIN, operating agreement, and legal kit?** Two options:

- **A. Keep them, put them under Governance (Stage 5).** Preserves current on-site value; matches "Legal Structure Brief" in FRAMEWORK_STAGES 05 (expanded).
- **B. Move them to a pre-workshop or dashboard-only step.** Frees up in-room time for the 5 pillars; matches framework literally (only "Legal Structure Brief" is listed, not actual filings).

The plan above assumes A. Say "B" if you want them out of the in-room agenda.
