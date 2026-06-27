## Approach

On `/dashboard/hub/new` Step 1, replace the second dropzone with a **memory-first** experience:

1. Show everything already in the founder's collective memory as compact icon chips.
2. Ask a single, clear question: *"Anything else you want to add to memory?"*
3. Only reveal upload/link/speak/type controls if they say yes.

Source memory is **never re-collected by default** — it is shown back as confirmation.

## Step 1 layout (new)

```text
─────────────────────────────────────────────────────────────
  STEP 1
  Your source memory

  Here's everything we're already using as your single source
  of truth. We'll carry all of it into this startup snapshot.

  [📄 deck.pdf]  [📄 notes.docx]  [🔗 yoursite.com]
  [🎙 voice-memo.m4a]  [📄 resume.pdf]  [📄 notion-export.md]

       ┌───────────────────────────────────────────┐
       │ Anything else you want to add to memory?  │
       │     [ No, continue ]   [ Yes, add more ]  │
       └───────────────────────────────────────────┘
─────────────────────────────────────────────────────────────
```

If **No, continue** → jump straight to Step 2 (review snapshot). All remembered sources are auto-attached.

If **Yes, add more** → reveal the existing Upload / Paste link / Speak / Type controls inline, below the icon row. Anything new is added to memory with `used_in_brief = true` so it persists for all downstream documents.

## Icon chip rules

Each chip shows:

- An icon based on type: document (PDF/DOCX/TXT/MD), image, audio, or link.
- The filename or hostname, truncated.
- A subtle status dot: ready (green), processing (muted), unreadable (warning).
- Hover/tap tooltip with size or char count.
- Small **×** to remove from memory for this venture (does not delete from the workspace library).

If memory is empty (rare — founder skipped pre-brief collection), Step 1 falls back to: *"We don't have any source material yet. Add some so we can build your snapshot."* and shows the controls immediately.

## Behavior

- On mount, `listVentureSources()` returns rows. Filter to `used_in_brief === true || kind === 'brief_source'` plus any other usable kinds (founder bio, prior brief uploads, scraped URLs persisted as `.md`).
- Auto-select all readable items into `reuseSelected` so they flow into the existing `combinedDocs` pipeline without any user action.
- Default state of the **Add more** controls: collapsed.
- Hide the existing "Or pick from files you've already uploaded" accordion entirely — it duplicates the icon row.

## Files

- `src/routes/_authenticated/dashboard/hub.new.tsx` — replace Step 1 layout with icon row + memory question + collapsible "add more" controls; auto-attach memory; remove the legacy library accordion.

## No backend changes

The source memory layer (`venture_sources`, `used_in_brief`, scraped-URL persistence) already exists. This is a Step 1 UI rework only.