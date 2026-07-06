
## Two additions to Step 1 of `hub.new.tsx`

### 1. Reset control at Step 1

Add a small **"Reset step 1"** button in the Step 1 header (right side, next to the drafting spinner). It opens a confirm dialog: *"Clear all sources and start over? Your source memory, pasted links, uploads, the auto-drafted concept, and every AI-filled field will be cleared. This doesn't delete files from your account library."*

On confirm:

- **Deselect every memory chip** — `setReuseSelected({})` so nothing in memory is fed to synthesis. Memory itself stays (the founder's library isn't destroyed), but chips render as "unused" (opacity-60, gray dot).
- **Wipe transient intake state** — `setFiles([])`, `setScrapedUrls([])`, `setUrlInput("")`, `setNextUrlIntent("own")`, `setIntakeTab("upload")`, `setAddMoreOpen(false)`.
- **Wipe AI-filled fields** — clear every value in `aiFilled` back to its prefill/canonical default. Anything the founder typed themselves stays. Concrete rule: for each `key` in `aiFilled`, reset the corresponding state using the same source the prefill effect uses (`prefill?.<field>` or `canonicalCtx.<field>`, or `""`). Then `setAiFilled({})`, `setProcessed(false)`, `autoSigRef.current = ""` so auto-synthesis will fire again on the next added source.
- Toast: *"Cleared. Add a source or type your concept to start again."*

A secondary **"Deselect all"** ghost link in the memory chip row (only shown when at least one chip is selected) does the lightweight version — just `setReuseSelected({})` without touching typed fields. This handles the common "I don't want any of my old sources influencing this new venture" case without the full nuclear reset.

### 2. Make the own-vs-pattern choice unmissable

Today the intent toggle only lives on the Link tab, and once saved, the chip in "Your source memory" shows only a tiny "Pattern" badge (invisible in the attached screenshot because that chip was saved as "own"). Three changes:

**a. Promote the toggle to a full segmented control at the top of the Link tab, with icons and always-visible copy.**

```text
┌─────────────────────────────────────────────────────────────┐
│  How should we use this link?                               │
│  ┌────────────────────────────┐ ┌──────────────────────────┐│
│  │ ● [globe] My own site      │ │ ○ [compass] Pattern only ││
│  │   Pull name, contact,      │ │   Learn the shape.       ││
│  │   location, content.       │ │   Won't copy their name  ││
│  │                            │ │   or address.            ││
│  └────────────────────────────┘ └──────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

Default: **My own site**. Auto-flip to **Pattern only** when the pasted URL's hostname doesn't match a hostname the founder already typed into `websiteUrl` and the founder has typed any of their own identity fields. Founder can always override.

**b. Show the intent inline on every URL row and every memory chip — for both states, not just "pattern".**

- Own chip: subtle outline badge "Mine" (muted-foreground border).
- Pattern chip: primary-tinted badge "Pattern" (already in place).

This removes the ambiguity in the screenshot where a chip with just a green dot could be either.

**c. Let the founder flip a saved chip's intent without re-scraping.**

Click the badge on any URL-capture memory chip → toggles between "Mine" and "Pattern". Under the hood, rewrite the first `Intent:` line in the source's `extracted_text` via a new `updateVentureSourceIntent(id, intent)` helper in `src/lib/venture-sources.ts` (a targeted `update` on `attendee_documents.extracted_text`). Instant feedback, no re-scrape cost.

**d. Confirm-on-mismatch guard rail when the founder clicks "Create venture".**

If the ONLY sources feeding synthesis are pattern references (no own docs, no typed concept ≥20 chars), and one or more identity fields are still empty, show a soft warning modal: *"Your sources are pattern references only. Add your startup's name, contact, and location before we generate — otherwise we'll leave those blank."* Buttons: **Add my details** (jumps to first empty identity field) / **Create anyway**.

## Files to change

- `src/routes/_authenticated/dashboard/hub.new.tsx` — Reset button + confirm dialog, `resetStepOne()` handler, "Deselect all" link, promoted segmented toggle, "Mine"/"Pattern" badges on all URL chips (memory + transient), click-to-flip on saved chips, pre-submit pattern-only guard modal.
- `src/lib/venture-sources.ts` — `updateVentureSourceIntent(id: string, intent: "own" | "pattern")` that reads `extracted_text`, replaces or inserts the `Intent:` header line near the top, and updates the row.

## Out of scope

- Deleting files from the founder's actual library (reset only unselects them — deletion is destructive and stays on the individual chip's `X` button).
- Changing the Upload / Speak / Type tabs — uploaded docs and typed concepts are always "own" and don't need an intent picker.
- Anything downstream of `createSnapshot` — the concept + confirmed form fields are what feed the rest of the pipeline, so once Step 1 is clear the rest is already right.
