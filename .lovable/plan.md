# Hardening asset generation to tier-1 reliability

## What the data says right now

Checked live: 358 assets complete (avg quality 96), 2 failed. Both failures are the **same asset — `website_prd`** — on two different ventures, both with `Generation stalled — worker dropped`. The run in progress on this venture (started 22:12) is already at `resume_count: 1`, `retry_round: 1`, with `website_prd` failed at 2 attempts and **no content saved**.

So the retry engine, watchdog, checkpointing, progress truthfulness and founder Resume/Skip controls built earlier are all live and working — the remaining failure is concentrated, repeatable, and structural.

### Root cause (verified in code)

There are **two independent generation implementations**:

- `venture-generate-document` — single-asset path. Has the draft/refine checkpoint split: the PRD's first pass is written to the row, then a *fresh worker* does enrichment. A dropped worker loses nothing.
- `venture-bulk-generate` — the bulk path used by every run. It has its **own copy** of the prompt/model/guard logic (`generateOne`) and **no draft checkpoint**. The PRD runs as one long worker: a 180s Pro call at 24k tokens, plus imagery guard, copy-depth expansion and repair passes, all in one wall clock, with `retries: 0` on the full mode.

That single un-checkpointed worker is what dies, and because nothing was written, the recovery path can only fail the asset instead of publishing a draft.

### Second verified conflict

The legacy SQL cron `sweep-stuck-generations` (every 5 min) still runs `UPDATE venture_documents SET status='failed' WHERE status='generating' AND updated_at < now() - 10 min`, and fails jobs outright. It is checkpoint-blind and races the checkpoint-aware `venture-job-watchdog` (now every minute). A PRD draft mid-refine can be destroyed by SQL that knows nothing about phases, and a job it marks `failed` is in a status no watchdog path resumes.

## The fix

**1. One generation engine.** Delete `generateOne`'s duplicated body from `venture-bulk-generate`; the bulk runner invokes `venture-generate-document` per asset (internal service key, mode/round passed through). One prompt contract, one guard chain, one checkpoint behaviour — bulk and single-asset runs stop drifting apart.

**2. Checkpointing everywhere, not just the PRD.** Every asset writes its first complete draft to the row before enrichment, with `metadata.phase='draft'`. Any worker death after that point publishes real content instead of a failure.

**3. Split the PRD into bounded stages.** draft → imagery/copy enrichment → repair, each its own invocation with its own wall clock and each persisted. No stage exceeds ~90s of model time.

**4. Retire the legacy SQL sweeper.** Rewrite `sweep_stuck_generations()` to leave `venture_documents` and `venture_generation_jobs` alone (keeping only the pipeline/roadmap sweeps), so the checkpoint-aware watchdog is the single authority over generation state. Add `failed` jobs to the watchdog's resume set as a safety net.

**5. Per-asset circuit budget with an honest terminal state.** Cap total attempts per asset across a run (bulk + watchdog share the counter). On exhaustion, record `venture_generation_failures` with the real gateway error and mark the asset `failed` with founder-readable text — never leave it spinning.

**6. Observability.** A `venture_generation_events` table (one row per attempt: asset, round, mode, model, duration, outcome, error class) plus an admin panel showing failure rate by asset type, p95 duration, and gateway error classes. Right now the only forensic trail is a truncated `last_error` string.

**7. Preflight validation.** Before a run starts, check the gateway is reachable and the brand/intake gates for each asset. Assets that cannot succeed are marked `blocked` up front rather than burning three retry rounds.

**8. Unstick this venture.** Re-run `website_prd` for snapshot `4968b647…` on the staged path once shipped.

## Technical notes

- `supabase/functions/venture-bulk-generate/index.ts` — replace `generateOne` internals with an internal invoke of `venture-generate-document` (`{ snapshotId, documentType, mode, round }`); keep layering, concurrency (6), heartbeat and live progress here.
- `supabase/functions/venture-generate-document/index.ts` — accept `mode: full|trimmed|minimal`; generalise the draft checkpoint beyond `isPrd`; add PRD stage `enrich` between `draft` and `refine`.
- Migration: `create table public.venture_generation_events` + GRANTs (`select` to `authenticated`, `all` to `service_role`), RLS scoped to the snapshot owner and admins; `create or replace function public.sweep_stuck_generations()` without the two generation UPDATEs.
- `supabase/functions/venture-job-watchdog/index.ts` — include `failed` jobs in the stalled query; enforce the shared per-asset attempt cap.
- Admin: new generation-health card on `src/routes/_authenticated/_admin/admin.hub.tsx` reading `venture_generation_events`.
- No client-facing copy or layout changes; the hub already renders drift, Resume and Skip.
