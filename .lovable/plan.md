# Plan: Rich Markdown Viewer + Matching Hero Images on Workflow Deliverables

## Problem

On `/dashboard/workflow/:key`, sections and the McKinsey deep assessment render with `whitespace-pre-wrap` only. Markdown like `**bold**`, lists, tables, headings, and blockquotes show as raw asterisks/pipes (as in the screenshot). The Hub's `DocumentViewer` already has a polished `ReactMarkdown` renderer — workflow detail does not reuse it. Workflow deliverables also have no Nano Banana hero image, so they look stylistically different from the Hub documents.

## Part 1 — Shared Rich Markdown Renderer

Extract the `DocumentViewer` markdown setup into a reusable component so every document surface renders identically.

1. Create `src/components/markdown/RichMarkdown.tsx`
   - Wraps `ReactMarkdown` with `remarkGfm` (tables, task lists, strikethrough, autolinks).
   - Exports two presets:
     - `<RichMarkdown variant="document">` — full styling (headings, hero callouts, numeric highlighting, code blocks, anchor TOC ids).
     - `<RichMarkdown variant="assessment">` — denser, no TOC tracking.
   - Components map covers: `h1-h4`, `p`, `strong`, `em`, `ul/ol/li`, `blockquote`, `table/thead/tbody/tr/th/td` (sticky header, zebra rows, numeric right-align), `code/pre` (with copy), `a` (external safe), `hr`, `img` (rounded, lazy), task-list checkboxes.
   - Tailwind `prose prose-sm dark:prose-invert max-w-none` base + semantic token overrides — no hardcoded colors, all use `text-foreground`, `text-muted-foreground`, `border-border`, `bg-muted/40`.

2. Refactor `src/components/hub/DocumentViewer.tsx` to consume `RichMarkdown` (keep current behaviour; just delegate the components map).

3. Update `src/routes/_authenticated/dashboard/workflow.$key.tsx`:
   - Replace the raw `<p className="whitespace-pre-wrap">{s.body_markdown}</p>` (line 145) with `<RichMarkdown variant="document">{s.body_markdown}</RichMarkdown>`.
   - Replace the raw `whitespace-pre-wrap` assessment block (line 186-188) with `<RichMarkdown variant="assessment">{assessmentText}</RichMarkdown>`.
   - Also render `content.summary` through `RichMarkdown` so bolds/links in summaries work.

4. Audit other markdown surfaces and switch them to `RichMarkdown`:
   - `FounderRoadmapDialog.tsx`
   - `SocialStudio.tsx`
   - `hub.$snapshotId.tsx`
   - Any other `whitespace-pre-wrap` body that holds AI-generated text.

## Part 2 — Matching Nano Banana Hero on Workflow Deliverables

Today only `venture_documents` get a hero via `venture-document-image`. `attendee_deliverables` (workflow detail page) get none.

1. Generalize the image function:
   - Add a new edge function `attendee-deliverable-image` (mirrors `venture-document-image`) that:
     - Reads from `attendee_deliverables` keyed by `(user_id, deliverable_key)`.
     - Pulls company/industry context from `attendee_profiles` + the deliverable's own content snippet.
     - Reuses the **exact same** `buildVisualPrompt` New Yorker editorial style block (extract it into a shared module `supabase/functions/_shared/hero-prompt.ts` and import from both functions so styles can never drift).
     - Stores PNG at `{user_id}/workflow/{deliverable_key}/{version}.png` in `venture-doc-images` (already private, user-scoped).
     - Writes `hero_image_path` + `hero_image_prompt` columns on `attendee_deliverables` (migration adds these columns if missing).

2. Migration (only if columns absent): add `hero_image_path text`, `hero_image_prompt text` to `public.attendee_deliverables`.

3. UI on `workflow.$key.tsx`:
   - At the top of the article card, render a 16:9 `AspectRatio` hero (same component used by `DocumentViewer`) once `hero_image_path` exists; show a signed URL via `supabase.storage.from('venture-doc-images').createSignedUrl(path, 3600)`.
   - Lazy-trigger generation when the page loads a deliverable that has content but no `hero_image_path` (mirror the lazy pattern already in `DocumentViewer`).
   - Add a small "Regenerate image" button next to "Quick regenerate".

4. Pipeline hook:
   - In `supabase/functions/dashboard-pipeline-run/index.ts`, after a deliverable is marked `ready`, fire-and-forget a call to `attendee-deliverable-image` so the hero is ready next time the user opens it.

## Technical Details

- Markdown: `react-markdown` + `remark-gfm` already installed; no new deps.
- Tables: GFM pipe tables; the renderer wraps `<table>` in an `overflow-x-auto` div so wide tables don't break layout.
- Numeric cells: detect with the existing `NUMERIC_RE` regex from `DocumentViewer` and right-align + tabular-nums.
- Style tokens only — no `text-white`/`bg-black`/hex colors in components.
- Shared prompt module guarantees identical Nano Banana style across Hub and Workflow.
- Storage path namespacing keeps Hub and Workflow images cleanly separated under the same bucket and RLS policies.

## Files Touched

- New: `src/components/markdown/RichMarkdown.tsx`
- New: `supabase/functions/_shared/hero-prompt.ts`
- New: `supabase/functions/attendee-deliverable-image/index.ts`
- Edit: `src/components/hub/DocumentViewer.tsx` (delegate to RichMarkdown)
- Edit: `src/routes/_authenticated/dashboard/workflow.$key.tsx` (RichMarkdown + hero)
- Edit: `src/components/hub/FounderRoadmapDialog.tsx`, `SocialStudio.tsx`, `hub.$snapshotId.tsx` (where raw markdown is shown)
- Edit: `supabase/functions/venture-document-image/index.ts` (import shared prompt)
- Edit: `supabase/functions/dashboard-pipeline-run/index.ts` (kick image after ready)
- Migration: add `hero_image_path` / `hero_image_prompt` to `attendee_deliverables` if missing
