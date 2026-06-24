# Document Viewer Visual Upgrade

## Problem

The "View" modal on a hub snapshot renders generated documents through `ReactMarkdown` with a long inline class list. Tables, callouts, code blocks, and headings all collapse into the same flat dark-on-dark style — research content is correct but reads like a debug dump (see the attached "Paid Ads Starter Pack" screenshot for the target polish level: clear section hierarchy, real table grid, comfortable line length).

## What we will build

A dedicated, reusable **`DocumentViewer`** component (`src/components/hub/DocumentViewer.tsx`) that replaces the inline `<article>` block in `hub.$snapshotId.tsx` (lines 482–516). Same data in, much better presentation out. No backend changes, no schema changes — pure presentation.

### 1. Layout & chrome
- Widen the dialog from `max-w-3xl` → `max-w-4xl`, add a sticky header inside the scroll container showing: document title (Title Case), a small `Badge` for `document_type`, and the action buttons (Copy / Download .md / Download .pdf / type-specific actions) pinned top-right so they stay reachable while scrolling.
- Content column constrained to ~72ch for readable line length, centered with generous side padding.
- Soft divider under the sticky header; subtle background tint on the content area so it reads like a "page" inside the dark UI.

### 2. Typography system (semantic tokens only)
A single `prose-doc` class group on the article wrapper:
- **H1** 2xl, tight tracking, bottom border accent in `--primary` at 30% opacity.
- **H2** xl, top margin + subtle uppercase eyebrow feel via tracking.
- **H3** lg, foreground color, lighter weight than H2.
- **Paragraphs** 14.5px, `leading-7`, `text-foreground/85`.
- **Strong** bumped to `text-foreground` + medium weight (not bold-heavy).
- **Lists** proper indent, marker color in `text-primary/70`, nested list spacing fixed.
- **Blockquote** left border in `--primary`, italic, muted bg.
- **HR** as a thin gradient line using the brand gradient tokens.
- **Links** primary color, underline-offset-4, hover brightens.

### 3. Tables (the main pain point)
Custom markdown renderer overrides for `table`, `thead`, `tr`, `th`, `td` that reuse the existing shadcn `@/components/ui/table` primitives:
- Wrapper with rounded border, horizontal scroll on small viewports.
- Header row: `bg-muted/40`, uppercase 11px tracking-wide, sticky on vertical scroll inside the dialog.
- Zebra rows via `even:bg-muted/20`.
- Cell padding `px-3 py-2`, top-aligned, `text-sm`.
- Numeric-looking cells (regex `/^[\$£€]?[\d,.]+%?$/`) get `font-mono tabular-nums text-right`.

### 4. Code blocks & inline code
- Inline `code`: `bg-muted px-1.5 py-0.5 rounded text-[12.5px] font-mono`.
- Fenced blocks: dark surface card with a header strip showing the language label and a "Copy" button; body uses `font-mono text-[12.5px] leading-6` with horizontal scroll.

### 5. Callouts
Detect markdown patterns we already emit (`> **Note:**`, `> **Warning:**`, `> **Tip:**`) and render them as colored callout cards (info / warning / success) with an icon — falls back to a normal styled blockquote when no keyword matches.

### 6. Table of contents (long docs)
If the document has 4+ H2s, render a collapsible TOC at the top with anchor links that smooth-scroll within the dialog. Each heading gets a slugified `id` via a `rehype-slug`-style renderer override (no new dependency — small inline slugifier).

### 7. Export polish
- Rename existing "Download .md" → keep as-is.
- Add **"Print / Save as PDF"** button that opens `window.print()` on a hidden iframe containing the rendered HTML with a print stylesheet (white bg, black text, page-break rules on H1/H2). Uses the browser's native PDF — no new dependency.
- Existing "Copy" and the `website_prd` "Copy prompt only" button preserved unchanged.

## Files touched

| File | Change |
|---|---|
| `src/components/hub/DocumentViewer.tsx` | **new** — the component above |
| `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx` | replace the inline Dialog body (lines 482–516) with `<DocumentViewer doc={viewerDoc} onClose={...} />` |

No new npm packages — `react-markdown` + `remark-gfm` are already installed, and we'll lean on existing shadcn `Table`, `Badge`, `Button`, and Lucide icons.

## Out of scope

- Editing documents inline (still copy/download-only).
- Real PDF generation server-side (browser print is enough for v1).
- Changing the document generation prompts or content.

## Verification

After build, open a generated document (e.g. "Brand Strategy Framework" or any doc containing a markdown table) from the hub snapshot page and confirm: headings have hierarchy, tables render with borders + zebra striping, code blocks have a copy chip, the sticky action bar stays visible while scrolling, and Print produces a clean white PDF.
