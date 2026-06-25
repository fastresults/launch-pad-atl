## Goal
After the kit finishes ("Your startup kit is ready"), give the founder one big, prominent action — directly under that banner — that produces a single, value-packed **Founder Roadmap & Workshop Synthesis**: what the workshop actually concluded about *their* venture, the top opportunities and risks, a tactical 45-day sprint, and a sequenced 12-month plan.

## Where it goes
Inserted in `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx`, immediately below the green "Your startup kit is ready" hero card (after line 731, before the helper / Your documents section). Only renders when `heroDone === true` (all docs complete). Full-width gradient/primary card with a large CTA — distinct from the smaller doc cards beneath.

## The CTA card
- Title: **"Your Founder Roadmap"**
- Subtitle: "One 12-minute read that turns your 34 documents into a clear, sequenced plan — what's strongest, what's risky, your next 45 days, and the 12-month path."
- Primary button: **"Generate my Founder Roadmap"** (large, primary, sparkle icon). After it's generated → **"Open Founder Roadmap"** with a Regenerate ghost link.
- Meta line once generated: word count · generated-at · quality score.

## What the roadmap contains
Long-form markdown deliverable, explicitly NOT a TOC of the existing documents:

1. **Executive Verdict** — 3-sentence partner-grade verdict + the single highest-leverage move.
2. **What the Workshop Discovered About Your Venture** — synthesized named insights across all docs.
3. **Your Strategic Position** — assets, differentiators, unknowns; "confidence map" table (Pillar / Strength / Confidence / What's missing).
4. **Top 5 Opportunities** — ranked: move · why it works for this venture (cite relevant doc names) · expected outcome · effort (S/M/L) · which deliverable to execute from.
5. **Top 5 Risks & How to De-risk Them** — ranked: mitigation + the deliverable that already addresses it.
6. **Next 45 Days — Tactical Sprint Plan** — day-grouped action plan (Days 1–7, 8–21, 22–35, 36–45). Each item: concrete action, owner role, dependency, success metric, and which deliverable it pulls from. Designed to be executed Monday morning. Ends with an explicit "exit criteria" — what must be true on Day 45 to proceed into the 12-month plan.
7. **12-Month Sequenced Plan** — month-by-month (M1–M12) milestones grouped into phases (e.g. Validate → Build → Scale). Each month: theme, 2–4 outcomes, KPIs, and the deliverable(s) it draws on. Aligned to and continuing from the 45-day exit criteria.
8. **6 & 12-Month Milestones** — measurable targets (revenue, customers, hires, fundraise, product) anchored to the financial model and pricing.
9. **Money & Runway Reality** — synthesized from `financial_model` and `budget_pro_forma` if present: starting cash, monthly burn, breakeven, funding gap, recommended raise size and timing.
10. **Founder Operating Cadence** — weekly/monthly/quarterly rituals tailored to stage and track.
11. **Read-Next Path Through Your Kit** — 5 ordered docs the founder should actually read first (not all 34), each with a one-line reason.
12. **The Single Most Important Thing** — boxed callout: the one move that most changes their odds in the next 30 days.

Strict rules baked into the prompt: brutally specific to *this* venture (no platitudes), reference real numbers and ICP/positioning details, no citations/footnotes, no rehashing entire documents, the 45-day sprint and the 12-month plan must be internally consistent (the 12-month plan picks up exactly where the 45-day sprint ends).

## Implementation

### 1. Migration — new persistence on `venture_snapshots`
- `roadmap_content text`
- `roadmap_status text` (`pending|generating|complete|failed`)
- `roadmap_quality_score int`
- `roadmap_generated_at timestamptz`
- `roadmap_word_count int`

### 2. New edge function `venture-generate-roadmap`
Mirrors `venture-generate-assessment`:
- Input: `{ snapshotId }`.
- Fetches snapshot + every completed `venture_documents` row (content + `intake_answers` + `deep_assessment`) + `venture_document_types` metadata.
- Layered context bundle (venture brief → research brief → enrichment → exec summary → other docs with smart excerpts → deep assessments) under a ~120k-char budget with progressive truncation; exec summary, venture brief and financial docs protected from truncation.
- System prompt enumerates the 12 sections above, the 45-day → 12-month continuity rule, no-doc-by-doc rule, alignment-with-exec-summary rule, and a final `QUALITY_SCORE` line (stripped from rendered output).
- Model: `google/gemini-3-flash-preview`.
- Persists the result + status transitions on `venture_snapshots`.
- Reuses `GatewayError` pattern (429 / 402 / 403 messaging).

### 3. Client wrapper
`src/lib/foundersHub.functions.ts` → add `generateRoadmap({ snapshotId })`.

### 4. UI — `FounderRoadmapCard` (`src/components/hub/FounderRoadmapCard.tsx`)
Empty / generating / complete / failed states; mutation + polling via snapshot refetch.

### 5. UI — `FounderRoadmapDialog` (`src/components/hub/FounderRoadmapDialog.tsx`)
Modeled on `DocumentViewer`: markdown render, jump-to-section sidebar auto-built from H2s (so the 45-day and 12-month sections each get their own anchor), sticky export bar with Copy / .md / .docx / Print, reusing existing `renderToPrint` + `markdownToDocxBlob`.

### 6. Route wiring
`hub.$snapshotId.tsx`: mount `<FounderRoadmapCard>` directly after the hero when `heroDone`; render `<FounderRoadmapDialog>` alongside the other dialogs.

## Files touched
- New: `supabase/functions/venture-generate-roadmap/index.ts`
- New: `supabase/migrations/<ts>_founder_roadmap.sql`
- New: `src/components/hub/FounderRoadmapCard.tsx`
- New: `src/components/hub/FounderRoadmapDialog.tsx`
- Edited: `src/lib/foundersHub.functions.ts`
- Edited: `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx`
- Auto-regenerated: `src/integrations/supabase/types.ts`

## Out of scope
- New `venture_document_types` row — roadmap is a venture-level synthesis, not a kit doc.
- Editable/feedback-driven regeneration (plain Regenerate only).
- Email/PDF auto-delivery — handled via the dialog's existing export actions.

## Verification
- After full kit completes, the big CTA card appears directly under "Your startup kit is ready".
- Click Generate → status flips to `generating` → completes → dialog opens with all 12 sections; the 45-day sprint reads as week-by-week tactical steps and the 12-month plan continues from its exit criteria.
- Exports (Copy, .md, .docx, Print) deliver the full roadmap including both horizons.
- Regenerate replaces prior content; failed state shows retry.
