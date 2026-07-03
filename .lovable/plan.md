## Goal

When a user opens an asset modal (or triggers a deep-dive), the two sections should be labeled after the asset itself:

- Main body → **"{Asset name} Summary"** (replaces generic "Executive Summary")
- On-demand extended analysis → **"{Asset name} Deep Dive"** (replaces every "McKinsey-Grade Assessment" / "Deep assessment" label the user sees)

No changes to model behavior, prompts' analytical rigor, DB columns, or edge-function contracts — this is a labeling / presentation pass.

## Changes

### 1. `src/components/hub/DocumentViewer.tsx` (primary modal)
- Deep-dive card header (line ~997): rename `Deep assessment` → `{title} Deep Dive`; drop the "McKinsey-grade" chip (replace with a neutral "Extended analysis" chip or remove).
- Buttons: `Run deep assessment` → `Run deep dive`; `Regenerate` stays; loading text `Analyzing…` stays; toasts `Deep assessment ready/failed` → `Deep dive ready/failed`.
- H2 auto-badge (line ~133): match `mckinsey-grade assessment` **or** `deep dive` heading and render a neutral "Deep Dive" pill.
- Export markdown (line ~325): emit `## {Title} Deep Dive` instead of `## McKinsey-Grade Assessment`; strip either heading variant from the incoming `extra`.
- If the doc's rendered content starts with an `Executive Summary` H1/H2, rewrite it in the components layer to `{title} Summary` (simple heading interceptor — no content mutation stored).

### 2. `src/routes/_authenticated/dashboard/workflow.$key.tsx`
- Line 271 heading: `McKinsey-grade deep assessment` → `{deliverableTitle} Deep Dive`.
- Buttons (lines 282–283): `Running deep assessment…` / `Re-run deep assessment` / `Run deep assessment` → `Running deep dive…` / `Re-run deep dive` / `Run deep dive`.
- Toast (line 81): `Deep assessment ready` → `Deep dive ready`.

### 3. Edge function prompt headings (so freshly generated markdown matches the new labels; older stored content is normalized by the viewer regex above)
- `supabase/functions/venture-generate-assessment/index.ts`
  - System prompt: change the required output heading from `## McKinsey-Grade Assessment` to `## Deep Dive` (the client prepends the asset name for display).
  - Fallback prepend (line 305) + tone strings: swap "McKinsey-grade / deep assessment" wording for "deep dive" in user-facing strings only. Keep internal analytical instructions unchanged so quality is preserved.
- `supabase/functions/attendee-generate-assessment/index.ts`: same two edits (system prompt heading + fallback prepend).
- Leave `_shared/deliverable-prompts.ts` "Executive Summary" section headings alone — the viewer relabels the H1/H2 on render, and downstream roadmap logic still keys off "Executive Summary" text.

### 4. Copy touch-ups (user-visible only)
- `src/lib/chatbot-knowledge.ts` and `supabase/functions/venture-chatbot/knowledge.ts`: replace the "McKinsey-grade assessments" section title and body with "Deep dives — extended analysis attached to every asset". Keep the description of what it does.

## Out of scope
- No DB column renames (`deep_assessment*` stays).
- No changes to Second Brain, Founder Playbook logic, or asset generation pipelines.
- Roadmap/generation prompts that reference "Executive Summary" as an internal anchor stay intact.

## Verification
- Open any asset modal → header of secondary card reads `{Asset name} Deep Dive`; body H1 reads `{Asset name} Summary`.
- Run a fresh deep dive → new markdown renders under `{Asset name} Deep Dive`; export .md contains the same heading.
- Open a previously generated asset → viewer rewrites the legacy `McKinsey-Grade Assessment` heading to `{Asset name} Deep Dive`.
- Workflow route (`/dashboard/workflow/:key`) shows the same relabeling and toast copy.
