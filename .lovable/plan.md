# Audit findings — production hardening for the AI-first workflow

The streamlining work removed redundancy. This pass fortifies the workflow so it survives concurrent users, flaky networks, accidental double-clicks, abusive looping, and partial failures.

## Headline gaps found

1. **CRITICAL — Five AI endpoints have no JWT or ownership check.** `venture-generate-document`, `venture-generate-assessment`, `venture-generate-roadmap`, `venture-deep-research`, and `brief-prefill` accept calls from anyone who knows the URL. The two most expensive Pro-model endpoints (assessment, roadmap) are wide open. `venture-bulk-generate` also has a category-run path that bypasses auth.
2. **HIGH — No retries, no timeouts on AI Gateway calls.** Every gateway `fetch` is one-shot. A single 429 or transient 5xx fails the whole deliverable. Hung connections can hold the function until the platform kills it.
3. **HIGH — Bulk job + per-doc "generating" state is not atomic.** Concurrent requests (double-click, mobile retry) double-spend AI credits and corrupt version history.
4. **HIGH — Roadmap & deep assessment run synchronously inside the HTTP handler.** Pro-tier latency on large prompts can blow past the Edge Function wall clock.
5. **HIGH — `source_materials` JSONB is never updated when files are attached post-creation.** Brain gets marked dirty, but recompute reads the same stale blob. Files uploaded after the venture exists are silently invisible to AI.
6. **HIGH — No per-user rate limit or daily AI-cost ceiling.** One logged-in user looping a button can drain workspace credits.
7. **MEDIUM — Orphaned `generating` rows never clean up.** A worker killed mid-call leaves docs stuck forever.
8. **MEDIUM — Frontend buttons not bulletproof.** Auto-kick is keyed to localStorage; per-document Generate buttons don't track in-flight set; category buttons don't cross-disable.
9. **MEDIUM — No failure logging for roadmap/assessment;** no correlation IDs anywhere; users can't read their own `ai_pipeline_runs` (missing RLS SELECT policy).
10. **LOW — Canonical context 2-min stale window;** prompt size caps missing on two `generateOne` paths; no count cap on injected source documents.

## Recommendation — phased hardening

### Phase 1 — Lock the doors (critical, ship today)
1.1 Add JWT auth + snapshot-ownership check to the 5 unprotected functions, using the existing `venture-concept-refine` pattern.
1.2 Fix `venture-bulk-generate` so the category-run path also requires `callerId` and verifies `snap.user_id === callerId`.
1.3 Add a shared `_shared/ai-fetch.ts` helper that wraps every Gateway call with `AbortSignal.timeout(90s)` + exponential backoff (1s/3s/9s) on 429/5xx. Migrate every gateway call site to it.

### Phase 2 — Stop double-spending (high, this week)
2.1 Replace `venture-bulk-generate`'s SELECT-then-INSERT with `INSERT ... ON CONFLICT DO NOTHING RETURNING id` (or a partial unique index on `(snapshot_id) WHERE status IN ('queued','running')`).
2.2 Add a partial unique index on `venture_documents (snapshot_id, document_type) WHERE status = 'generating'` so concurrent single-doc generates collapse to one.
2.3 Add a pg_cron sweeper (every 5 min) that marks `venture_documents.status='generating'` older than 10 min as `failed`, and the same for `venture_generation_jobs.heartbeat_at`.
2.4 Frontend: track in-flight document types in a `Set` for the per-doc Generate button; cross-disable all category buttons when any category is running; move the workflow auto-kick flag off localStorage to a server-side signal (`remainingCount === triggerable.length` + `ai_pipeline_runs` count).

### Phase 3 — Survive long jobs (high, this week)
3.1 Refactor `venture-generate-roadmap` and `venture-generate-assessment` to return `{ ok: true, jobId }` immediately and run the actual generation in `EdgeRuntime.waitUntil`. Add status columns/rows already in place (`roadmap_status`, `deep_assessment_status`) plus a `*_started_at` so the UI can poll.
3.2 Add per-step `AbortSignal.timeout` to `venture-deep-research` and `venture-concept-refine/epiphanyPipeline`.

### Phase 4 — Fix the silent source bug (high)
4.1 In `venture-source-extract`, after writing `attendee_documents.extracted_text`, also append/update the document inside `venture_snapshots.source_materials.documents` so `loadVentureContext` sees it.
4.2 Backfill migration: rebuild `source_materials` from `attendee_documents` for snapshots with attached but unsynced files.

### Phase 5 — Throttle and cap (high)
5.1 New table `ai_call_counts(user_id, day, endpoint, count)` with an RPC `incr_and_check(user_id, endpoint, daily_cap)` that returns false when over the cap. Wire into the five expensive endpoints with sensible caps (e.g. roadmap 5/day, assessment 25/day, document 200/day).
5.2 Add `userPrompt.slice(0, 120_000)` in `venture-bulk-generate/generateOne` and `dashboard-pipeline-run/generateOne`.
5.3 Cap `sources.documents` to the most-recent 10 items in `renderSources`.

### Phase 6 — See what's happening (medium)
6.1 Roadmap and assessment failures: insert into `venture_generation_failures` on catch (matches the existing document pattern).
6.2 Generate a UUID `runId` per `generateOne` call; log it with model, prompt-char count, latency, and gateway status; store on `venture_generation_failures.run_id` when applicable.
6.3 RLS: add `Users read own pipeline runs` SELECT policy on `ai_pipeline_runs`.

### Phase 7 — Polish (low, backlog)
7.1 Zod schemas at every Edge Function entry.
7.2 Reduce `useCanonicalContext` `staleTime` to 30 s; consider Realtime invalidation on `attendee_profiles`.
7.3 Advisory lock around `ensureSnapshotBrain` recompute to stop dual recomputes.
7.4 Document that founder/market profile is intentionally user-scoped (shared across that user's ventures).

## Technical notes (engineer-only)

- Auth pattern to copy verbatim from `supabase/functions/venture-concept-refine/index.ts:233-244` (JWT validate → `auth.getUser()` → snapshot ownership query).
- New `_shared/ai-fetch.ts`: signature `aiFetch(url, init, { timeoutMs=90_000, retries=2 })`; treat status `429`, `500`, `502`, `503`, `504` as retryable; preserve `Lovable-API-Key` and content-type.
- Partial unique index example:
```text
CREATE UNIQUE INDEX venture_documents_inflight_unique
  ON venture_documents (snapshot_id, document_type)
  WHERE status = 'generating';
```
- Sweeper as `cron.schedule('hardening-sweep', '*/5 * * * *', $$ ... $$)`.
- Background generation: return early, then `EdgeRuntime.waitUntil(generateAssessment(...))`; UI already has `deep_assessment_status` so polling needs no schema change beyond a `*_started_at` timestamp.
- `ai_call_counts` table: `(user_id uuid, day date, endpoint text, count int, PRIMARY KEY (user_id, day, endpoint))` with `GRANT EXECUTE ON FUNCTION incr_and_check TO authenticated`.

## Out of scope (intentionally)

- Streaming UI for long generations (separate UX project).
- pgvector / top-K retrieval (separate AI project).
- Migration of remaining 9 functions to the centralized `_shared/models.ts` — mechanical, will happen as each file is next touched.

## Suggested sequencing

Ship Phase 1 in one PR (auth + timeouts/retries) — biggest risk reduction, no UX changes. Phases 2–5 can ship as four follow-up PRs in parallel paths since they touch different files. Phase 6 + 7 are observability/polish.
