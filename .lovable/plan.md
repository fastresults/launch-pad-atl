## Plan: Add voice recording to `/dashboard/hub/new`

### Goal
Let founders dictate their answers on the "Tell us about the venture" step instead of typing — using the existing `VoiceRecorder` component already used in `/dashboard/brief` and `/dashboard/workflow/$key`.

### Scope
Add a mic button next to each free-form text field on `src/routes/_authenticated/dashboard/hub.new.tsx`:

1. **Business concept** (the textarea in the screenshot) — primary target. Mic button sits in the label row, top-right of the field.
2. **Differentiation statement** (only shown when the "Patterned from competitor" path is selected) — same treatment.

Company name and URL inputs stay text-only — voice doesn't help for those.

### Behavior
- Click mic → records via existing `MediaRecorder` flow → Lovable AI transcribes via `transcribeAudio` (already wired in `src/lib/voice.functions.ts`).
- Transcript is **appended** to the current textarea value (with a space separator if there's already content), not overwritten — so a founder can dictate, refine by typing, then dictate more.
- While recording, the existing component shows its standard recording/processing state; the textarea stays editable.
- Pass a short `context` string to the recorder so transcription stays on-topic (e.g. "Founder describing their business concept").

### Files touched
- `src/routes/_authenticated/dashboard/hub.new.tsx` — import `VoiceRecorder`, add it inline next to the Business concept and Differentiation labels, wire the `onTranscript` handler to append to state.

### Out of scope
- No changes to `VoiceRecorder`, `voice.functions.ts`, or any edge function.
- No DB, RLS, schema, or pricing changes.
- No changes to other hub pages.