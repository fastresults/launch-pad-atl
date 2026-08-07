# Fix content overflow across the shared showcase

## What the audit found

I walked all 75 assets in a live share link with a headless browser at desktop (1280px) and phone (390px) widths and measured every element against the viewport.

- Desktop: 29 of 75 sections overflow horizontally.
- Mobile: 65 of 75 sections overflow horizontally.

Three causes account for nearly all of it:

1. **Code-fenced blocks (27 sections).** Generated assets frequently wrap plain content in triple-backtick fences (the "Paste-Ready" day-by-day list in your screenshot is one). The showcase has no styling for `pre`/`code`, so the browser default of "never wrap" applies and lines run far past the reading pane — e.g. the AI prompts asset renders 4,782px wide inside an 864px column.
2. **Markdown tables (large share of the mobile failures, plus the monthly spend asset on desktop).** Tables are set to `w-full` with no minimum-width or scroll wrapper, so wide tables blow past the column instead of scrolling.
3. **Long unbroken strings** — URLs, handles, inline code — with no word-breaking rule, so single tokens push the layout wide on narrow screens.

A fourth, smaller issue: the reading pane's flex/grid child has no `min-w-0`, so an over-wide child can stretch the whole column rather than being contained.

## The fix

### 1. One shared prose renderer (prevents recurrence)

Today the share page and the in-app document viewer each carry their own long inline list of markdown styles, so a fix in one place doesn't protect the other — and any new asset type added later starts from scratch. Create a single `MarkdownProse` component that owns every markdown element style, and use it in both the public showcase and the hub viewer. Future generated assets automatically inherit correct formatting.

Rules baked into it:

- `pre` — wraps long lines (`whitespace-pre-wrap` + `break-words`), horizontal scroll as a fallback, contained max width, padded/rounded surface with a subtle border so pasteable blocks read as blocks.
- `code` (inline) — breaks anywhere, tinted chip styling.
- `table` — wrapped in a scrollable container with a rounded border; cells wrap; header row stays legible; readable minimum width so a scrolled table doesn't compress into unreadable columns.
- Global `overflow-wrap: anywhere` on the prose slab so no single long token (URL, email, token string) can widen the layout.
- Images, headings, lists, paragraphs, blockquotes keep the spacing and rounding already established.

### 2. Container hardening

- Add `min-w-0` (and `overflow-x-clip` where appropriate) to the reading-pane column and each section wrapper in the showcase, so no child can stretch the page.
- Same treatment on the mobile sheet/sidebar rows that currently push a few pixels wide.

### 3. Content normalization for future generations

Extend the existing `normalizeParagraphs` helper into a small normalizer that also:

- Unwraps "fake" code fences — fences with no language, or a `text`/`markdown` language, whose content is ordinary prose/lists — so day-plan and checklist assets render as real formatted content instead of a monospace slab. Genuine code (`json`, `html`, `ts`, etc.) keeps its fence.
- Converts `::`-delimited pseudo-columns in day-plan lines into readable list items rather than one long unbreakable line.

This is applied at render time (no regeneration required) so it fixes the 60+ assets already produced and every asset generated from now on.

### 4. Re-audit

Re-run the same automated sweep across all 75 assets at 1280px and 390px and confirm zero horizontal overflow, then spot-check screenshots of the worst offenders (AI prompts, day-by-day plan, monthly spend table, brand guidelines).

## Technical notes

- New: `src/components/markdown/MarkdownProse.tsx` (shared renderer with `components` overrides for `pre`, `code`, `table`).
- Edited: `src/components/share/ShareSection.tsx` (use `MarkdownProse`, add `min-w-0`), `src/routes/v.$token.tsx` (reading-pane `min-w-0`), `src/components/hub/DocumentViewer.tsx` (use `MarkdownProse`), `src/lib/markdown-normalize.ts` (fence unwrapping + `::` line handling).
- No backend, schema, or generation-pipeline changes; this is presentation plus a render-time normalizer.
