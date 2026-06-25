## Goal
When a user has triggered the McKinsey-grade deep assessment, include it in every export path (Copy, .md, .docx, Print/PDF) appended below the executive summary. When no assessment exists, exports behave exactly as today.

## Approach
In `src/components/hub/DocumentViewer.tsx`, build a single `exportContent` string derived from the document body plus the assessment (when `assessmentStatus === "complete"` and `assessment` is non-empty), and route all four export handlers through it.

### Composition rule
```
<document content>

---

## McKinsey-Grade Assessment

<deep assessment content, with any leading duplicate H2 stripped>
```
- Separator: a horizontal rule + the canonical H2 so the existing "Deep dive" pill renderer still fires in print/markdown viewers.
- If the assessment string already starts with `## McKinsey-Grade Assessment` (the edge function emits it), don't duplicate the heading.
- Trim trailing whitespace before concatenation.

### Changes in `DocumentViewer.tsx`
1. Add a `useMemo` `exportContent` that returns `content` alone when there's no completed assessment, otherwise the composed string above.
2. `onCopy` → write `exportContent` to clipboard (toast unchanged).
3. `onDownloadMd` → blob from `exportContent`; filename unchanged.
4. `onDownloadDocx` → pass `exportContent` to `markdownToDocxBlob` (title, hero, subtitle unchanged) so the deep dive is rendered with the same heading/list styling as the body.
5. `onPrint` → keep current behavior (prints rendered DOM of `#doc-viewer-article`, which already contains the assessment panel markdown when complete). Verify the assessment block sits inside that article container; if it currently renders outside, wrap it inside `#doc-viewer-article` (or include a print-only rendered copy) so `renderToPrint` captures it. No visual change to the on-screen layout.
6. Existing "Copy / Download (.md)" buttons inside the deep-assessment panel (assessment-only) remain untouched — they're still useful for sharing just the analysis.

### Out of scope
- No backend, schema, prompt, or generation changes.
- No change to the assessment panel UI, triggering, or regeneration flow.
- No change to image/hero handling or PRD prompt copy.
- Bulk export and other documents unaffected.

### Verification
- Open a document with no assessment → Copy/.md/.docx/Print produce today's output (byte-identical markdown).
- Run deep assessment → all four exports now contain the executive summary followed by `---` and the `## McKinsey-Grade Assessment` section.
- Re-run/regenerate assessment → exports reflect the latest version.
- `.docx` opens cleanly with the deep-dive heading styled like other H2s; Print/PDF preview shows both sections in order.
