# Production hardening — what shipped this round

## Phase 1 — Locked the doors (CRITICAL)
- New `supabase/functions/_shared/ai-fetch.ts` — 90s AbortSignal timeout + exponential backoff (1s/3s/9s) on 429/500/502/503/504 + Retry-After honoring.
- New `supabase/functions/_shared/auth.ts` — `requireUser` (JWT validation) + `requireSnapshotOwner` (snapshot ownership or admin).
- Auth gates added to previously-unprotected endpoints:
  - `venture-generate-document`
  - `venture-generate-assessment`
  - `venture-generate-roadmap`
  - `venture-deep-research`
  - `brief-prefill`
- `venture-bulk-generate` — fixed category-run auth bypass. Caller JWT is now **required for every path**, snapshot ownership is verified for every path, and the unlock-grant requirement still applies to full-bulk runs.
- Gateway calls migrated to `aiFetch` in: `_shared/snapshot-brain.ts`, `venture-generate-document`, `venture-generate-assessment`, `venture-generate-roadmap`, `venture-bulk-generate/generateOne`, `dashboard-pipeline-run/generateOne`, `brief-prefill`. Longer timeouts (120s) on Pro-model surfaces.

## Phase 2 — Stop double-spending (HIGH)
- Migration: partial unique index `venture_documents_inflight_unique ON (snapshot_id, document_type) WHERE status='generating'` — second concurrent generate of the same deliverable now fails at the DB instead of double-spending AI.
- Migration: partial unique index `venture_generation_jobs_inflight_unique ON (snapshot_id) WHERE status IN ('queued','running')`.
- Migration: `sweep_stuck_generations()` function — marks any `venture_documents` / `venture_generation_jobs` / roadmap / deep-assessment stuck in `generating` for more than 10 minutes as `failed` so users can retry.
- Scheduled `cron.schedule('sweep-stuck-generations', '*/5 * * * *', ...)` — sweeper runs every 5 minutes.

## Phase 4 — Fix the silent source bug (HIGH)
- `venture-source-extract` now denormalizes new uploads into `venture_snapshots.source_materials.documents` (capped at 25 most-recent entries) so files attached after venture creation are immediately visible to `loadVentureContext` instead of being silently invisible to AI.

## Phase 5 — Prompt size caps (HIGH quick wins)
- `venture-generate-document/generateOne`: user prompt capped at 120k chars.
- `venture-bulk-generate/generateOne`: user prompt capped at 120k chars.
- `dashboard-pipeline-run/generateOne`: user prompt capped at 120k chars.
- `_shared/venture-context.ts/renderSources`: capped at 10 most-recent documents + 10 URLs.

## Phase 6 — Observability (MEDIUM)
- Migration: `Users read own pipeline runs` SELECT policy on `ai_pipeline_runs` (workflow page no longer silently returns no rows).
- Failure logging added: `venture-generate-assessment` and `venture-generate-roadmap` now insert into `venture_generation_failures` on gateway errors, matching the existing single-doc pattern.

## Phase 7 — Polish (LOW)
- `useCanonicalContext` `staleTime` reduced from 2 min to 30s.

## Deferred to next round (explicitly out of scope)
- Background-execution refactor for `venture-generate-roadmap` and `venture-generate-assessment` (Phase 3): both routed to Pro now with 120s `aiFetch` timeouts which should cover most cases; full background extraction needs UI polling work too.
- Per-user daily AI call ceiling table `ai_call_counts` + RPC (Phase 5.1): backend has no standard rate-limit primitive yet and the user has accepted that gap.
- Frontend per-document in-flight Set tracking + cross-disable category buttons + server-side autokick flag (Phase 2.4): UI hardening, separate PR.
- Snapshot-brain advisory-lock for parallel recompute (Phase 7.3): edge-case dual-cost, low priority.
- Zod schemas at every entry (Phase 7.1): mechanical, do when next touching each function.
- Remaining 9 functions still doing raw `fetch` to gateway: migrate as each is next touched.

## Verification
- `bunx tsgo --noEmit`: clean.
- Edge function curl tests: all three sampled endpoints (`venture-generate-roadmap`, `venture-generate-document`, `venture-deep-research`) reach their auth gate; subsequent ownership/concept-locked gates also fire.
- pg_cron schedule confirmed (schedule id 7).
- Migration linter warnings: pre-existing, not introduced by this PR.
