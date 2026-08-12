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

**3. Take the PRD out of the bulk run entirely — it becomes a founder-triggered build, gated on a locked brand.** This is the recommended approach over merely reordering layers: the PRD is the single most expensive, longest-running asset in the system and the only one that has ever failed, and it is also the one asset whose quality depends on brand inputs (`venture_brand_kits.status = 'locked'`) that may still be `draft` or `auto` when the run executes. Generating it inside the run means we pay Pro-tier tokens on a document built from provisional brand data, then die on the wall clock.

New behaviour:

- `website_prd` is excluded from the bulk run's type list. On run start it is seeded as `pending` with `blocked_reason: "Lock your Brand Wizard, then build your website PRD."` — so the run reaches 100% honestly and never stalls on it.
- The hub renders a dedicated **Website PRD** card. While the brand kit is not `locked`, the button is disabled with a link to the Brand Wizard. Once locked, the button reads **Build website PRD** and invokes `venture-generate-document` directly (single-asset path, which already has the draft/refine checkpoint).
- Regenerating the PRD after a brand change is an explicit founder action too — locking a new brand marks an existing PRD as `stale` in metadata and offers a rebuild, rather than silently rewriting it.
- The watchdog's recovery path is unchanged and still protects the standalone run.

**4. Split the PRD into bounded stages.** In its now-standalone run: draft → imagery/copy enrichment → repair, each its own invocation with its own wall clock and each persisted. No stage exceeds ~90s of model time.

**5. Retire the legacy SQL sweeper.** Rewrite `sweep_stuck_generations()` to leave `venture_documents` and `venture_generation_jobs` alone (keeping only the pipeline/roadmap sweeps), so the checkpoint-aware watchdog is the single authority over generation state. Add `failed` jobs to the watchdog's resume set as a safety net.

**6. Per-asset circuit budget with an honest terminal state.** Cap total attempts per asset across a run (bulk + watchdog share the counter). On exhaustion, record `venture_generation_failures` with the real gateway error and mark the asset `failed` with founder-readable text — never leave it spinning.

**7. Observability.** A `venture_generation_events` table (one row per attempt: asset, round, mode, model, duration, outcome, error class) plus an admin panel showing failure rate by asset type, p95 duration, and gateway error classes. Right now the only forensic trail is a truncated `last_error` string.

**8. Preflight validation.** Before a run starts, check the gateway is reachable and the brand/intake gates for each asset. Assets that cannot succeed are marked `blocked` up front rather than burning three retry rounds.

**9. Unstick this venture.** Once shipped, `website_prd` for snapshot `4968b647…` clears to the gated card; the founder builds it after the brand kit is locked.

## Technical notes

- `supabase/functions/venture-bulk-generate/index.ts` — drop `website_prd` from the run's type list (seed it `pending` + `blocked_reason` instead); replace `generateOne` internals with an internal invoke of `venture-generate-document` (`{ snapshotId, documentType, mode, round }`); keep layering, concurrency (6), heartbeat and live progress here. Total count for progress excludes the gated PRD.
- `supabase/functions/venture-generate-document/index.ts` — accept `mode: full|trimmed|minimal`; refuse `website_prd` unless `venture_brand_kits.status = 'locked'` (server-side gate, not just UI); generalise the draft checkpoint beyond `isPrd`; add PRD stage `enrich` between `draft` and `refine`.
- `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx` — dedicated Website PRD card: locked-brand gate, **Build website PRD** action, live status from the document row, and a stale badge after a brand re-lock.
- Brand lock path (`venture-brand-wizard`) — on lock, stamp `metadata.brand_locked_at` on an existing PRD so the hub can mark it stale.
- Migration: `create table public.venture_generation_events` + GRANTs (`select` to `authenticated`, `all` to `service_role`), RLS scoped to the snapshot owner and admins; `create or replace function public.sweep_stuck_generations()` without the two generation UPDATEs.
- `supabase/functions/venture-job-watchdog/index.ts` — include `failed` jobs in the stalled query; enforce the shared per-asset attempt cap.
- Admin: new generation-health card on `src/routes/_authenticated/_admin/admin.hub.tsx` reading `venture_generation_events`.
- No client-facing copy or layout changes; the hub already renders drift, Resume and Skip.
