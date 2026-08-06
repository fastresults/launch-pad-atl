# Run every asset until it's actually done

Today a bulk run makes one pass. Anything that errors (gateway hiccup, timeout, truncated output) lands in the failures list and just sits there — the founder sees "2 assets need another try" and has to hunt them down manually. Three consecutive errors also trip a circuit breaker that pauses the whole job.

This change makes the run finish itself: after the main pass, the job automatically loops back over anything that isn't complete and re-generates it with AI, escalating its approach each round, until every asset is written or a hard blocker is reported in plain language.

## How it will behave

1. Main pass runs as it does now (dependency layers, 6 at a time).
2. **Retry sweep** — the job then re-queries for any asset that isn't `complete` and runs up to **3 more rounds** over just those, with a short backoff between rounds (5s, 20s, 60s).
3. Each round changes tactics instead of repeating the same failing call:
   - Round 1: same settings, fresh attempt (covers transient gateway/timeout errors).
   - Round 2: trimmed prompt — drop the Second Brain corpus block and cap distilled dependencies, halving input size (covers context-length and slow-response failures).
   - Round 3: minimal prompt (preamble + brain slice only) on the faster model tier with a longer timeout — a shorter, plainer asset beats a missing one.
   - Truncated output (`finish_reason: length`) is treated as a retryable failure and re-run with a continuation pass rather than saved with a TRUNCATED marker.
4. **Blocked vs failed** — assets waiting on the founder (Brand Wizard not locked, required intake questions unanswered) are not retried forever. They're recorded as *blocked* with the action needed, and shown separately from real errors.
5. **Circuit breaker softens** — a paused job no longer ends the run. It pauses the main pass, then hands off to the retry sweep; only if a round completes with zero progress *and* every remaining asset failed the same way does the job stop and report.
6. **Watchdog auto-resume** — when the watchdog finds a stalled job, instead of only pausing it, it re-invokes the bulk function once for that snapshot so a dropped edge-runtime worker resumes on its own (max 2 auto-resumes per job, tracked on the job row).
7. Job only reports `completed` when nothing is left in a retryable state; otherwise `completed_with_blockers` with the specific list.

## What the founder sees

- Progress card gains a second line during sweeps: "Retrying 2 assets (round 2 of 3)…" so it's clear the system is still working, not stuck.
- The warning turns into two groups:
  - **Needs you** (blocked) — e.g. "Lock your Brand Wizard to unlock 4 assets", with a button that goes there.
  - **Couldn't write yet** — only shown after all retry rounds fail, with a "Try these again" button that kicks off a retry-only run.
- When the sweep succeeds, the warning disappears on its own and progress reaches 100% with no user action.

## Technical detail

**Migration**
- `venture_documents`: add `generation_attempts int not null default 0`, `last_error text`, `blocked_reason text`.
- `venture_generation_jobs`: add `retry_round int not null default 0`, `resume_count int not null default 0`, add `completed_with_blockers` to allowed status values.
- Grants unchanged (existing tables); no new tables.

**`supabase/functions/venture-bulk-generate/index.ts`**
- `generateOne(supabase, ctx, type, opts)` gains `opts: { mode: "full" | "trimmed" | "minimal" }` controlling whether `corpusBlock`, `sourcingBlock`, and full `depContext` are included, plus model tier and timeout.
- Brand-kit / intake gates write `blocked_reason` on the document instead of inserting into `venture_generation_failures`.
- New `retrySweep(supabase, ctx, jobId, types, state)` after the layer loop: for round 1..3, select non-complete, non-blocked types (respecting dependency order within the subset), await backoff, run `runLayer` with the round's mode, update `retry_round` and heartbeat each iteration; break early when nothing remains.
- Failures for a doc that later succeeds are cleared from `venture_generation_failures` so the UI count is accurate.
- Truncation handling: if `finish_reason === "length"`, issue one continuation call ("continue exactly where you left off") and concatenate before marking complete.
- Accepts `retryOnly: true` in the request body to run the sweep alone.

**`supabase/functions/venture-job-watchdog/index.ts`**
- After pausing a stalled job, if `resume_count < 2`, increment it and `fetch` the bulk function with the service key and `{ snapshotId, retryOnly: true }`, setting status back to `running`.

**Client**
- `src/lib/foundersHub.functions.ts`: `bulkGenerate` accepts `retryOnly`; `listFailures` also returns blocked docs (split by `blocked_reason`).
- `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx`: render the retry-round line from `job.retry_round`, split the warning into "Needs you" / "Couldn't write yet", and wire the "Try these again" button to `bulk.mutate({ retryOnly: true })`.
