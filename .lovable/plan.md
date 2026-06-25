# Executive Summary + McKinsey deep dive, no citations

Every document keeps the concise, scannable executive-summary format on top. Below it, the AI appends a rigorous, McKinsey-style assessment tailored to that document type. Footnotes and "Sources" sections are removed everywhere.

## What changes for the founder

When they open any document in the viewer they see two clearly separated parts:

1. **Executive Summary** — the current short-form, investor-ready layout (unchanged structure and length).
2. **McKinsey-Grade Assessment** — a deeper, structured analysis specific to that document (e.g. for `business_model_canvas`: pressure-tested assumptions, unit-economics teardown, sensitivities, risks & mitigations, what would have to be true, 30/60/90 actions). Same brand styling, just longer and more analytical.

No `[^1]` markers, no `## Sources` section, no inline citation links. The deep dive still reasons over the research brief but presents conclusions as analyst judgment, not footnoted quotes.

## Backend changes (single edge function)

`supabase/functions/venture-generate-document/index.ts` — `generateOne`:

- **Prompt restructure.** The base system prompt and every entry in the `SPECIAL` map are rewritten to require a two-part output:
  - `## Executive Summary` — current spec for that doc type (headings, tables, brand-token JSON, paste-ready prompt block for `website_prd`, etc. all preserved verbatim inside this section).
  - `---`
  - `## McKinsey-Grade Assessment` — a standardized analytical scaffold the model fills in with doc-specific substance:
    - Situation & context
    - Key assumptions (with confidence: high/med/low)
    - Pressure test / what could go wrong
    - Quantified sensitivities or scenarios where applicable (tables)
    - Risks & mitigations
    - "What would have to be true" for success
    - 30 / 60 / 90-day actions
    - Confidence summary
  - For doc types where a deep dive maps to a more domain-specific frame (e.g. brand strategy → competitive positioning teardown; financial docs → driver tree + sensitivities; GTM → ICP scoring + channel economics), the scaffold above is adapted in the per-type SPECIAL prompt while keeping the same two-section shape.
- **Remove citation directives.** Delete the `CITATIONS:` block and the `End with a "## Sources" section…` instruction from the base prompt and from every `SPECIAL` entry that includes `QF`. Replace `QF` with a new constant that only emits the trailing `QUALITY_SCORE:` line — no Sources section, no footnotes.
- **Length target.** Bump guidance from ~600–900 words to ~1,200–1,800 words total (Executive Summary ~500–700, Deep Dive ~700–1,100). Brief doc types stay shorter.
- **Sanitization pass on the model output.** Before persisting `content`:
  - strip any `[^n]` markers
  - strip any trailing `## Sources` / `## References` / `## Citations` section
  - collapse leftover empty lines
  This guarantees no citations ship even if the model ignores the prompt.
- The existing `visual_identity_brief` brand-tokens JSON extraction and `website_prd` paste-ready prompt block continue to work because they live inside the Executive Summary section and the regex extractors operate on the whole document.
- Rewrite-feedback block and quality scoring logic are unchanged.

## Frontend changes (presentation only)

`src/components/hub/DocumentViewer.tsx`:

- Render the markdown as today. The `## McKinsey-Grade Assessment` H2 naturally appears as a section heading, and the `---` separator already renders as the styled gradient `<hr>`.
- Small enhancement: when the rendered content contains an H2 whose text matches `McKinsey-Grade Assessment`, give it a subtle "Deep dive" pill badge next to the heading (visual cue only, no logic change). Optional polish; not required for the feature to work.
- Table-of-contents auto-list already picks up the new H2, so users get a one-click jump to the deep dive.

No changes to `ConceptStudio`, `BrandStudio`, `SocialStudio`, the hub route, or the rewrite-feedback dialog.

## Migration of existing documents

Existing rows in `venture_documents` keep their old content until the user clicks **Rewrite** (or bulk re-generates). No DB migration needed. We surface a small inline hint in `DocumentViewer` when a document has no `## McKinsey-Grade Assessment` heading: *"This document was generated before the deep-dive upgrade — click Rewrite to add the McKinsey-grade assessment."* (Optional, low effort.)

## Out of scope

- Concept Studio output (already has its own structure).
- Schema/DB changes — content stays in the same `content` column.
- Changing the rewrite-feedback flow, quality scoring, or hero-image generation.
- Adding a separate "deep dive" tab — keeping it as one scrollable document is simpler and matches the user's request ("below in the modal").

## Verification

- Generate a fresh `executive_summary` doc → output contains both sections, no `[^…]`, no `## Sources`.
- Generate `business_model_canvas`, `brand_strategy_framework`, `website_prd` → each keeps its specialized Executive Summary (incl. JSON / fenced prompt blocks) and gains a tailored McKinsey deep dive below.
- Open an old document → renders as before; click Rewrite → new version has both sections.
- Search rendered HTML for `[^` and `Sources` → no hits in newly generated docs.
