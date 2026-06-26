## AI-first audit — round 2 findings

After S1–S5 shipped, I traced every AI surface end-to-end. The shared context builder + brain + tier routing now power **only 2 of the 11 generation functions**. The biggest cost & quality leaks have moved — they're no longer in the on-demand assessment path, they're now concentrated in the bulk path and a few stale-data paths.

### Findings (ranked by impact)

**F1 — Bulk generator bypasses everything we built (CRITICAL)**
`venture-bulk-generate/index.ts` has its own inline `generateOne()` that re-queries the snapshot, dumps the full founder card + the full `extracted_data` blob + the full `research_brief` JSON + every upstream doc verbatim, all on a single hard-coded `gemini-3-flash-preview`. This is the path the founder triggers via *Run Remaining* / *Start writing* — it runs 30+ times per venture. None of the S1/S2/S3/S5 work touches it. Net result: ~70% of the wins we just shipped are not realized on the main path.

**F2 — Snapshot brain is never refreshed**
`computeSnapshotBrain` runs once (first deep-research call or first document generation), then the snapshot is frozen. Subsequent uploads, URL scrapes, new intake answers, or rewrites with feedback do not invalidate it. After 2-3 hours of workshop work the brain is stale and every generator downstream is reasoning off old facts.

**F3 — Intake answers write back to canonical store but not the brain**
S4 pushes intake answers into `attendee_profiles` / `attendee_business_brief`, but the brain (which is the only thing later generators see) isn't recomputed. So learnings don't actually compound — they sit in tables nobody reads at generation time.

**F4 — Two parallel assessment functions**
`venture-generate-assessment` was refactored last turn. `attendee-generate-assessment` is a near-duplicate older sibling still on Flash with its own raw-blob prompt. Two code paths, one user-facing concept.

**F5 — No tier routing on bulk path**
Even with `venture_document_types.model_tier` populated, the bulk generator ignores it. Executive Summary, Financial Model, Pitch Deck all currently run on Flash during bulk. Conversely, lightweight docs (taglines, hashtag lists, calendar entries) could run on `gemini-3.1-flash-lite` for ~5x cost savings.

**F6 — Brain computation itself is overweight**
Brain prompt dumps up to 60K chars of source text + full research brief into Flash to produce 1500 chars out. Compact preamble + 6K capped sources would produce an equivalent brain on flash-lite at ~10% the cost.

**F7 — Track-tone block is duplicated across 5 functions**
Same 8-track tone dictionary is copy-pasted in bulk-generate, generate-document, deep-research, generate-assessment, generate-roadmap. Drift is already happening (some have `ecommerce_dtc`, some don't).

**F8 — Roadmap & deep-research still inject raw research_brief**
The brain already condenses research into `market_facts[]` + `differentiators[]`. These two functions still re-stuff the original JSON on top — duplicative tokens, contradictory facts when brain and brief drift.

**F9 — No streaming anywhere**
Every generate-document call is a blocking POST. Founder stares at a spinner for 15–30s per doc. SSE via `streamText` + `toUIMessageStreamResponse` would let the UI render as the model writes — same total time, dramatically better perceived speed and the user can read & cancel mid-doc.

**F10 — `venture-source-extract` doesn't dirty the brain**
When a founder drops a new doc and we cache its `extracted_text`, brain stays stale until the next manual deep-research or document run.

**F11 — Specialized prompts live inside `venture-bulk-generate`**
The 13 specialized doc prompts (website_prd, brand_strategy, etc.) are ~3KB each inside bulk-generate. The on-demand `venture-generate-document` doesn't import them — it falls back to the generic prompt. Same deliverable, two qualities, depending on entry point.

---

### Proposed streamlining (4 packages, in order)

**P1 — Unify the bulk generator on shared context (highest-impact, lowest-risk)**
Refactor `venture-bulk-generate.generateOne()` to:
- Call `loadVentureContext()` once per job (not per doc) and pass the ctx into each generation.
- Replace founder card + extracted_data + research_brief dump with `compactPreamble(ctx)` + `pickBrainSlice(ctx.brain, type.context_keys)`.
- Replace full upstream-doc dumps with `distillDeps(depDocs)`.
- Honor `type.model_tier` → route between `gemini-3.1-pro-preview` and `gemini-3-flash-preview` (and add `gemini-3.1-flash-lite` for light docs marked `tier=lite`).
- Add `type.model_tier='lite'` to the catalog for the 8-10 light deliverables (taglines, hashtag seeds, content calendar entries, alt-text variants).

Expected: ~60-70% prompt-token reduction on bulk runs, +1 quality tier on the 5 strategic docs, ~30% net cost drop.

**P2 — Move shared prompts & track tones into `_shared/`**
- Create `supabase/functions/_shared/track-tones.ts` (single source of truth).
- Create `supabase/functions/_shared/deliverable-prompts.ts` exporting the specialized prompt map.
- Import from both `venture-bulk-generate` and `venture-generate-document` so single-doc regeneration matches bulk output exactly.

**P3 — Brain freshness loop (compounding learnings)**
- Add `snapshot_brain_dirty` boolean to `venture_snapshots`.
- Triggers / writebacks that set it to true:
  - `venture-source-extract` after caching new text
  - `venture-generate-document` after writing intake_answers to canonical
  - `venture-concept-refine` after a rewrite-with-feedback
- Modify `ensureSnapshotBrain` to recompute when dirty (cheap on flash-lite per P4).
- Result: brain truly compounds across the session.

**P4 — Slim the brain computer itself**
- Switch `computeSnapshotBrain` to `gemini-3.1-flash-lite`.
- Feed it `compactPreamble(ctx)` + `renderSources(ctx, 4000)` instead of raw snapshot dump.
- Drop `extracted_data` & full `research_brief` from the prompt — those are already captured in the preamble fields.

---

### Optional follow-ons (smaller wins)

- **F9 / streaming**: convert `venture-generate-document` to `streamText` + `toUIMessageStreamResponse` and consume in `DocumentViewer` for per-doc render. Best UX gain after P1.
- **F4 / merge assessments**: delete `attendee-generate-assessment` and route its one caller (`src/lib/userPipeline.functions.ts:95`) to `venture-generate-assessment`. Removes 389 lines of dup.
- **F8 / strip raw research_brief from roadmap & deep-research prompts** once brain is reliable.

### Scope of this round

If you approve, I'll execute **P1 + P2 + P3 + P4** as one batch (they share files and are independently testable). The optional follow-ons (streaming, merge assessments) I'll list as separate "say go" items because each has UI surface area.

### Technical notes

- No schema changes other than `snapshot_brain_dirty boolean` on `venture_snapshots` and a `tier='lite'` enum value (already free-text). RLS/GRANT unchanged.
- All four packages are server-side. No client code changes required for P1-P4.
- Backward compatible: existing snapshots without a brain fall back to the current behavior on first hit, then upgrade.

Estimated effect on a full venture run (35 deliverables):
- Prompt tokens: ~−65%
- Wall-clock: ~−20% (smaller prompts decode faster on Flash, fewer Pro calls in absolute terms)
- Credits: ~−35% net (Pro routing adds cost on 5 docs, lite routing removes it on 10, smaller prompts dominate)
- Quality: strict +1 tier on Exec Summary / Financial Model / Pitch Deck / GTM / Budget; equivalent elsewhere.