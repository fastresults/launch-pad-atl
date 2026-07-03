
## What's actually happening

Your assets count (34/34) reads straight from `attendee_deliverables`, so the top row is fine. The **Memory chunks: 0** comes from `founder_brain_memory`, and that table is empty.

Evidence from Lovable Cloud:
- `founder_brain_memory` has **0 rows** for every user.
- The AI Gateway shows exactly **one** embedding call ever (`openai/text-embedding-3-small`, 200 OK, 309ms) — meaning your "Rebuild memory" click embedded the first chunk, then the function died before doing anything else. No error logs are captured, so it's failing silently.

Three real bugs in `supabase/functions/brain-reindex/index.ts` combine to produce this:

1. **The vector is inserted as a raw JS array cast to `string`** (`embedding: embedding as unknown as string`). PostgREST + pgvector wants the literal string form `"[0.1,0.2,...]"`. The first insert silently returns an error, and because we don't check `{ error }` from `.insert()`, we never see it.
2. **Per-chunk errors are only `console.error`'d**, but the outer function still exits successfully — so from the UI it looks like "done, 0 chunks."
3. **Sequential embed-per-chunk over ~70+ chunks** exceeds the edge function's wall-clock budget on a normal founder profile, so even when we fix #1 the run will time out (150s IDLE_TIMEOUT).

The `embedText` helper is also using `Authorization: Bearer …`; the gateway accepts it today but the documented header is `Lovable-API-Key`, so we'll normalize.

## The fix

Convert reindex from a synchronous "do it all in one HTTP call" into a **queued background job with live progress**, matching the pattern the rest of the app already uses for long-running generations.

### 1. New table: `brain_indexing_jobs`

Tracks one row per rebuild.

| column | purpose |
| --- | --- |
| `user_id` | owner |
| `status` | `queued` / `running` / `done` / `failed` |
| `total_sources`, `total_chunks` | planned work |
| `embedded_chunks`, `failed_chunks` | live progress |
| `error_message` | last fatal error, if any |
| `started_at`, `finished_at` | timing |

RLS: owner + admin can read their own jobs; only service_role writes.

### 2. Rewrite `supabase/functions/brain-reindex/index.ts`

- Authenticate the caller, create a `brain_indexing_jobs` row with `status='queued'`, and **return `202 { jobId }` immediately.**
- Kick off the actual work via `EdgeRuntime.waitUntil(runJob(jobId))` so the response returns instantly and the worker keeps running up to the function's background budget.
- Inside `runJob`:
  - Collect the same sources as today (brief, founder, market, goals, deliverables, assessments, notes).
  - Chunk everything first, update `total_sources` / `total_chunks` on the job row.
  - For each chunk: embed → insert → update `embedded_chunks`/`failed_chunks`. Wrap insert to actually check `{ error }` and log to `error_message` on the job row when it fires (first failure only).
  - Send the vector as `` `[${vec.join(",")}]` `` — the pgvector-safe literal.
  - Small `Promise.all` batches of 4 concurrent embeds to stay under the wall-clock budget without hammering the gateway.
- Mark `status='done'` (or `'failed'` with `error_message`) at the end.
- Fix `_shared/brain-embed.ts` to use `Lovable-API-Key` header and to return the vector as-is (the caller does the stringification).

### 3. New endpoint: `brain-reindex-status`

Tiny GET `?jobId=…` that returns `{ status, embedded_chunks, total_chunks, failed_chunks, error_message }`. Called by the UI every 1.5s while a job is running.

### 4. UI changes in `src/routes/_authenticated/dashboard/brain.tsx`

- "Rebuild memory" now:
  1. Calls `brain-reindex`, gets a `jobId`, stores it.
  2. Swaps the button for a live progress bar: `Embedding 42 / 176 chunks…` with a spinner.
  3. Polls `brain-reindex-status` every 1.5s.
  4. On `done`, refreshes the status grid (Memory chunks should now match `total_chunks`) and shows a success toast. On `failed`, surfaces `error_message` in a destructive toast.
- The status grid picks up the new count from `founder_brain_memory` as before — no schema change to the grid.
- Add a subtle "Last rebuilt … · 176 chunks" line under the button using the most recent completed job.

### 5. `src/lib/brain.functions.ts`

- `rebuildBrainMemory()` returns `{ jobId }` instead of blocking.
- Add `pollBrainJob(jobId)` returning the status row.
- `getBrainStatus()` also returns the most recent job so the UI can render "Last rebuilt" without an extra call.

## Files touched

- **New migration** — `brain_indexing_jobs` table + policies + grants.
- `supabase/functions/brain-reindex/index.ts` — queue + background worker.
- `supabase/functions/brain-reindex-status/index.ts` — new, polling endpoint.
- `supabase/functions/_shared/brain-embed.ts` — header fix, vector stays as `number[]`.
- `src/lib/brain.functions.ts` — job kickoff + polling helpers.
- `src/routes/_authenticated/dashboard/brain.tsx` — progress bar, poller, last-rebuilt line.

## Why this fixes the 0

The insert error will no longer be silent (checked + surfaced to the job row), the vector will actually land in pgvector (correct literal), and the run won't time out (background job with small concurrency), so a 34-asset founder ends up with real embeddings and a real Memory chunks count — with a visible progress bar while it happens.
