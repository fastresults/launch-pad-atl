# Document persistence — forensic findings & unification plan

## What I found (the clunk)

A new founder (Michael Drew) hits **four separate drop zones** during onboarding, and **none of them share state with each other**. Each one stores (or fails to store) documents in a different place, so the user is asked to re-upload the same files repeatedly.

| # | Where the drop zone lives | What it does today | Where files end up |
|---|---|---|---|
| 1 | `FounderBlock.tsx` — "Tell us about you" in the Brief | Uploads resume → `attendee-docs` bucket; saves path on `attendee_founder_profile.source_file_path`; runs `founder-extract` | ✅ Persists (but isolated to founder profile) |
| 2 | `BriefPrefillDropzone.tsx` — "Pre-fill brief from docs" | Sends files straight to `brief-prefill` edge function for AI parsing | ❌ **Files are never stored.** Throwaway. |
| 3 | `hub.new.tsx` — "Drop notes / docs" on venture creation | Extracts text **client-side** (PDF/TXT/MD only), feeds `venture-synthesize-concept`, and on Create persists **text only** to `venture_snapshots.source_materials` JSONB | ⚠️ Text persists, raw files do NOT. No DOCX support. Not visible in My Files. |
| 4 | `hub.$snapshotId.tsx` → `SourceRecoveryPanel` — "Re-extract from sources" | Yet another local drop zone, re-reads files client-side, overwrites `source_materials` | ⚠️ Same as #3. Doesn't show files already attached to this snapshot. |
| 5 | `MediaHub.tsx` / `documents.tsx` — "My Files" | Uploads to `attendee-docs`, rows in `attendee_documents` with optional `snapshot_id` | ✅ Persists, but **never read by** brief-prefill, synthesize, extract, or deep-research. |

### Why it feels broken
- The same PDF the founder dropped into the Brief (#2) has to be dropped again on the venture creation page (#3) and again on the snapshot review page (#4).
- Files uploaded via My Files (#5) and attached to a venture are invisible to the AI pipeline.
- Nothing in the UI ever says *"I already have these — reuse them?"* because no surface reads from a single source of truth.
- `hub.new` and `SourceRecoveryPanel` can't even handle DOCX (they only parse PDF/TXT/MD client-side), so users get told to "paste the text" — a regression vs. the brief-prefill path which handles DOCX server-side.

## The fix — one library per venture

Make `attendee_documents` the single source of truth for venture context, and have every drop zone read/write through it.

### 1. Schema — one tiny addition

- Add `extracted_text TEXT` and `extracted_at TIMESTAMPTZ` to `attendee_documents` so we cache the parsed text once instead of re-parsing on every AI call.
- Keep `attendee_documents.snapshot_id` (already exists) as the venture link.
- Leave `venture_snapshots.source_materials` as a denormalized cache that always rebuilds from `attendee_documents` (no more "drop zone wrote text but never the file").

### 2. One shared upload helper

Create `src/lib/venture-sources.ts` with:
- `uploadVentureSource(file, snapshotId?)` → uploads to `attendee-docs`, inserts `attendee_documents` row, kicks off server-side text extraction (DOCX + PDF + images via the same path `brief-prefill` already uses), caches `extracted_text`.
- `listVentureSources(snapshotId)` → returns files + cached text.
- `attachOrphanSourcesToSnapshot(snapshotId, fileIds[])` → for files uploaded before a snapshot existed (Brief stage), reattach on venture creation.

### 3. Rewrite every drop zone to use the helper

| Drop zone | New behavior |
|---|---|
| Founder identity (#1) | Still writes to `attendee_founder_profile`, **and** also creates an `attendee_documents` row tagged `kind='founder_bio'` so it shows in My Files and can be folded into venture context if the founder chooses. |
| Brief prefill (#2) | Uploads via helper (snapshot_id NULL initially); after prefill completes, files stay in My Files instead of vanishing. On venture creation we offer "Use these N files as context." |
| Hub.new (#3) | Lists any existing My Files / brief-prefill files at top with checkboxes ("Use these 3 files I already uploaded"). The drop zone now **uploads** (not just reads in-memory) via the helper and tags the resulting rows with the new `snapshot_id` once `createSnapshot` returns. Server-side text extraction means DOCX works. |
| Source recovery (#4) | Replaced with a panel that shows the venture's current source library (from `attendee_documents` where `snapshot_id = current`), with "Add more" and per-file "Remove" + "Re-extract all." No more parallel in-memory state. |
| My Files (#5) | Already works — gains a "Use in venture" affordance per file. |

### 4. AI functions read from the library, not from JSON snapshots

- `venture-extract-concept` and `venture-deep-research`: load source text by querying `attendee_documents` for `snapshot_id`, rather than from `venture_snapshots.source_materials`. `source_materials` becomes a build-time-derived cache that we still write for back-compat, but the functions prefer the live library.
- `brief-prefill`: continues to accept ad-hoc files but **also** writes them through the helper so they don't disappear.

### 5. Backfill for existing users (including Michael)

One-time script:
- For every `venture_snapshots.source_materials.documents[]` entry, create an `attendee_documents` row with `extracted_text` populated and `snapshot_id` set (no file blob — flagged `legacy_text_only=true`).
- For every founder profile resume, ensure a matching `attendee_documents` row exists (`kind='founder_bio'`).

### 6. UI signals so the founder knows it persisted

- Brief, Hub.new, and Source Recovery all show the same "Your venture library (N files)" strip with thumbnails.
- "Use this file again" pill appears whenever the user is on a drop zone and has already-uploaded files in scope.
- One toast vocabulary: "Saved to your venture library" — never just "Uploaded."

## Technical details

- Files referenced for the rewrite: `src/components/brief/BriefPrefillDropzone.tsx`, `src/components/brief/FounderBlock.tsx`, `src/routes/_authenticated/dashboard/hub.new.tsx`, `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx` (SourceRecoveryPanel), `src/components/media/MediaHub.tsx`, `src/lib/attendee.functions.ts`, `src/lib/foundersHub.functions.ts`.
- Edge functions touched: `brief-prefill`, `venture-extract-concept`, `venture-deep-research`, `venture-synthesize-concept`, and a new `venture-source-extract` (server-side DOCX/PDF/image OCR using the same Lovable AI gateway path `brief-prefill` already uses).
- Migration: `ALTER TABLE attendee_documents ADD COLUMN extracted_text text, ADD COLUMN extracted_at timestamptz, ADD COLUMN kind_extra jsonb`.
- No schema break for `venture_snapshots.source_materials`; it stays as a read-cache.

## Out of scope (for this pass)

- The downstream document generation pipeline — that's the next forensic pass once persistence is solid.
- Versioning of uploaded files (replace vs. append) — current behavior preserved.
- Storage quota UI.

## Outcome

After this: a founder drops a deck once during Brief prefill. The same file appears in My Files, is auto-suggested on venture creation, becomes part of the venture's source library, is read directly by extract + deep-research, shows up in the review page's recovery panel, and never has to be re-uploaded.
