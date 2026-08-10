# Fix the stuck 62-of-63 run — and stop it happening to anyone else

## Are we stuck?

Yes, effectively. Right now for this venture:

- 62 assets complete, 2 not applicable, **1 still generating: the website build brief (`website_prd`)**.
- The job row says `status: running`, `progress_pct: 37`, `resume_count: 1`, last heartbeat 15:25:10.
- That document's last recorded error is literally `Generation stalled — worker dropped.` — written by the watchdog, not by a real failure.

## Why it freezes (confirmed, not guessed)

Three separate defects stack up:

**1. The watchdog kills the longest asset while it is still working.**
The website build brief is deliberately the slowest document: Pro model, 24k output tokens, a **180-second** allowed call time. The job's heartbeat is only written *before* and *after* each document. The watchdog declares a run stalled after **180 seconds** without a heartbeat. So a perfectly healthy PRD call trips the watchdog every time it runs long: the doc is flipped to `failed`, the job is "auto-resumed", and a second worker starts the same expensive document again. That is the freeze loop the user is watching.

**2. Auto-resume runs out and the job parks.**
The watchdog resumes at most twice. Third strike, the job flips to `paused` and nothing else moves it — the founder is left on a progress bar that never advances and has only a Stop button.

**3. The percentage lies.**
The bar shows `62 of 63 done` next to **37%**, because while a job is running the UI reads `job.progress_pct`, and that number is computed from work done *inside the current run* (`state.done / state.total`), not from the real completed count. A resumed/retry-only run starts near zero and reports a collapse in progress.

## The fix

**A. Heartbeat while working, not just between documents.**
Start a heartbeat ticker (every ~20s) around each `generateOne` call so a long, healthy generation keeps the job alive. A heartbeat gap then means what it is supposed to mean: the worker actually died.

**B. Give the watchdog a stall threshold longer than the slowest legal call.**
Raise the generation-job stall window to ~6 minutes (above the 240s worst-case minimal-mode timeout), and never flip a document out of `generating` unless its own `updated_at` is older than that window too. No more killing in-flight work.

**C. Make the progress number truthful.**
Compute `progress_pct` from the real count of complete documents over the venture's total (the code already does this at job completion — do it on every update), and have the UI fall back to the DB-derived count whenever it is higher than the job's number. `62 of 63` will read ~98%.

**D. A paused job must be recoverable by the founder and by the system.**
- Watchdog: after resumes are exhausted, keep sweeping paused jobs on a longer interval instead of abandoning them, capped so credits aren't burned in a loop.
- UI: when the job is `paused`, or `running` with no heartbeat for 6+ minutes, the hero card stops pretending and shows **"Paused — resume"** with the failing asset named, plus a **Resume** button (retry-only) and a **Skip this asset** option so one stubborn document can never hold the other 62 hostage.

**E. Unstick this venture now.**
Reset `website_prd` to `failed` (clearing the false "worker dropped" text), mark the job `paused`, and re-run it retry-only so it regenerates once with the fixes in place.

## Technical notes

- `supabase/functions/venture-bulk-generate/index.ts` — heartbeat ticker wrapper around `generateOne` in `runLayer`; change the `progress_pct` writes at lines ~609 and ~885 to use a live complete-count query rather than `state.done`.
- `supabase/functions/venture-job-watchdog/index.ts` — `STALL_MS` 3min → 6min; only flip `venture_documents` rows whose own `updated_at` predates the cutoff; add a bounded sweep for `paused` jobs.
- `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx` — `pct` (line ~1190) takes `Math.max(job.progress_pct, completeCount/total)`; add the paused/stalled hero state with Resume and Skip actions.
- No schema change required; the `resume_count`, `heartbeat_at`, and `retry_round` columns already exist.
