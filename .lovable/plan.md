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

## ✅ Package E2 (shipped)
- F17 removed admin cohort test harness route + UI entry (route deleted, App.tsx + admin.cohorts.tsx cleaned)
- F18 `setUserRole` now routes through `admin_set_user_role` SECURITY DEFINER RPC with is_admin check, super_admin-only escalation, and last-super_admin protection
- F21 `handle_new_user` serialized via `pg_advisory_xact_lock` and bootstrap now checks for any existing super_admin instead of counting auth.users (eliminates concurrent-signup race)

## ✅ Package E3/E4 (shipped)
- F22 brand-intake + brand-creative admin gate switched to service-role `is_admin` RPC (single authoritative read, closes TOCTOU window)
- F25 storage.objects "Public can read deck-images" replaced with authenticated-only SELECT (app uses signed URLs — no UI impact)
- F26 inquiry_messages.author_id now defaults to `auth.uid()` so admin replies record their identity automatically
- F27 member_intakes UPDATE policy gained `WITH CHECK` so users can't reassign an intake to another user_id
