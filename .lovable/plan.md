# Deep Assessment on demand

Strip the McKinsey-grade section back out of the default document generation. Each document is again just the **Executive Summary**. When the founder opens a document and wants more rigor, they click **Run deep assessment** in the viewer. A new edge function generates the McKinsey-grade analysis from the existing document + venture context and renders it below the document in the same modal.

## UX flow

1. Founder opens a document → sees the current Executive Summary, nothing else.
2. Below the document body the viewer shows a card:
   - **Deep assessment** title + one-line description ("Partner-grade pressure test, assumptions, sensitivities, risks, and 30/60/90-day actions.").
   - Primary button **Run deep assessment**.
3. Click → button shows spinner + "Analyzing… (~30s)". Card disables, document stays readable.
4. On success the card expands into the rendered McKinsey markdown (same `ReactMarkdown` pipeline, with the existing "Deep dive" pill). Footer shows `Regenerate` (with optional feedback, reusing the existing `RewriteFeedbackDialog`) and `Copy / Download` for the assessment alone.
5. On failure (gateway error, rate limit, credits) the card shows a clear inline error and lets the user retry.
6. If the document already has an assessment stored, render it immediately on open (no extra click). The button becomes `Regenerate deep assessment`.

## Data model

Add three columns to `venture_documents` (idempotent migration, default NULL):

- `deep_assessment text`
- `deep_assessment_status text` — `idle | generating | complete | failed`
- `deep_assessment_quality_score int`
- `deep_assessment_generated_at timestamptz`

No new tables, no RLS changes (existing per-document policies cover the new columns).

## Backend

**New edge function** `supabase/functions/venture-generate-assessment/index.ts`:

- Input: `{ snapshotId, documentType, feedback?, tags? }`.
- Loads the snapshot, the document row, and a few upstream dep docs (same loader pattern used by `venture-generate-document`).
- Marks `deep_assessment_status = 'generating'`.
- Calls `google/gemini-3-flash-preview` via Lovable AI Gateway with a focused system prompt: produce ONLY the `## McKinsey-Grade Assessment` markdown, using the same scaffold (Situation, Key Assumptions, Pressure Test, Quantified Sensitivities, Risks & Mitigations, What Would Have to Be True, 30/60/90, Confidence Summary). Strict no-citations rule, plus a `QUALITY_SCORE:` footer.
- Sanitizes the output through the shared `stripCitations` helper.
- Upserts `deep_assessment`, `deep_assessment_quality_score`, `deep_assessment_status = 'complete'`, `deep_assessment_generated_at = now()`.
- Standard `GatewayError` translation for 402 / 403 / 429 / generic failures.
- Registered in `supabase/config.toml`.

**Existing functions** `venture-generate-document/index.ts` and `venture-bulk-generate/index.ts`:

- Remove the `DEEP_DIVE` constant from the system prompt path used for normal generation. Keep `stripCitations` and the strict "no footnotes / no Sources" rules — the no-citations behavior stays.
- Replace `DEEP_DIVE` with a short `OUTPUT_FOOTER` constant that only contains:
  - the citation-strict rules
  - the `QUALITY_SCORE:` line directive
- Target length returns to ~600-900 words (Executive Summary only).
- Document generation never writes `deep_assessment_*` columns.

## Client

- `src/lib/foundersHub.functions.ts`: add `generateDeepAssessment({ snapshotId, documentType, feedback?, tags? })` wrapper that invokes the new edge function. Add a small reader helper or rely on the existing snapshot/documents query to surface the new columns (extend the `select` to include `deep_assessment*`).
- `src/components/hub/DocumentViewer.tsx`:
  - Accept the new columns on the `doc` prop (`deep_assessment`, `deep_assessment_status`, `deep_assessment_quality_score`).
  - Below the article, render a `DeepAssessmentPanel` (new local component) that handles the three states: idle (button), generating (spinner + skeleton), complete (rendered markdown via the same `makeComponents` pipeline, with the Deep-dive pill preserved on the H2, plus Copy / Download / Regenerate controls).
  - Regenerate reuses `RewriteFeedbackDialog` and calls `generateDeepAssessment` with the feedback/tags.
  - Failed state shows toast + inline retry.
- Whichever route/component opens the viewer (`hub.$snapshotId.tsx` and any list views) must include the new columns in its `venture_documents` `select`. No other UI changes elsewhere.

## Migration plan for existing rows

- The migration only adds nullable columns; existing rows remain untouched and load instantly.
- Documents generated under the previous turn (which already contain an inline `## McKinsey-Grade Assessment` section in `content`) will still render that section as part of the document body. A small one-time data migration is **out of scope**; if the founder wants the new on-demand experience for those docs, they can click Rewrite to regenerate a clean Executive Summary, then click Run deep assessment. We surface this as a hint in the viewer when both an inline assessment heading and no `deep_assessment` value are present.

## Out of scope

- New tables, RLS changes, or schema changes beyond the four columns.
- Bulk pre-generating assessments for every document.
- Streaming the assessment response (returns as a single payload; viewer shows a skeleton during the ~20-40s call).
- Changing Concept Studio, Brand Studio, Social Studio, or the rewrite-feedback flow itself.

## Verification

- Open an existing (pre-change) document → renders Executive Summary; deep assessment card visible with `Run deep assessment` button.
- Click button → spinner, then McKinsey section appears below with the Deep-dive pill, Copy/Download/Regenerate controls.
- Reopen the modal → assessment loads instantly from the stored column.
- Click Regenerate with feedback → new content replaces the old; `deep_assessment_generated_at` updates.
- Run a fresh document generation → `content` contains only the Executive Summary, no `## McKinsey-Grade Assessment` block, no `[^…]`, no `## Sources`.
- Force a gateway 402 → inline error card with retry; document still readable.
