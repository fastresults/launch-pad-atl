# Workflow hardening — status

## ✅ Package A (shipped)
- F1/F3/F4 raw fetch → aiFetch (source-extract, deep-research, concept-refine)
- F2 auth gates on synthesize-concept + scrape-url
- F8 deck_slide_override_history INSERT revoked from authenticated

## ✅ Package B (shipped this round)
- F5 venture-bulk-generate now uses `Authorization: Bearer` (matches every other worker)
- F6 sweep_stuck_generations extended to ai_pipeline_runs + ai_pipeline_steps (15-min cutoff)
- F7 venture-generate-document catches 23505 / `venture_documents_inflight_unique` → friendly 409
- F11 runLayer catch in bulk-generate now records a `venture_generation_failures` row instead of swallowing

## ✅ Package C (shipped this round)
- F9 venture-concept-refine `apply` action now marks brain dirty
- F12 venture-scrape-url SSRF guard rejects decimal / hex / octal / numeric-only IPv4 and all IPv6 literals
- F13 venture-generate-document awaits `writeBackIntake` before flagging brain dirty
- F15 venture-deep-research explicitly marks brain dirty before recomputing after research_brief change

## Deferred (intentionally not in this round)
- F10 invalidate `useCanonicalContext` after `uploadVentureSource`. Tradeoff: would couple a non-React lib to TanStack Query. 30s staleTime in `use-canonical-context.ts` masks the gap; revisit if users report stale prefill.
- F14 venture-job-watchdog cron schedule confirmation. Sweeper now covers pipeline runs, so the watchdog gap is reduced; full scheduling pass deferred.
