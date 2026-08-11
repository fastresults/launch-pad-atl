# Make the big moves obvious on the runway checklist

Right now every step on the checklist looks the same weight: a filing that legally creates the company reads like "add a footer link". The founder can't see which moves are the launch-defining ones, and can't see where Adam's team's experience is what makes it happen.

## What changes for the founder

Each step gets a **significance** in addition to its criticality:

- **Milestone** — a launch-defining move (entity filed, bank open, offer priced, CRM live, first campaign shipped). Rendered as a large card with a heavier border, a numbered "Milestone 3 of 12" marker, and its supporting steps nested beneath it.
- **Supporting** — the smaller errands that feed a milestone. Rendered compact and indented under their milestone, quieter type, no separate progress bar.

And each step is marked for **who carries the weight**:

- **Agency-led** — Adam's team does the work. Badge reads "Adam's team leads" with a short line naming the skill involved (e.g. "entity structure and state filing", "CRM build and A2P registration", "campaign art direction").
- **Founder-led** — the founder's call or the founder's login.
- **Together** — a working session (pricing, offer, sign-off).

A milestone card shows a one-line "why this one is different" and, when it's agency-led, a small "Where our experience saves you" note pulled from the step's own guide — so the client can see exactly where the skill is being applied instead of guessing.

## New UI

- Milestones read as chapter headers inside each stage. Supporting steps collapse under them by default once the milestone is done.
- A stage header now reads "3 of 5 milestones done" rather than raw task counts.
- Two new filters: **Milestones only** and **Where we lead** (agency-led work).
- Guided view leads with the current milestone, with its supporting steps listed as the path to it.

## Technical notes

- Add `significance: "milestone" | "supporting"` and `lead: "agency" | "founder" | "together"` derivation in a new `src/lib/ops-significance.ts`. Derived client-side from data already present on `OpsTask` — no schema change, no migration:
  - milestone when `task_key` ends in `.anchor`, or the step gates 2+ others (`unlocks.length >= 2`), or criticality is `required_to_operate` and `minutes >= 60`.
  - lead from `owner_kind`, upgraded to `together` when the step's `needs` requires founder input on an agency-owned step.
- Add a small `AGENCY_SKILL` map keyed by task-key slug fragment (entity, ein, bank, ghl, a2p, funnel, qbo, brand, campaign, …) giving the one-line skill statement; fall back to the task's category so nothing is blank.
- `OpsChecklist.tsx`: group each day's rows into milestone + its supporting rows (nearest preceding milestone in sort order), render two row variants.
- `OpsTaskRow.tsx`: accept a `variant` prop ("milestone" | "supporting") and render the lead badge; existing tooltip/explainer behaviour unchanged.
- `OpsTimeline.tsx` and `GuidedStep.tsx` pick up the same badges so the three views agree.
- No edge function or database changes.
