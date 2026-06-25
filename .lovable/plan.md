
# Fix Social Studio calendar preview rendering

**Problem:** Each week's content in Social Studio is shown inside a `<pre>` tag, so the markdown table source (`| Day | Pillar | Platform | ...`) is dumped as raw text instead of rendered as a table. It's unreadable.

**File:** `src/components/hub/SocialStudio.tsx`

**Fix:** Replace the `<pre>` block inside the per-week `<details>` with a `<ReactMarkdown remarkPlugins={[remarkGfm]}>` render (same libs already used by `DocumentViewer`). Add small Tailwind table styling so columns are visible:
- Wrap in `overflow-x-auto`
- Style `table` / `th` / `td` via a `prose prose-invert prose-sm max-w-none` wrapper plus a few targeted classes (compact cells, subtle row borders) so it stays readable inside the small accordion.

No other changes — platform fit, launch kit, queries, and parsing stay as-is.
