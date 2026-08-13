# Fix: large startup brief fails to ingest

## What the logs show

Today at 14:15 UTC a founder uploaded `The_Friendship_House_Master_Document.pdf` on `/dashboard/hub/new`. The backend extraction succeeded: the document row now holds **87,881 characters**, with no extraction error. But it finished at **14:16:35** — the edge function ran for **85 seconds** (two invocations, 85.2s and 85.6s, both HTTP 200).

The uploader gives up long before that. `uploadVentureSource` races the extract call against a hard **30-second** timer, then re-reads the row. At 30s the text is still empty, so `hub.new` sees `!text` and marks the file **"Couldn't read file"** — even though the extraction is still running and will succeed a minute later. The founder then retries (the second 85s invocation), which fails the same way and burns another full Gemini pass.

So nothing is actually broken server-side: the failure is a client-side timeout mislabelled as a read failure, and the intake step never unlocks because no source is "ready".

## The fix

**1. Poll instead of racing a 30s timer.** After kicking off extraction, poll the document row every 2s for up to ~4 minutes, stopping as soon as `extracted_at` is set. Return the row with either text or a real `extraction_error`. The 30s value becomes only the point where the UI switches its wording, not where it declares failure.

**2. Honest in-progress state in the uploader.** A source that has no text *and* no error is not an error — render it as "Still reading — large files take a minute" with a live character/elapsed hint, and keep it out of the "ready" count without flipping it to red. Only a returned `extraction_error`, or the poll ceiling being hit, renders as a failure.

**3. Recover already-extracted files instead of re-uploading.** The retry affordance on a stuck row should re-check the existing document row first (the text is often already there, as it was today), and only re-invoke extraction if the row is genuinely empty. This prevents the duplicate 85s passes seen in the logs.

**4. Cut the extraction time for big PDFs.** The 85s comes from one giant single-shot Gemini transcription. Split large PDFs into page-range passes run in parallel with a bounded concurrency and stitch the text back in order, and write partial results as they land so the row stops looking empty mid-flight. Also mark the row as "extracting" when the function starts, so the client can distinguish "queued" from "never started".

**5. Unblock step 1 on partial signal.** Once any source has text — including a partially written extraction — step 1 of the intake wizard should validate, with the Continue blocker showing "Reading your sources…" only while genuinely nothing has landed yet.

## Technical notes

- `src/lib/venture-sources.ts` — replace the `Promise.race([extractPromise, setTimeout(30s)])` block in `uploadVentureSource` with a polling loop (2s interval, ~240s ceiling, resolves early on `extracted_at`); return a status of `ready | extracting | error`.
- `src/routes/_authenticated/dashboard/hub.new.tsx` — the drop handler at ~line 345 and the URL-persist path at ~line 484 currently coerce "no text yet" to `status: "error"`; add an `extracting` status and matching chip rendering (lines ~1052 and ~1256), and let the retry button re-read before re-invoking.
- `supabase/functions/venture-source-extract/index.ts` — set `extraction_started_at` up front; for PDFs over a page/byte threshold, chunk into page-range transcription calls run with a small concurrency pool and concatenate; keep the existing single-shot path for small files. Existing `source_materials` sync and `markSnapshotBrainDirty` behaviour is unchanged.
- No schema change beyond one nullable `extraction_started_at` column on `attendee_documents`.
