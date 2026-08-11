# Kill raw markup leaks in shared links — one global contract

## What's happening

The screenshot shows a document body printing a literal `<style> :root { --bg: ... } </style> <link href="https://fonts.googleapis.com/css2?family=Montserrat...">` line above the heading. That is not a formatting bug in the reader — it is model output echoing prompt context.

Confirmed source: `supabase/functions/_shared/venture-context.ts` (line ~298) hands the model the brand tokens as literal HTML, including a `<link href="https://fonts.googleapis.com/css2?...">` string. Generators copy that preamble into the top of the asset body. The reader (`MarkdownProse`) does not render raw HTML, so it prints as text.

Today's showcase filter (`src/lib/share-content-filter.ts`) strips fenced dev blocks (JSON, robots.txt, sitemap) — it has no rule for bare, unfenced HTML head markup, so this passes straight through.

## The contract

**No reader-facing surface ever prints markup.** Enforced at three layers so one miss cannot reach a client.

1. **Don't hand the model markup.** In `venture-context.ts`, brand tokens and fonts go into the prompt as a plain named list ("Fonts: Montserrat 400/500/600/700, Roboto Slab ..."; "Palette: bg #F5F5F5, fg #212121, accent #4285F4"), never as `<style>`, `<link>`, or a CSS block. Add an explicit instruction line: never reproduce token, font-import or head markup in the body.

2. **Strip at write time.** A new shared sanitizer (`supabase/functions/_shared/strip-markup.ts`) runs on every generated document body before it is saved, so the database stops accumulating polluted assets. Wired into the save path used by `venture-generate-document` / bulk generation.

3. **Strip at render time, everywhere.** A new `src/lib/strip-embedded-markup.ts` with the same rules, called inside `normalizeMarkdown` — so `MarkdownProse` (share sections, share chat), `DocumentViewer` (hub), and the export pipeline (`share-export.ts`, PDF/Word/Drive) are all covered by one function. No per-component opt-in.

### What the sanitizer removes

- `<style>…</style>`, `<script>…</script>`, `<link …>`, `<meta …>`, `<head>`/`<html>`/`<body>` tags, and `<!DOCTYPE …>` — inline or on their own line, opened and unclosed included.
- A leading orphan run of `:root { --token: value; … }` CSS declarations not inside a fence.
- Bare `https://fonts.googleapis.com/css2?...` URLs left stranded after tag removal.
- Any resulting empty paragraph or duplicated blank runs.

Explicitly preserved: markup inside real fenced code blocks in developer-facing assets (the website PRD and style-system export legitimately show `<link>` snippets in ```html fences). The rule targets unfenced markup only; the existing showcase filter continues to handle fenced dev blocks for public links.

### Backfill

Sanitizing at render means every existing polluted asset — including the ones on live share links — cleans up immediately, with no migration. Optionally add a one-off cleanup pass over `venture_documents` so exports and re-generations start from clean text.

## Technical notes

- Files: `src/lib/strip-embedded-markup.ts` (new), `src/lib/markdown-normalize.ts` (call it first in `normalizeMarkdown`), `src/lib/share-content-filter.ts` (delegate to it), `supabase/functions/_shared/strip-markup.ts` (new, mirrored logic), `supabase/functions/_shared/venture-context.ts` (prose token block), plus the deliverable prompt guard in `_shared/deliverable-prompts.ts`.
- Tests: `src/lib/__tests__/strip-embedded-markup.test.ts` covering the exact screenshot string, an unclosed `<style>`, a fenced ```html block that must survive, and a stranded fonts URL.
- Verification: re-render the affected asset on the share link and confirm the body opens on "The National Scope and the Local Stronghold" with no markup above it; run the full typecheck and the vitest suite.
- No schema changes.
