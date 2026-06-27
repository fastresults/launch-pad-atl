# Workflow audit — findings (15)

## 🔴 CRITICAL (4) — raw fetch / open endpoints
- **F1** `venture-source-extract/index.ts:41` — `geminiTranscribe` uses raw `fetch`. Replace with `aiFetch`.
- **F2** `venture-synthesize-concept` + `venture-scrape-url` — no auth. Add `requireUser`.
- **F3** `venture-deep-research/index.ts:232,256` — two raw `fetch` calls. Replace with `aiFetch`.
- **F4** `venture-concept-refine/index.ts:27` — entire `callAI()` raw. Replace with `aiFetch`.

## 🟠 HIGH (4)
- **F5** Auth header mismatch: `venture-bulk-generate` uses `Lovable-API-Key`, `dashboard-pipeline-run` uses `Authorization: Bearer`. Standardize.
- **F6** `sweep_stuck_generations` skips `ai_pipeline_runs` queued state. Add UPDATE.
- **F7** In-flight unique index 23505 surfaces as 500. Catch in `generateOne` and return 409.
- **F8** `deck_slide_override_history` INSERT grant exposed to `authenticated`. Revoke; service_role only.

## 🟡 MEDIUM (7)
- **F9** `venture-concept-refine` `apply` action skips dirty mark.
- **F10** `venture-sources.ts:143` doesn't `invalidateCanonicalContext()` after extract.
- **F11** `venture-bulk-generate runLayer` catch swallows errors without `venture_generation_failures` row.
- **F12** `venture-scrape-url` SSRF guard misses decimal-encoded IPs.
- **F13** `venture-generate-document:178` fire-and-forget `writeBackIntake` races `markSnapshotBrainDirty`. Await it.
- **F14** `venture-job-watchdog` not confirmed scheduled; status name `paused` inconsistent.
- **F15** `venture-deep-research` never calls `markSnapshotBrainDirty` after writing `research_brief`.

## Recommended next-round plan (HARDENING-2)
- Package A (CRITICAL+F8): close raw-fetch + open-endpoint + privilege-escalation holes. ~30 min, 5 file edits + 1 migration.
- Package B (HIGH): friendly 409 on inflight collision, header standardization, sweeper coverage. ~30 min.
- Package C (MEDIUM): dirty-mark coverage (F9/F13/F15) + cache invalidation (F10) + SSRF (F12) + failure logging (F11) + watchdog cron (F14).
