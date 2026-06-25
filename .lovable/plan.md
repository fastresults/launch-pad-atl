
# Simplify the venture "Generate" page for novice users

Scope: `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx` (GenerateStep) plus light tweaks to `BrandStudio.tsx` and `SocialStudio.tsx`. No business logic, no backend, no data shape changes — only how the page is laid out, labeled, and progressively revealed.

## Why the current page overwhelms novices

Looking at the screenshot, a first-time founder sees, all at once:
- A 4-step pill bar with jargon ("Enriching", "Generate")
- A "33 / 33 complete · ~165 min total" header with a "Generate all 33" purple button
- A red "2 recent failures" panel
- Brand Studio with raw hex codes, font names, and 4 small action buttons
- Social Studio with platform chips, a calendar preview, launch kit
- Below the fold: 33 document cards grouped by category

There is no single "do this next." Every section competes for attention, the language is internal ("ventures", "snapshot", "Brand Studio", "Social Studio", "Platform fit"), and the most important action (generate everything) is visually equal to micro-actions like "Copy logo prompt".

## What we'll change (UI-only)

### 1. One hero "Next action" card at the top
Replace the current "Generate your documents" header block with a single, friendly hero card that always shows ONE next step:

- If `completeCount === 0` → "Let's build your startup kit" with one big **Start generating** button + plain-English explainer ("We'll write ~33 documents for you — strategy, brand, social, launch. Takes about 2-3 hours. You can leave and come back.")
- If a job is running → "We're writing your documents…" with the progress bar, current doc name in plain English (e.g. "Writing your brand strategy"), and "Leave this open or come back later" reassurance. Cancel becomes a small ghost link, not a prominent button.
- If `0 < completeCount < total` and no job running → "Pick up where you left off" with **Continue generating** as the primary action and "X of Y done" sub-copy.
- If `completeCount === total` → "Your startup kit is ready" with **View your documents** as primary and a subtle "Regenerate all" link.

Failures collapse into a tiny "Something to fix (2)" inline link inside this card, not a red panel.

### 2. Defer Brand Studio and Social Studio behind a collapsed "Bonus tools" section
These are advanced/optional today but rendered as prominent sibling sections. We'll:
- Move both below the document list
- Wrap them in a single collapsed `<details>` block titled **"Bonus tools (optional)"** with a one-line description: "Generate logos, social posts, and brand assets after your documents are ready."
- Auto-expand only when `completeCount === total` (i.e., once the user actually has something to brand).
- Inside BrandStudio and SocialStudio: keep current content but soften jargon — "Palette" stays, but hex codes hide behind a "Show color codes" toggle so novices just see swatches + role names. Same for "Platform fit" — show platform names with green/amber/gray dots, hide the "Yes/Maybe/Skip" badge text behind a tooltip.

### 3. Reframe the 33-document list as "Your documents" with plain-English status
- Section heading changes from category jargon (e.g. "brand_identity") to friendly titles already in `listDocumentTypes` (these exist; just ensure we use `t.label`/`t.name`, not `t.type`).
- Each card gets ONE status line in plain English: "Ready to read", "Writing now…", "Waiting on [X]", or "Not started yet" — replacing the current Lock/Circle/CheckCircle ambiguity.
- Per-card buttons collapse to one primary: **Read** (if complete) or **Generate** (if deps met) or disabled with tooltip "Finish [dep label] first" (if locked). The "View" eye icon and separate generate button merge.

### 4. Strip and rename the top-of-page chrome
- Step pills: keep but rename "Enriching" → "Research", "Generate" → "Write documents". Hide pills entirely once on step 4 (they only add noise once you're past them) — replace with a single breadcrumb: "← Back to your startups".
- "Back to ventures" → "Back to your startups" (matches Core memory: say "startup", not "venture/business").

### 5. Add a one-line "What is this page?" helper
Directly under the new hero card, a dismissible muted line: "This page builds your full startup kit — 33 documents covering strategy, brand, and launch. We'll guide you one step at a time."

## What we will NOT change
- No changes to the Concept / Enriching / Review steps (separate scope)
- No changes to data, edge functions, document types list, or generation logic
- No removal of any feature — Brand Studio and Social Studio still work, just deferred
- No sidebar / global shell changes (those were skipped in the prior question round)

## Technical notes

Files touched:
- `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx` — rewrite `GenerateStep` JSX (the function starting around line 315). Keep all existing queries/mutations (`typesQ`, `docsQ`, `jobQ`, `failuresQ`, `genOne`, `bulk`, `cancel`) unchanged; only rearrange and re-label what they render. Introduce a small `<NextActionHero />` local component that derives its state from `(job, completeCount, types.length, failuresQ.data)`.
- `src/components/hub/BrandStudio.tsx` — wrap hex codes in a `useState` toggle; no logic change.
- `src/components/hub/SocialStudio.tsx` — replace explicit "Yes/Maybe/Skip" badge text with a colored dot + tooltip; no logic change.
- Rename the "Back to ventures" link text and the step labels — no route changes.

Approximate diff size: ~150 lines changed in the snapshot page, ~15 each in the two studios.

## Visual hierarchy after the change

```text
← Back to your startups
[ research • write documents ]   (only if not yet on step 4)

┌─────────────────────────────────────────────────────────┐
│  Your startup kit is ready (or: Let's build it / etc.)  │
│  [ Primary action button ]                              │
│  small helper line · progress bar if running            │
└─────────────────────────────────────────────────────────┘

This page builds your full startup kit — we'll guide you. ✕

YOUR DOCUMENTS
  ▸ Strategy        [ Read ] [ Read ] [ Generate ] ...
  ▸ Brand           ...
  ▸ Social          ...
  ▸ Launch          ...

▸ Bonus tools (optional)     ← collapsed by default
```
