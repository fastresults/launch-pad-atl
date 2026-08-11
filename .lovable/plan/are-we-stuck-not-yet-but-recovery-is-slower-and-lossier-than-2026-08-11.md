# Are we stuck? Not yet — but recovery is slower and lossier than tier 1 should be

## Live state for this venture (checked just now)

- Job `83bbe5fe…`: `status: running`, started 01:46:45, last heartbeat **01:53:09** (~5 min ago), `resume_count: 0`, `progress_pct: 37`, current asset `pre_sell_offer_test`.
- Assets: **23 complete, 2 not applicable, 1 generating** — `website_prd`, untouched since **01:49:10**, `generation_attempts: 1`, no error, and **`content` is NULL** (the draft checkpoint never landed).
- Watchdog cron runs every 5 minutes; its stall window is 6 minutes.

So the system will notice this run around 01:59–02:04 and auto-resume it once. It is recovering, but only after a 6–11 minute silent freeze, and the founder sees a bar stuck at 37% the whole time with no control.

## The real gaps for a tier-1 self-healing guarantee

1. **Detection latency stacks.** 6-minute stall window + 5-minute cron = up to 11 minutes of dead air before anything happens. Nothing in the app itself triggers recovery.
2. **Recovery throws away work.** When the watchdog finds a `generating` document it flips it to `failed` — even when a checkpointed draft exists. The whole point of the draft/refine split is that a dropped refine worker should *publish the draft*, not destroy it.
3. **The refine handoff has no re-entry.** If phase two never runs, only the generic sweep catches it; there is no "checkpointed draft older than N minutes → re-invoke refine" pass.
4. **Progress lies.** 23 of 26 done reads as 37%, because the bar uses the current run's internal counter instead of real completed assets.
5. **No founder-facing recovery.** No "resume now", no "skip this asset", no visible reason. A stubborn asset can hold the run hostage with a spinner.
6. **Attempts aren't budgeted per asset.** Repeated worker deaths on the same expensive document can loop without a cap-and-park record in `venture_generation_failures`.

## The fix

**A. Cut detection latency.** Watchdog cron every minute (it is idempotent and cheap). Keep the 6-minute stall window for jobs, but add a shorter, dedicated 4-minute sweep for documents in `generating`.

**B. Never destroy a checkpoint.** In the watchdog document sweep, branch on content:
- Draft present (content non-empty, `metadata.phase = 'draft'`) → re-invoke the **refine** phase once; if it has already been retried, promote the draft to `complete` with `metadata.quality_gaps` recorded.
- No content → `failed` with a real `last_error`, so the retry engine picks it up on the next round.

**C. Client-side self-heal.** The hub polls the job already. When it sees `running` with a heartbeat older than ~3 minutes, it fires the watchdog endpoint once per minute (rate-limited, idempotent) so an open browser recovers the run faster than cron.

**D. Truthful progress.** Compute `progress_pct` from real complete/total on every job update, and have the UI take `max(job.progress_pct, complete/total)`. This run would read ~88%, not 37%.

**E. Founder controls.** Hero card gains a degraded state when the job is `paused`, or `running` with a >6-minute heartbeat gap: name the asset, show **Resume** (retry-only) and **Skip this asset**, plus the last error.

**F. Bounded, recorded retries.** Cap per-document recovery attempts (3). On exhaustion, write a `venture_generation_failures` row and mark the asset `failed` with a clear message rather than resuming forever.

**G. Unstick this venture now.** Re-invoke generation for `website_prd` (no content to lose) and let the run finish the remaining assets.

## Technical notes

- `supabase/functions/venture-job-watchdog/index.ts` — add `DOC_STALL_MS = 4min`; replace the blanket `generating → failed` update with the checkpoint-aware branch (re-invoke `venture-generate-document` with `phase: "refine"` and the internal key); add per-document attempt cap using `generation_attempts`; write `venture_generation_failures` on exhaustion.
- Cron: update `venture-job-watchdog-every-5min` to `* * * * *` via the insert tool (contains project-specific URL/key, so not a migration).
- `supabase/functions/venture-bulk-generate/index.ts` — derive `progress_pct` from a live complete-count query at each heartbeat/update site.
- `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx` — stale-heartbeat detector that pings the watchdog, `max()` progress, and the paused/degraded hero state with Resume + Skip.
- No schema migration needed; `generation_attempts`, `last_error`, `metadata`, `heartbeat_at`, `resume_count` all exist.
