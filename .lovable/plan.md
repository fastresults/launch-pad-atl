# Nothing unexplained: make every step in Operationalize clickable

Today the guided experience only explains the ~65 steps that have hand-authored guides. The other ~70 show a title and a one-line "why" with nothing to open. A first-time founder hits a dead end and has to guess. This closes that gap so **every** step, chip, and status in Operationalize answers four questions on click: why it matters, what goes into it, how long it takes, and whether the business can actually run without it.

## What the founder will see

**A "Why this matters" panel on every single step.** No exceptions. Opening any task — guided card or checklist row — reveals:
- **Why it matters** — the consequence of skipping it, in plain words.
- **What goes into it** — the numbered how-to steps, plus what to have ready before starting.
- **How long** — an hours/minutes estimate, always present (never blank).
- **How critical** — one of three plain labels:
  - **Required to operate** — you are not legally or practically in business without this (EIN, bank account, invoicing, the offer itself).
  - **Required to sell** — you can exist without it but you cannot take money reliably (booking link, CRM pipeline, proposal template).
  - **Makes it grow** — accelerators (retargeting, content cadence, referral loop).
- **What it unblocks** — the named later steps that depend on this one ("This is what lets Day 10 CRM automation work").

**Coverage guarantee.** Steps without a hand-authored guide get a generated one from their category, stage, owner and title, so the panel is never empty. Authored guides always win. We add hand-authored guides for the remaining high-friction steps and generate the rest.

**Tooltips on everything else that is currently silent:**
- The criticality badge, category dot, owner label ("Adam's team" / "You"), due date, and each status chip get a hover/tap tooltip explaining what it means.
- The stage headers explain what the stage buys the business and what happens if you stall there.
- The progress bar explains what 100% actually means: fully operational.

**An "Explain this step" button in guided mode.** Persistent, always visible on the guided card, opening the same panel — so there is always something to click even when the step looks self-explanatory.

**Criticality visible at a glance.** A small colored badge on every row and on the guided card, plus a checklist filter: "Show only what's required to operate." This is how a founder finds the true minimum to be in business.

**A stage completion promise.** At the top of each stage: "Finish these 14 and you can legally take money" — the concrete operational milestone, not a percentage.

## Technical approach

**Data model (edge function, no migration needed beyond one column)**
- Add `criticality` to `venture_ops_tasks` (`required_to_operate` | `required_to_sell` | `growth`), defaulted from the catalog, plus `unlocks` (text array of task keys this one gates).
- `supabase/functions/_shared/ops-guides.ts`: extend the guide record with `criticality` and `unlocks`; author guides for the remaining uncovered steps, prioritising Legal, Money, Sales, and CRM.
- New `supabase/functions/_shared/ops-guide-fallback.ts`: derives `how`, `needs`, `minutes`, and `criticality` from category + stage + owner + the existing `why`/`done_when` when no authored guide exists. Deterministic, no AI call.
- `ops-runway.ts` merges authored guide → fallback → task, so every catalog task ships complete.
- `venture-ops/index.ts` refreshes the new fields onto existing rows the same way it already refreshes `how`/`needs`/`minutes`.

**Client**
- `src/lib/ops-runway.ts`: add `criticality` and `unlocks` to `OpsTask`.
- New `src/lib/ops-criticality.ts`: labels, colors, tooltip copy, and the "what it unblocks" resolver (task key → title).
- New `src/components/ops/StepExplainer.tsx`: the shared panel (sheet on mobile, inline expansion on desktop) used by both the guided card and checklist rows — single source of truth so the two views never drift.
- New `src/components/ops/InfoTip.tsx`: thin wrapper over the existing shadcn tooltip/popover that works on touch (tap to open) as well as hover.
- `GuidedStep.tsx`: add the persistent "Explain this step" button, criticality badge, and "what this unblocks" line.
- `OpsTaskRow.tsx`: criticality badge, tooltips on every chip, expansion renders `StepExplainer`.
- `OpsChecklist.tsx`: add the "Required to operate" filter and stage completion promises.
- `OpsDashboard.tsx`: tooltip on the progress bar and stage summary.

**Not changing:** task ordering, statuses, sign-off workflow, or any generation pipeline.
