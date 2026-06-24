## Plan: Drop documents to auto-write the Business concept

### Goal
On `/dashboard/hub/new`, let a founder drop one or more documents (pitch deck export, one-pager, brand brief, notes, etc.) and have the system read them, then synthesize a clean Business concept paragraph into the textarea. They can still type, dictate, or edit on top of it.

### UX
Add a dropzone block directly above the Business concept textarea:

```
+----------------------------------------------------+
|  Have notes already? Drop them in.                 |
|  We'll read your pitch deck, one-pager, or notes   |
|  and turn them into a clean concept.               |
|  [ drag files here · or browse ]   PDF · DOCX ·   |
|                                    TXT · MD · 20MB|
+----------------------------------------------------+
   [ list of attached files w/ remove + status chip ]

[ Business concept textarea ]
  - mic button (already added)
  - new: "✨ Draft from my files" button (enabled when ≥1 file parsed)
```

Behavior:
1. Founder drags/selects files (max 5, max 20MB each).
2. Each file shows a status chip: `Reading…` → `Ready` (or `Couldn't read — try a different format` on failure).
3. When at least one file is `Ready`, "Draft from my files" enables. Click → calls a new edge function that summarizes the extracted text into a 2–4 sentence Business concept, then writes it into the textarea (replacing existing concept text, with a confirm-toast undo if there was already content).
4. Founder can still edit, dictate more via the mic, or add another file and re-draft.

Copy on the page:
- Section heading above textarea changes from a single field to a grouped block titled **"Your business concept"** with intro line: *"Type it, dictate it, or drop in your notes — pick whatever's easiest."*
- Textarea label stays "Business concept *", placeholder updated: *"Describe what you're building, who it's for, and why it matters — or drop notes above and we'll draft it for you."*

### Technical scope

**Client (`src/routes/_authenticated/dashboard/hub.new.tsx`)**
- New local component `ConceptDropzone` (inline in this route, no shared component yet).
- HTML5 drag-and-drop + hidden `<input type="file" multiple accept="…">`. No new dependency — `react-dropzone` is overkill for this surface.
- Per-file text extraction in the browser:
  - **PDF** → reuse `unpdf` dynamic import (pattern from `src/lib/discovery-helpers.ts`).
  - **TXT / MD** → `await file.text()`.
  - **DOCX** → punt in v1; show a friendly "DOCX coming soon — export to PDF for now" message. (Avoid adding mammoth/server parsing to keep scope tight.)
- Stash extracted text per file in component state; reject empty/scanned-PDF results with a clear message.

**Edge function (new)** `supabase/functions/venture-synthesize-concept/index.ts`
- POST `{ sources: [{ filename, text }] }` → returns `{ concept: string }`.
- Calls Lovable AI Gateway (`google/gemini-3-flash-preview`) with a tight system prompt: "Read these founder source documents and write a 2–4 sentence Business concept paragraph in first-person plural ('We…'). Cover: what we're building, who it's for, why now. No headers, no bullets, no filler."
- Trims input text to ~20k chars per file, 60k total, to stay safe on tokens.
- Standard CORS + JWT-verified user (matches existing venture functions). No DB writes — pure synthesis.

**No DB / storage changes.** Files never hit storage; they're parsed in the browser and only the extracted text is sent to the edge function. This keeps the dropzone snappy and avoids storage policy work for a transient input.

### Files touched
- `src/routes/_authenticated/dashboard/hub.new.tsx` — add dropzone, file list, "Draft from my files" button, wire to new edge function.
- `supabase/functions/venture-synthesize-concept/index.ts` — new file.

### Out of scope
- DOCX / image / audio parsing (called out as v2 in UI copy).
- Persisting uploaded files to storage.
- Changes to `venture-extract-concept`, `venture-bulk-generate`, or any other hub surface.
- Pricing, auth, RLS, schema, or routing changes.