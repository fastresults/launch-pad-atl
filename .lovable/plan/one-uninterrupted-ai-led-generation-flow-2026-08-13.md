# One uninterrupted, AI-led generation flow

## Are we stuck right now?

No — this venture's run is alive, but it is not "one flow".

Checked just now for `0ca32be1…`:

- Job `4af24cce…`: `running`, started 15:01:20, heartbeat 15:04:11 (~3 min ago), `resume_count: 0`, `progress_pct: 31`.
- Assets: **19 complete, 2 not applicable, 4 generating, 1 pending**.
- The 4 generating rows are all ~3 minutes old and one (`sales_playbook`) has a 5.2k-char checkpointed draft — healthy in-flight work.
- The `pending` row is `website_prd`, and it is **excluded from bulk generation by design** (`BULK_EXCLUDED_TYPES`). Nothing in the run will ever pick it up.

So the recovery machinery (per-document heartbeat ticker, minute-cadence watchdog cron, checkpoint-aware recovery, client-side watchdog ping, Resume/Skip UI) is in place and working. What breaks the "uninterrupted" promise now is not crashes — it is **hand-off gaps and permanent parks**.

## The four things that still interrupt the flow

1. **The website build brief never auto-runs.** It is fenced out of the bulk run and waits for a manual click, so every venture ends its "automatic" build one asset short, sitting at `pending` with no explanation on the hub.
2. **Blocked assets park forever.** `blocked_reason` rows are deliberately never retried. A brand kit that was missing at minute two stays blocking even after the Brand Wizard locks a brand — nothing re-drives them when the blocker clears.
3. **Quality gates hard-fail instead of self-correcting.** Recent collateral runs blocked 13 times with `RENDERER_BUG: a logo specimen was drawn in #21c0ff on #F5F5F5`. The gate correctly refused to ship, but there is no automatic ink re-selection and re-render — the founder is left with missing collateral.
4. **Progress reports 31% while 19 of 26 are complete.** The number disagrees with the database. Cause is unconfirmed (likely `state.total` counting the full type list while the live complete-count is scoped to this run's keys) — verify before changing the arithmetic.

## The plan

**A. Continuous orchestration — no manual hand-offs.**
Add a single orchestrator pass that runs at the end of every bulk run and on each watchdog tick: after all bulk assets settle and a brand is locked, it automatically kicks the website build brief, then brand collateral, then hero imagery — in dependency order, one stage per tick, idempotent. Manual buttons stay for re-runs; nothing waits on a human to advance.

**B. Unblock automatically when the blocker clears.**
On brand lock (and on each watchdog tick), clear `blocked_reason` for rows whose blocker is a now-satisfied precondition and requeue them. Blocked stays blocked only when the missing input is genuinely founder-supplied — and then it appears as a named task on the hub, not a silent stop.

**C. Self-correcting quality gates.**
When a gate fails for a machine-correctable reason (contrast, ink choice, sizing), re-render once with the corrected value from the single contrast authority before recording a failure. Only a second failure blocks, and it blocks with the specific reason.

**D. Truthful progress.**
Confirm the 31%-vs-19/26 mismatch against the run's key set, then make `progress_pct` a single derived value: settled (complete + not_applicable) over total active types for the venture, written at every heartbeat.

**E. Flow visible end to end.**
The hub hero shows the whole pipeline, not just the bulk phase: assets → brand → website brief → collateral → imagery, with the current stage named and any founder-blocking item surfaced as an action. Waiting states never look identical to stalled ones.

**F. Finish this venture's run.**
Let the four in-flight documents complete, then trigger the website build brief for this venture once the orchestrator lands.

## Technical notes

- `supabase/functions/venture-bulk-generate/index.ts` — new terminal `orchestrateNextStage()` after `reconcilePersistedArtifacts`; drop `website_prd` from the automatic exclusion once brand lock is verified; single derived `progress_pct` helper.
- `supabase/functions/venture-job-watchdog/index.ts` — call the same orchestrator for ventures with settled bulk work but unstarted downstream stages; add the blocked-reason re-drive sweep.
- `supabase/functions/venture-collateral/index.ts` + `_shared/logo-ink.ts` — one automatic ink-correction re-render before a gate becomes a blocked event.
- `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx` — stage-aware pipeline strip; distinguish "waiting on you" from "working" from "stalled".
- No schema migration required.
