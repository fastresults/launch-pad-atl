## Why the prompt looks broken

Two compounding bugs:

1. **Generation truncation.** `venture-generate-document` calls the AI gateway with **no `max_tokens`**, so Gemini stops at its default (~8k tokens). The PRD is huge (sections 1–9 plus an 1,800–2,400-word master prompt), so it gets cut off — usually somewhere inside Section 7 or 8. That's why the visible builder block "starts at number six" and never reaches the closing fence.
2. **Brittle extraction.** `prdMasterPrompt` in `DocumentViewer.tsx` looks for the first fenced ```` ``` ```` block after the "Paste-Ready" heading. When the AI re-uses `## 6`, `## 7` *inside* the block (per the spec's "restate" instruction) and/or truncates before the closing fence, the regex either grabs the wrong block or falls back to "largest text block" — which is the partial Section 6–7 slice you're seeing.

## Fix

### 1. Stop the truncation (`supabase/functions/venture-generate-document/index.ts`)
- Add `max_tokens: 16000` to the chat-completions body. For `website_prd` specifically, bump to `24000` and force `modelForTier("pro")` (Gemini 3.1 Pro / 1M context, generous output) regardless of the per-type tier so the PRD can finish.
- Detect truncation: if `aiJson.choices?.[0]?.finish_reason` is `length` or the body has no closing fence after the `## 8` heading, mark `quality` ≤ 60 and append a `<!-- TRUNCATED -->` marker so the viewer can warn.

### 2. Make the master prompt deterministically extractable (`supabase/functions/_shared/deliverable-prompts.ts`)
Rewrite Section 8 in the `website_prd` prompt to require:
- The block is wrapped in HTML-comment delimiters **outside** the code fence:
  ```text
  <!-- BEGIN_MASTER_PROMPT -->
  ```text
  …1,800–2,400 words…
  ```
  <!-- END_MASTER_PROMPT -->
  ```
- The block begins with the literal first line `# AI Builder Brief — {Company} Website` and uses numbered subsections `1) Role + outcome` … `11) Definition of Done`. Forbid re-using the parent doc's `## 6`, `## 7` numbering inside the block.
- Restated per-route copy, SEO, and a11y appear under those numbered subsections, not under duplicated `## 6` / `## 7` headings.

### 3. Robust extraction (`src/components/hub/DocumentViewer.tsx`, `prdMasterPrompt` memo)
Resolution order:
1. Match `<!-- BEGIN_MASTER_PROMPT -->([\s\S]*?)<!-- END_MASTER_PROMPT -->`, then strip a single outer ```` ```text … ``` ```` fence if present.
2. Else slice from the `## 8 … Paste-Ready Master Prompt` heading to the next H2 (`## 9` or EOF); strip an outer fence if present.
3. Else current largest-text-block fallback (kept only as last resort).

Validate the result:
- If length < 800 words **or** missing the literal `Role + outcome` marker **or** the document contains `<!-- TRUNCATED -->`, set a `prdPromptIncomplete` flag.

### 4. Viewer UX (`DocumentViewer.tsx` hero panel)
- When `prdPromptIncomplete`, render an amber banner above the Copy/Open buttons: "This builder prompt looks incomplete — regenerate the PRD to get the full 1,800–2,400-word brief." with a "Regenerate now" button wired to the existing regenerate mutation.
- Replace the `<details>` preview with an always-visible scroll container `max-h-[420px] overflow-auto` plus a "View full prompt" button that expands to `max-h-[80vh]`, so users can actually see sections 1–11 instead of landing mid-document.
- Reset `scrollTop = 0` on mount so the preview opens at the top of the prompt, not at the tail.

### 5. Backfill
No migration needed. Existing PRDs stay as-is; the next regeneration produces a complete, delimited, non-truncated builder prompt that the viewer extracts cleanly and copies in full.

## Files touched
- `supabase/functions/venture-generate-document/index.ts` — `max_tokens`, forced Pro for `website_prd`, truncation marker
- `supabase/functions/_shared/deliverable-prompts.ts` — Section 8 rewrite + delimiters
- `src/components/hub/DocumentViewer.tsx` — extraction, incompleteness warning, scrollable preview, expand toggle
