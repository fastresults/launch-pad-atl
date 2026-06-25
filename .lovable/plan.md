## Goal
Make the McKinsey-grade Deep Assessment fully grounded in the venture's *entire* context — not just the document being assessed plus its direct upstream dependencies — so its findings align tightly with the Executive Summary and the broader research already gathered.

## What's there today (`supabase/functions/venture-generate-assessment/index.ts`)
The prompt currently includes:
- Founder + market card
- `snap.concept_summary`, `value_proposition`
- `snap.extracted_data` (the venture brief)
- `snap.research_brief` (background evidence)
- The document being assessed (`doc.content`)
- Only the doc's **direct `dependencies`** as "upstream context"

**Gap:** sibling/downstream documents (e.g. the Executive Summary itself when assessing another doc, financial_model, pricing_strategy, ICP, GTM, etc.) and the deep research artifacts (enrichment, market scans, competitor data stored on the snapshot) are not passed in. The model also doesn't get an explicit instruction to *triangulate* against the Exec Summary's claims.

## Plan

### 1. Edge function: assemble a full venture context bundle
Refactor `generateAssessment` to build a layered context, ordered from most → least authoritative, with token-aware truncation:

1. **Venture Spine** (always included, untruncated)
   - Founder card + market scope
   - `concept_summary`, `value_proposition`
   - `extracted_data` (venture brief)
   - The Executive Summary document (fetched explicitly when it exists and isn't the doc under review) — flagged as the "north-star narrative this assessment must reconcile with."

2. **Full research corpus** (new)
   - `snap.research_brief`
   - Any other research/enrichment columns on the snapshot (e.g. `enrichment_*`, deep research outputs) — discover via a single `select *` and include known research-bearing fields.

3. **All sibling documents** (new — replaces "deps only")
   - Fetch every `venture_documents` row for the snapshot where `status='complete'`.
   - For each, include `document_type`, the doc's `intake_answers` if present, and a **smart excerpt**: full text if under ~1.5k chars, otherwise the first ~800 chars + headings list + last ~400 chars.
   - Mark the direct dependencies as "PRIMARY UPSTREAM" so the model weights them higher.
   - Mark the Executive Summary (if separate) as "EXEC SUMMARY — assessment must align with this."

4. **The document under review** (unchanged, full text, clearly delimited).

5. **Founder guidance** (unchanged, highest priority).

### 2. Token budgeting
Single call to Gemini 3 Flash Preview has plenty of context window, but to stay safe and fast:
- Hard cap total user-prompt at ~120k characters.
- If over budget, progressively summarize sibling docs (drop body, keep headings + first paragraph), then truncate `research_brief` JSON to its top-level keys + first N items per array.
- Never truncate: the doc under review, the Exec Summary, the venture brief, the founder guidance.

### 3. Prompt tightening for alignment
Update `SYSTEM_PROMPT` to add:
- "You have the founder's **full venture context** below: the venture brief, all research, every completed document, and the Executive Summary. Your assessment of *this* document must be internally consistent with the Executive Summary and with the numbers/positioning/ICP established in the other documents. Call out any contradictions you find between this doc and the rest of the venture as explicit risks."
- A new bullet in `### Pressure Test`: "Flag any misalignment between this document and the Executive Summary or other completed deliverables."
- Keep all existing strict rules (no citations, no rewrite, QUALITY_SCORE line).

### 4. Lightweight provenance line
At the end of the rendered assessment (before `QUALITY_SCORE`), have the model emit one italic line such as:
`_Grounded in: venture brief, research brief, executive_summary, financial_model, pricing_strategy, …_`
This gives the founder visible confirmation that the deep dive used the full context.

### 5. No schema, no UI, no client changes required
- Same table columns, same invoke signature, same DocumentViewer flow.
- The function is the only file edited; existing exports (Copy / .md / .docx / Print) already pick up `deep_assessment` content.

## Technical notes
- File touched: `supabase/functions/venture-generate-assessment/index.ts` only.
- New query: a single `select document_type, content, intake_answers, status` for the snapshot, replacing the deps-only fetch.
- New helper: `smartExcerpt(md, budget)` that keeps first chunk + heading outline + tail.
- New helper: `buildContextBundle(snap, allDocs, docUnderReview, type)` that returns the assembled prompt section and the ordered list of included document types (used for the provenance line via a system-prompt instruction).
- Model unchanged: `google/gemini-3-flash-preview`.

## Out of scope
- Re-embedding/RAG over external sources.
- Changing how the regular documents are generated.
- New DB columns or migrations.
- UI changes in `DocumentViewer`.

## Verification
- Trigger deep assessment on a document that is *not* the Executive Summary; confirm the response references concepts/numbers from the Exec Summary and other completed docs, and that the provenance line lists them.
- Trigger on the Executive Summary itself; confirm sibling docs are listed as context and self-reference is avoided.
- Trigger when only a couple of docs exist; confirm the function still works (no missing-context errors) and truncation logic doesn't break short corpora.
