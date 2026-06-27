# Streamlining the Create-Venture flow

## What's working today
- Multi-source intake exists: file drop, URL scrape, voice, reusable library, draft text.
- `venture-synthesize-concept` already fills ~10 fields from any combination of those sources.
- Canonical-context prefill pulls from Brief/Profile.

## What's hurting novices
1. **Wrong order.** The form opens with 12 founder/market inputs *before* the AI intake card. Novices fill manually before realizing the dropzone would have done it.
2. **Too many top-level choices.** The "I have a website / Patterned from competitor / Manual" path cards duplicate the dropzone + URL + textarea below and add a decision they don't need.
3. **AI fill is a hidden second click.** After uploading a file the user must scroll, find "Use my context to fill the form", and press it. Most novices won't.
4. **Track selector is buried inside Founder & market** and pulses red when the test button is clicked — confusing dependency.
5. **Five intake surfaces stacked flat** (dropzone, library, URL, mic, textarea) read as a wall. No clear "do one of these" framing.
6. **Submit gate is invisible.** Disabled button + hover tooltip only — user can't tell what's missing without hunting.
7. **Dev-only "🧪 Fill test concept" button is visible in the production UI.**
8. **Country defaults to United States but city/region are still required** with no autodetect hint.

## Recommended restructure

New page reads top-to-bottom as three named steps:

```text
Step 1 — Give us something to work with   [AI Intake card, hero]
Step 2 — Confirm what we found            [Pre-filled review card]
Step 3 — Pick your track & create         [Track + primary CTA]
```

### Step 1 — AI Intake (single hero card, replaces today's path picker + concept block position)
- One card, tabbed: **Upload · Paste a link · Speak · Type**. Default tab = Upload.
- Reusable library renders as a collapsible "Or pick from files you've already uploaded" inside the Upload tab.
- **Auto-synthesize on first ready input.** As soon as one file finishes extraction, one URL finishes scraping, or the textarea passes 20 chars + 2s idle, fire `venture-synthesize-concept` automatically. Show a single inline status: "Reading your sources…" → "Filled 9 fields — scroll to confirm".
- Keep a manual "Re-process" button for when the user adds more sources.
- Remove the three Path cards. `path` state stays internally (default `manual`); if the synth returns a `website_url`, switch to `own` silently so we still scrape it during enrichment.

### Step 2 — Confirm what we found (collapsible review card)
- Renders the existing Founder & market + Company fields, but:
  - **Collapsed by default** when every required field is filled (shows a 1-line summary: "Jane Doe · Atlanta, GA · Coffee shop · Local"). Expand to edit.
  - **Auto-expanded** when any required field is empty, with empty fields highlighted at the top of the card and a "Jump to next" link.
- Field-level "AI-filled" pill on inputs populated by synth, so the user knows what to double-check.
- Move the "Looks right — ready to create" hero banner here, above the card, when `missingFields.length === 0`.

### Step 3 — Track + Create
- Lift Track out of Founder & market into its own small card right above the primary CTA. Same 6 tiles; "Most attendees" badge stays.
- Primary CTA becomes a sticky bottom bar on mobile (`Create & start enrichment`).
- Replace the disabled-button tooltip with an inline checklist directly above the CTA: list each missing field as a clickable chip that scrolls to and focuses the input.

### Smaller cleanups
- Gate `🧪 Fill test concept` behind `import.meta.env.DEV` or an admin flag.
- Default `track` stays `lifestyle`, but show a small "Change track" link instead of forcing a visible 6-tile selector if the user came `fromBrief` and track is already set.
- Mic button gets a one-line helper the first time it's used ("Tap and tell us what you're building — 30 seconds is plenty").
- Inline character counter on the concept textarea turns green at 20 chars instead of just showing a number.
- Add a quiet "We never share your uploads" line under the dropzone — novice trust.

## Files to change
- `src/routes/_authenticated/dashboard/hub.new.tsx` — reorder sections, add auto-synth effect, collapsible review, missing-field chips, dev-gate test button.
- New `src/components/hub/AIIntakeCard.tsx` — tabbed Upload/Link/Speak/Type wrapper to keep `hub.new.tsx` readable.
- New `src/components/hub/ConfirmFieldsCard.tsx` — collapsible review wrapper around the existing inputs.
- No backend, schema, or Edge Function changes — synth, scrape, and upload paths are reused as-is.

## Out of scope
- Changing what the AI extracts.
- Changing the 4-step "Create venture" copy at the top (kept for orientation).
- Touching Hub list, snapshot detail, or workflow pages.

Approve and I'll implement.
