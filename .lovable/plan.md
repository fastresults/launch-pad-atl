# Fix: "Copy prompt only" copies the wrong (or no) content

## Why it's broken
The Website PRD markdown now contains **multiple** fenced code blocks: `robots.txt`, `sitemap.xml` (Section 5), and finally the paste-ready master prompt (Section 8).

`onCopyPrdPrompt` in `src/components/hub/DocumentViewer.tsx` (line 489) uses:

```
content.match(/```[a-zA-Z]*\n([\s\S]*?)```/)
```

That regex returns the **first** fenced block — usually `robots.txt` — not the Section 8 master prompt. To the user it looks like "nothing useful was copied". There is also no `await`/`try-catch` around `navigator.clipboard.writeText`, so a clipboard rejection fails silently.

## Fix (frontend only, `DocumentViewer.tsx`)

1. Rewrite `onCopyPrdPrompt` to locate the master prompt deterministically:
   - Find the `## 8. Paste-Ready Master Prompt` heading (case-insensitive, tolerant of "Section 8" / different numbering).
   - Extract the **first fenced block after** that heading.
   - Fallback chain if the heading is missing: pick the **largest** fenced block whose language tag is empty/`md`/`markdown`/`text` (skips `robots`, `xml`, `json`, `txt` blocks); if still none, pick the largest fenced block of any kind.
   - If nothing found, keep the current error toast.
2. Make the handler `async`, `await navigator.clipboard.writeText(...)`, wrap in `try/catch`, and on failure show `toast.error("Clipboard blocked — copy manually from Section 8.")`.
3. Update the success toast to `"Master AI-builder prompt copied (~{n} words)"` so the user sees confirmation that the right block landed.

No backend, prompt, or schema changes. Scope is the single handler in `DocumentViewer.tsx`.
