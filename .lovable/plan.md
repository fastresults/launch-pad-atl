## AI-First Workflow Audit — Findings & Streamlining Plan

I traced every model call from intake through deliverable generation, assessment, roadmap, and ask. The wins from Phases 1–3 (canonical context + intake prefill) stopped at the client. The server-side AI layer still re-hydrates the same facts from scratch on every call and doesn't compound what it has already learned. Here's what to fix.

---

### Findings

**F1. Canonical context never crosses the server boundary.**
`getCanonicalFounderContext` exists in `src/lib/`. Every edge function (`venture-generate-document`, `venture-generate-assessment`, `venture-generate-roadmap`, `venture-deep-research`, `deliverables-ask`, `venture-bulk-generate`, `brief-prefill`, `founder-extract`) re-queries `venture_snapshots` + `attendee_*` tables ad-hoc and stuffs raw JSON into prompts. Same logic, 8 places, no provenance, no consistency.

**F2. Source material cache isn't propagated downstream.**
`attendee_documents.extracted_text` and `venture_snapshots.source_materials` are read by `venture-extract-concept` and `venture-deep-research` — but `venture-generate-document` (the workhorse) never sees them. The PDF the founder dropped is invisible to 34/35 deliverables.

**F3. Research brief is a single undifferentiated blob.**
`research_brief` is generated once and dumped wholesale into every deliverable prompt. A go-to-market doc gets the same background as a legal-entity doc. Token waste and signal dilution.

**F4. No "venture context pack" — every call rebuilds context from scratch.**
Each generation re-serializes founder card + concept + brand tokens + extracted data + research brief. ~8–12KB of identical prefix per call, 34+ deliverables = ~400KB of redundant prompt tokens per snapshot, repeated on rewrites and assessments. No prompt caching, no shared builder.

**F5. Learnings from one deliverable don't compound into the next.**
When the founder fills the Budget Pro-Forma intake with real numbers, those numbers stay on `venture_documents.intake_answers` for that one doc. The Financial Model, Pricing Strategy, and Roadmap regenerate without them. The "knowledge graph" exists in scattered rows but no function reads across them.

**F6. Dependency context is dumped as full markdown, not distilled.**
`venture-generate-document` injects upstream docs verbatim (~600–900 words each × N deps). By the time the Launch Content Kit runs, its prompt carries 5+ full upstream documents. Should be a 3–5 bullet distillation per upstream.

**F7. Model selection is inconsistent and not tuned to task.**
Mix of `gemini-2.5-flash` and `gemini-3-flash-preview` with no rule. Extraction/classification tasks (cheap, narrow) use the same model as synthesis (broad, judgment). No reasoning-tier model anywhere — even for roadmap synthesis, which would benefit.

**F8. `deliverables-ask` stuffs the entire corpus.**
No retrieval, no embeddings — every Q gets the full deliverable list pushed into the prompt. Will break at ~50 docs and is already slow.

**F9. No streaming on the long generations.**
`venture-generate-document`, `venture-generate-assessment`, and `venture-generate-roadmap` block for 20–60s with a spinner. Streaming would cut perceived wait dramatically and let users abort early.

**F10. Intake answers don't write back to canonical store.**
A founder enters monthly burn = $4,200 in the Budget intake. That number never lands in `attendee_profiles.monthly_burn`, so the Profile page still shows blank and the next deliverable's intake re-asks.

---

### Streamlining Plan (5 changes, in order)

**S1. `_shared/venture-context.ts` — single server-side context builder.**
Mirrors `getCanonicalFounderContext` server-side and adds snapshot + source-material + research-brief + prior-deliverable facts. Returns a typed `VentureContext` object plus a `compact()` method that emits a ~600-token preamble. Every edge function imports this and stops re-querying. One place to evolve, consistent prompts, instant token savings.

**S2. Compute a "Snapshot Brain" once per snapshot.**
After extraction + research, run one synthesis pass that produces a structured `snapshot_brain` JSON on `venture_snapshots`:
```
{ identity, problem, solution, customer, business_model_summary,
  market_facts[], differentiators[], known_numbers{}, banned_assumptions[] }
```
~400 tokens. Every downstream generator uses this *instead of* the raw blobs. Refreshed only when source materials change.

**S3. Per-deliverable context router.**
Each `deliverable_types` row gets a `context_keys` array (e.g. budget pro-forma → `["known_numbers","customer","business_model_summary"]`). The shared builder slices the brain to only what the deliverable needs. Eliminates F3 + F6 in one move and stops feeding legal docs marketing background.

**S4. Intake answers → canonical writeback.**
When `venture-generate-document` accepts intake answers, the same payload is mapped (via a small `INTAKE_TO_CANONICAL` map) into `attendee_profiles` / `attendee_business_brief` so the next deliverable, the next venture, and the Profile page all benefit. Closes the loop on F10.

**S5. Streaming + model tiering.**
- Switch `venture-generate-document`, `venture-generate-assessment`, `venture-generate-roadmap` to streaming via the AI Gateway. Wire `useChat`-style tokens-as-they-arrive into the viewer.
- Adopt a 3-tier model rule in `_shared/models.ts`: `extract` (gemini-2.5-flash), `compose` (gemini-3-flash-preview), `synthesize` (gemini-3-pro for brain + roadmap). Every function reads from one constant.

---

### Technical notes (for build phase)

- New table: none. Add columns `venture_snapshots.snapshot_brain jsonb`, `deliverable_types.context_keys text[]`.
- Tokens: F4 + F6 fixes alone should cut average prompt size by ~70%.
- `deliverables-ask` (F8) is a separate, larger change (embeddings + pgvector). Flag as Phase 5 — not in this scope.
- No client UI changes required for S1–S4; S5 streaming touches `DocumentViewer` and the workflow page.

---

### Recommended sequence

Do S1 + S2 together (they're the foundation). Then S3 (depends on S2). Then S4 (independent, small). S5 last (UX polish — biggest perceived win).

Confirm and I'll start with S1 + S2.
