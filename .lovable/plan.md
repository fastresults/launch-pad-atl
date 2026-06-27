## Goal
When the founder adds a new source from the "Anything else?" controls (Upload / Paste a link / Speak / Type), it should appear as a pill in the **Your source memory** row alongside `plan-v1.md` and `business-case.md` — instead of (or in addition to) the separate "SAVED" list below the dropzone.

## Where it breaks today
In `src/routes/_authenticated/dashboard/hub.new.tsx`:
- Memory chips are derived from `reusable` (sources loaded once on mount via `listReusableVentureSources`).
- New uploads land in a separate `files` state and render in their own list at the bottom (the "SAVED" row in the screenshot).
- Scraped URLs land in `scrapedUrls`; typed/spoken notes land in their own buffers. None of these append to `reusable`, so the top chip row never updates.

## Changes

1. **Single source of truth for chips.** After every successful add — `uploadVentureSource` (Upload), `venture-scrape-url` (Paste a link), audio transcription save (Speak), and text save (Type) — append the returned `VentureSource` row into `reusable` so `memoryChips` picks it up automatically. Mark it auto-selected in `reuseSelected` so it carries into enrichment.

2. **Replace the duplicate "SAVED" file list.** Stop rendering the per-file row at the bottom for successful uploads — the chip in the memory row is the confirmation. Keep an inline status only while a file is still `uploading` or in `error` (so the founder sees progress / can retry). Once `ready`, remove from `files` (it now lives as a chip).

3. **Same treatment for the other tabs.**
   - **Paste a link:** on successful scrape, persist via `uploadVentureSource` (synthetic `.md`) and push the row into `reusable`; remove the separate scraped-URL list item.
   - **Speak / Type:** when the founder saves a transcript / note, persist as a venture source and push into `reusable` so it shows as a pill too.

4. **Chip metadata for new items.** Extend the `memoryChips` mapper so newly added venture sources get sensible icon/label treatment (PDF/DOCX → file icon, scraped URL → globe, audio → mic, image → image icon). Origin defaults to `"venture"` for anything added on this screen.

5. **Re-process banner.** Keep the existing "Added more sources? Re-run the fill." prompt — it stays relevant because new chips now feed the same pipeline.

## Out of scope
- No backend / schema changes. `uploadVentureSource` already returns the row we need.
- No change to how enrichment consumes sources — it already reads from `reuseSelected` + `files`.

## Technical notes
- File: `src/routes/_authenticated/dashboard/hub.new.tsx`.
- New helper `appendToMemory(row: VentureSource)` to `setReusable(prev => [row, ...prev])` and `setReuseSelected(prev => ({ ...prev, [row.id]: true }))`.
- Guard against double-append if a re-process path also returns the same row id.
