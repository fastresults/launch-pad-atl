# AI-first audit — round 3 findings

Rounds 1 and 2 cleaned up the Hub side: `venture-generate-document`, `venture-generate-assessment`, `venture-generate-roadmap`, and `venture-bulk-generate` now all share `loadVentureContext` + `compactPreamble` + `snapshot_brain` + tier routing, and brain freshness propagates on every relevant write.

Walking the rest of the codebase top-to-bottom, the **Hub path is clean**, but the **Workflow path (`attendee_deliverables`)** and a few sibling AI functions are still on the old "dump everything raw" pattern. Net result: founders on the Workflow surface and on the on-demand assessment surface get materially worse results than founders on the Hub, even though both surfaces sit on the same canonical tables.

### Findings (ranked by impact)

**F1 — `dashboard-pipeline-run` is the new bulk leak (CRITICAL).**
This is the worker behind *Run remaining* / per-deliverable triggers on `/dashboard/workflow`. It dumps the full brief + full founder + full market JSON into every prompt, hits a flat `gemini-2.5-flash` regardless of `default_model`, and never touches the snapshot brain, venture context, sources, or canonical resolver. Every founder run on this surface is reasoning off raw blobs while the Hub reasons off the brain. ~30 deliverables × full-blob prompt = the round-1/round-2 wins are skipped on this entire surface.

**F2 — `attendee-generate-assessment` duplicates `venture-generate-assessment` on raw blobs.**
389-line near-twin still on Flash, still injecting the full brief + founder + market + every other deliverable verbatim. The Hub path was upgraded to Pro + brain in round 2; this one was not. Same product concept, two qualities.

**F3 — `venture-deep-research` synthesizer still dumps raw corpus, ignores brain.**
The synthesizer call (line 230) hand-builds a corpus string and runs it through Flash. It already produces the inputs the brain depends on, so it should *also* invalidate the brain (it does the opposite — it overwrites `research_brief` and `extracted_data`, then never flips `snapshot_brain_dirty`). Result: brain goes stale the moment deep-research finishes.

**F4 — `venture-concept-refine` doesn't mark brain dirty.**
Round 2 added the dirty flag for source-extract and generate-document writebacks, but the rewrite-with-feedback path was missed. Founder rewrites concept → brain still reflects the pre-rewrite version → next document generation contradicts the new concept.

**F5 — Canonical reads are still duplicated 4 ways on the frontend.**
`useCanonicalContext` exists, but `hub.$snapshotId.tsx`, `dashboard/workflow.tsx`, `dashboard/profile.tsx`, and `IntakeGatewayDialog` still each load brief/profile/market individually in some places. The hook is wired but underused — there are ~6 places that re-fetch the same tables instead of subscribing to it.

**F6 — `deliverables-ask` rebuilds context per question.**
The Ask-or-Search Edge Function pulls every deliverable + brief + market on every question and stuffs them all into the prompt. No brain reuse, no top-K retrieval — at 30 deliverables this prompt is already ~80KB and growing as founders generate more.

**F7 — `brief-prefill` doesn't write back to canonical.**
Dropping a document into the Brief intake extracts answers, but the result lives only in `attendee_business_brief` after the user clicks save. The same extraction should also touch `attendee_profiles` / `attendee_market_profile` / `attendee_founder_profile` the same way the Hub intake gateway does. Today the founder has to retype the same data on the Profile page.

**F8 — Two model namespaces drift across functions.**
`google/gemini-3-flash-preview`, `gemini-3.5-flash`, `gemini-2.5-flash`, `gemini-3.1-flash-lite`, `gemini-3-pro-preview`, `gemini-3.1-pro-preview` are all in use simultaneously across 13 functions. No single source of truth → impossible to do a coordinated bump.

---

### Proposed streamlining (4 packages, in order)

**P1 — Unify the Workflow worker on shared context (highest impact).**
Refactor `dashboard-pipeline-run.generateOne()` to call `loadVentureContext` (resolving a venture from the user's primary snapshot, or all snapshots if multi-venture), emit `compactPreamble` + `pickBrainSlice` instead of raw JSON, distill upstream deliverables via `distillDeps`, and honor `deliverable_types.default_model` properly with a tier fallback. Mirrors what `venture-bulk-generate` already does on the Hub side.

**P2 — Collapse the two assessment functions.**
Delete `attendee-generate-assessment` and route its one caller (`userPipeline.functions.ts:runMyDeliverableAssessment`) to `venture-generate-assessment` with an `attendee_deliverable_key` mode. Single code path, Pro routing, brain-driven. Removes ~170 lines.

**P3 — Close the brain freshness loops.**
- `venture-deep-research` → `markSnapshotBrainDirty(snapshotId)` after writing `research_brief` + `extracted_data`.
- `venture-concept-refine` → `markSnapshotBrainDirty` after a successful rewrite.
- `brief-prefill` → write extracted fields back to `attendee_profiles` / `attendee_market_profile` / `attendee_founder_profile` and call the client-side `markAllMySnapshotBrainsDirty` from the dropzone's success handler.

**P4 — Centralize models + tighten frontend canonical use.**
- Create `supabase/functions/_shared/models.ts` exporting `MODELS.flash`, `MODELS.flashLite`, `MODELS.pro`, `MODELS.proImage`. Replace every literal string in the 13 functions. One file to bump models project-wide.
- Convert remaining duplicate brief/profile reads in `hub.$snapshotId.tsx`, `dashboard/workflow.tsx`, `dashboard/profile.tsx`, `IntakeGatewayDialog.tsx` to `useCanonicalContext`. Removes ~5 redundant table reads per page load.

### Optional follow-ons

- **F6 / deliverables-ask retrieval**: switch to top-K semantic search over deliverable summaries instead of dumping all. Requires `pgvector` and an embed pass on document writes — separate plan.
- **Streaming**: convert `venture-generate-document` + `dashboard-pipeline-run` to `streamText` for per-section render. UX win, no quality change.

### Scope of this round

If you approve, I'll execute **P1 + P2 + P3 + P4** as one batch. They share the shared/ module surface and are independently testable. F6 (retrieval) and streaming stay as separate "say go" items.

### Technical notes

- **No schema changes.** Reuses `snapshot_brain_dirty`, `default_model`, and the canonical tables already in place.
- All four packages are mostly server-side. P4's frontend half touches 4 files for read-path cleanup only — no behavior change.
- Backward compatible: ventures without a brain fall back to current behavior on first hit, then upgrade.

Estimated effect on a full Workflow run (30+ deliverables):
- Prompt tokens: **~−60%** on the Workflow surface (currently 0% optimized).
- Wall-clock: ~−15% (smaller Flash prompts, no extra Pro routing here).
- Quality: strict +1 tier on the Workflow assessments and on any deliverable currently flagged Pro/Pro-Image in `deliverable_types`.
- Maintenance: one models file, one assessment function, one context resolver — drift surface eliminated.
