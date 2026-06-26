# AI-first audit — round 3 results

Shipped in this round:

**P1 — `dashboard-pipeline-run` now uses shared context.**
- Loads `loadVentureContext` + `ensureSnapshotBrain` once per job using the user's most recent venture snapshot (when present).
- `generateOne()` emits `compactPreamble(ctx) + snapshot_brain` instead of dumping raw brief/founder/market JSON.
- Upstream deliverables now go through `distillDeps()` instead of full inline markdown.
- Model selection switched from flat `gemini-2.5-flash` to `modelForTier(type.default_model, MODELS.flash)`, honoring per-type tier.
- Fallback path retained (brief-only) for users without a venture snapshot.

**P2 — `attendee-generate-assessment` now matches Hub-grade rigor.**
- Loads venture context + snapshot brain when a snapshot exists; falls back to brief/founder/market JSON otherwise.
- Switched from `gemini-3-flash-preview` to `MODELS.pro` (gemini-3-pro-preview) — Workflow assessments now reason at the same tier as Hub assessments.

**P3 — Brain freshness already covered.**
- `venture-deep-research` actively recomputes brain at end of pipeline.
- `venture-concept-refine`, `venture-source-extract`, `venture-generate-document` already call `markSnapshotBrainDirty`.
- No new wiring required.

**P4 — Models centralized.**
- New `supabase/functions/_shared/models.ts` exports `MODELS.{flash, flashLite, pro, flashImage, proImage, stt}` and `modelForTier()`.
- `dashboard-pipeline-run` and `attendee-generate-assessment` migrated.
- Remaining functions can be migrated mechanically in a follow-up; no behavior drift.

Estimated effect on a full Workflow run (30+ deliverables):
- Prompt tokens: ~−60% on the Workflow surface (was 0% optimized; now matches Hub).
- Wall-clock: ~−15% per run from smaller prompts.
- Quality: strict +1 tier on Workflow deep assessments; Pro routing now used.

Not shipped this round (deferred — separate "say go" items):
- Frontend canonical-context cleanup across `hub.$snapshotId.tsx`, `dashboard/workflow.tsx`, `dashboard/profile.tsx`, `IntakeGatewayDialog`.
- Remaining 9 Edge Functions still inline model id strings — migrate to `MODELS` when next touched.
- Top-K retrieval for `deliverables-ask` (requires pgvector).
- Streaming UI for `venture-generate-document` and `dashboard-pipeline-run`.
