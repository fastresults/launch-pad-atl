# Concept Refinement Gateway

Insert a new mandatory step between deep research (status `review`) and bulk document generation. The user must produce/approve a tight 50–60 word concept summary + value proposition, optionally run AI-assisted brainstorming/innovation rounds, then explicitly "Lock concept" to unlock document generation.

## 1. Data model

Migration on `venture_snapshots`:
- `concept_summary` text — final 50–60 word summary (locked version)
- `value_proposition` text — competitive value prop (1–2 sentences)
- `concept_status` text default `'draft'` — `draft | refining | locked`
- `concept_locked_at` timestamptz
- `concept_iterations` jsonb default `'[]'` — append-only log of AI suggestions + user edits: `{ id, kind: 'draft'|'brainstorm'|'innovate'|'critique'|'user_edit', input, output, model, created_at }`

New status value for `venture_snapshots.status`: `concept_review` (between `review` and `generating`). Deep research completion sets status to `concept_review` instead of `review`. Bulk generation refuses to start unless `concept_status='locked'`.

## 2. New edge function: `venture-concept-refine`

Single function, action-dispatched POST body `{ snapshot_id, action, payload }`:

- `draft` — generate initial 50–60 word summary + value prop from `research_brief` + `extracted_data` + founder/market context. Strict JSON output `{ summary, value_proposition, rationale }`. Word-count enforced server-side (re-prompt once if out of band).
- `brainstorm` — produce 3–5 alternative angles/positioning shifts grounded in `research_brief.competitors` and `market_trends`. Returns `{ ideas: [{ title, summary, why_it_works, risks }] }`.
- `innovate` — given a chosen idea or user prompt, produce a more ambitious reframe (new wedge, business model tweak, underserved segment). Returns same shape as `draft` plus `delta` explaining what changed.
- `critique` — red-team the current summary against competitors + customer voice; returns weaknesses + concrete rewrite suggestions.
- `apply` — persist a chosen variant as the working `concept_summary` / `value_proposition` (still `concept_status='refining'`).
- `lock` — validate word count (50–60), non-empty value prop, then set `concept_status='locked'`, `concept_locked_at=now()`, `status='concept_review'` → ready for generation.

Every call appends an entry to `concept_iterations`. Uses Lovable AI Gateway via existing `_shared/ai-gateway.ts` helper, model `google/gemini-3-flash-preview` (fast, cheap, structured output via `Output.object` + Zod). Auth: verify caller owns the snapshot.

## 3. Generation gating

`venture-bulk-generate` and `venture-generate-document`: at entry, load snapshot, refuse with 409 if `concept_status !== 'locked'`. Inject `concept_summary` + `value_proposition` as the canonical "north-star" block at the top of every document system prompt, ahead of `research_brief`. This is what keeps all 21 documents on-message.

## 4. UI: Concept Studio panel

New component `src/components/hub/ConceptStudio.tsx` rendered on `hub.$snapshotId.tsx` as the primary card whenever `status === 'concept_review'` and `concept_status !== 'locked'`. Document list + generate button stay disabled behind it.

Layout:
- **Header**: "Refine your concept" + live word counter (turns green at 50–60).
- **Summary editor**: textarea bound to `concept_summary`, inline word count, "Regenerate from research" button (calls `draft`).
- **Value proposition editor**: textarea, 1–2 sentence guidance.
- **Action rail** (buttons):
  - Brainstorm alternatives → opens a drawer listing returned ideas with "Use this" → calls `apply`.
  - Innovate / push further → prompt input ("what constraint to challenge?") + run.
  - Red-team critique → returns bullet weaknesses + a suggested rewrite with one-click apply.
- **Iteration history**: collapsible timeline rendered from `concept_iterations` with diff highlight and "Restore" per entry.
- **Lock concept** primary button: disabled until word count valid + value prop non-empty. On click → confirmation modal explaining this becomes the spine of all 21 documents, then calls `lock`. UI flips to locked read-only summary with "Unlock & revise" (sets `concept_status='draft'`, requires re-lock; allowed only while no documents generated, otherwise warns about regeneration).

After lock, the existing "Generate all documents" CTA becomes enabled.

## 5. Client wiring

In `src/lib/foundersHub.functions.ts`:
- `refineConcept(snapshotId, action, payload)` → invokes `venture-concept-refine`.
- `lockConcept(snapshotId)` → action `lock`.
- Update `createSnapshot` flow notes (deep research now lands on `concept_review`).
- Bulk-generate client call surfaces the 409 with a toast pointing back to Concept Studio.

## 6. Telemetry / safeguards

- Cap: 20 AI refinement calls per snapshot (config constant); surface remaining count in UI.
- Word-count validation both client and server.
- All AI outputs validated with Zod; on parse failure, single retry then surfaced error toast.

## Technical summary

- 1 migration (5 columns + status enum value via check or text).
- 1 new edge function `venture-concept-refine` (multi-action).
- Edits: `venture-deep-research` (set status `concept_review`), `venture-bulk-generate` + `venture-generate-document` (gate + inject concept block), `foundersHub.functions.ts`, `hub.$snapshotId.tsx`, `src/integrations/supabase/types.ts` (regen after migration).
- 1 new component `ConceptStudio.tsx` plus small subcomponents (`IdeaDrawer`, `IterationTimeline`).

## Open choices

1. **Word band** — strict 50–60, or soft 45–70 with warning? Strict gives consistent doc inputs; soft is friendlier.
2. **Brainstorm scope** — keep ideas tightly anchored to the user's industry/market, or allow adjacent-market pivots?
3. **Unlock after generation** — allow re-lock + regenerate all docs (expensive), allow but only regenerate stale docs, or freeze concept once any doc is generated?
4. **Auto-draft on entry** — auto-run `draft` the first time the user lands on Concept Studio, or wait for explicit click?
