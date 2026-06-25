# Document export + New Yorker-style hero image prompt

Two independent changes to the venture document viewer.

## 1. Add .docx export alongside .md and Print/PDF

Today the viewer header has **Copy**, **.md**, and **Print / PDF**. Add a fourth action: **.docx** that downloads a Microsoft Word file of the document content (no hero image — purely the markdown body, same scope as the .md export). Copy and Print/PDF stay as-is.

**Approach:** convert the document's markdown to a DOCX in the browser using a small, well-supported lib so we don't need a new edge function. Two viable libs:
- **`docx` (docx-js)** — lower-level builder. We'd parse markdown to AST (via the already-installed `remark-gfm` + `unified`/`remark-parse`) and emit `Paragraph`/`Heading`/`Table`/`TextRun` nodes. Highest fidelity, headings/lists/tables/bold/italic/links all preserved.
- **`html-docx-js` / `html-to-docx`** — render markdown to HTML (we already do this with `ReactMarkdown`) then convert HTML → DOCX. Simpler, smaller diff, but table styling is less reliable.

**Recommended:** `docx` + a small markdown→docx mapper. We already render markdown server-side-style with `react-markdown`; for export we parse it once with `unified` and walk the AST. Pays off because the document set includes PRDs, plans, calendars — all heavy on tables and headings.

**Wiring:**
- New file `src/lib/markdown-to-docx.ts` — pure function `markdownToDocxBlob(title, markdown): Promise<Blob>`.
- `src/components/hub/DocumentViewer.tsx` — add `onDownloadDocx` handler next to `onDownloadMd`, render a new `<Button>` with `FileText` icon and label `.docx`. File name `${doc.document_type}.docx`, mime `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.
- Add `docx` to `package.json`.

**Out of scope (won't do unless asked):**
- Embedding the hero image into the DOCX.
- DOCX styling that matches the in-app dark theme (Word defaults: black on white, sensible heading sizes).
- Server-side rendering (no edge function — runs in the browser, no extra cost or latency).

## 2. New Yorker-style hero image prompt

Current prompt in `supabase/functions/venture-document-image/index.ts` (`buildVisualPrompt`) asks for "cinematic editorial illustration … metaphor-rich … soft cinematic lighting" — that's what's producing the glowing-orb / robot-arms / sci-fi 3D renders you're seeing. Replace with a prompt that explicitly anchors on **New Yorker editorial illustration** language: hand-drawn feel, limited palette, conceptual, witty, restrained, no 3D render, no neon.

**New style block** (replaces lines 57–58 of `buildVisualPrompt`):

> Style: New Yorker magazine editorial illustration. Hand-drawn conceptual artwork with confident ink linework and flat, painterly gouache/watercolor shading. Limited, muted, corporate palette (cream paper background, soft navy, muted ochre, brick red, sage). Witty business metaphor — recognizable real-world objects (briefcases, charts on paper, hands, office plants, ladders, doors, paper boats, etc.) arranged to illustrate the concept. Clean negative space, single clear focal point, slightly off-center composition. Sophisticated and understated — feels like it belongs on the contents page of a serious magazine.
>
> STRICT RULES: NO 3D render, NO photorealism, NO neon, NO glowing particles, NO holograms, NO robot arms, NO sci-fi imagery, NO purple/cyan glow effects, NO text, NO words, NO letters, NO numbers, NO logos, NO watermarks, NO UI mockups, NO charts with data. 16:9 horizontal composition.

Also drop the `mood` line when `brandTokens.mood` contains words like "futuristic", "tech", "cinematic" — those push the model back toward the current sci-fi look. Simpler: stop passing `mood` and `colors` into the visual prompt at all for the hero image, since brand color tokens here ("electric purple", "neon cyan", etc.) are exactly what's producing the look the user doesn't want. Keep `companyName` and `industry` for relevance.

**Optional:** add a `style: "new_yorker" | "abstract"` field on the function input so we can A/B later, defaulting to `new_yorker`. Skip unless you want it now.

**Regeneration:** existing images aren't auto-replaced. The viewer's hover **Regenerate** button (already wired with `force: true`) will produce the new style on demand. Users can also delete `hero_image_path` rows to force regen on next view — not necessary for this change.

## Files touched
- New: `src/lib/markdown-to-docx.ts`
- Edit: `src/components/hub/DocumentViewer.tsx` (new button + handler)
- Edit: `package.json` (add `docx`)
- Edit: `supabase/functions/venture-document-image/index.ts` (`buildVisualPrompt` only)
