# Rewrite-with-feedback modal

When a user clicks **Rewrite** on a completed document card, intercept the click and open a modal that collects what was wrong and what to change. Feedback (typed or dictated) is passed into the regeneration prompt so the new version actually addresses their concerns.

## UX flow

1. User clicks **Rewrite** on a `Ready to read` document card.
2. Modal opens titled "Rewrite [Document Name]" with:
   - Short helper copy: "Tell us what's off and what you'd like changed. The next version will follow your guidance."
   - Large textarea (auto-grow, ~6 rows).
   - Mic button inside the textarea toolbar — tap to record, tap to stop. While recording: pulsing red dot + "Listening…" + elapsed seconds. Transcript streams/appends into the textarea so the user can edit before submitting.
   - Optional quick-tag chips (multi-select) appended to the prompt: `Too generic`, `Wrong tone`, `Factually off`, `Too long`, `Too short`, `Missing detail`. Purely additive — not required.
   - Footer: `Cancel` / `Rewrite with feedback` (primary, disabled until textarea or chips have content).
3. On submit: close modal, fire existing `genOne.mutate(t.type)` flow with `{ rewriteFeedback, rewriteTags }` added, card shows existing "Writing…" state.

## Frontend changes

- New `src/components/hub/RewriteFeedbackDialog.tsx` using shadcn `Dialog`, `Textarea`, `Button`, `Badge` chips. Light-surface styling using semantic tokens (`bg-card`, `text-foreground`, `text-muted-foreground`) — no hardcoded colors.
- Voice capture via `MediaRecorder` (webm/mp4 auto-detected per `ai-speech-to-text` knowledge). On stop, POST blob to a new edge function `venture-transcribe` which proxies to Lovable AI `openai/gpt-4o-mini-transcribe` (streaming SSE). Deltas append to textarea live; final `done` event replaces with full text. Mic permission errors and empty-blob (<1KB) cases show inline messages and don't call the API.
- `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx`:
  - Add `const [rewriteTarget, setRewriteTarget] = useState<{type, name} | null>(null)`.
  - Rewrite button `onClick={() => setRewriteTarget({ type: t.type, name: t.name })}` instead of calling `genOne.mutate` directly.
  - Render `<RewriteFeedbackDialog target={rewriteTarget} onClose={() => setRewriteTarget(null)} onSubmit={(feedback, tags) => { genOne.mutate({ type: rewriteTarget.type, feedback, tags }); setRewriteTarget(null); }} />`.
  - Update `genOne` mutation signature to accept `{ type, feedback?, tags? }` and pass them through.
- `src/lib/foundersHub.functions.ts` `generateDocument`: accept and forward optional `rewriteFeedback` and `rewriteTags` in the function body.

## Backend changes

- `supabase/functions/venture-generate-document/index.ts`: read `rewriteFeedback` and `rewriteTags` from body. When present, append a `## Rewrite guidance from the founder` block to the system/user prompt (verbatim feedback + bullet list of selected tags) and treat as a regeneration of the existing document. No schema changes required.
- New `supabase/functions/venture-transcribe/index.ts`: accepts `multipart/form-data` with `file`, forwards to `https://ai.gateway.lovable.dev/v1/audio/transcriptions` with `model=openai/gpt-4o-mini-transcribe`, `stream=true`, passes SSE body straight back. Uses `LOVABLE_API_KEY`. Filename extension derived from blob MIME (webm/mp4/mp3/wav). Verify JWT (default).
- Register both functions in `supabase/config.toml` if not already auto-managed.

## Out of scope

- Persisting feedback history per document (can be added later).
- Non-document rewrites (Concept Studio already has its own critique loop).
- Changing the prompt structure of unaffected documents.

## Verification

- Click Rewrite on Executive Summary → modal opens, textarea focused.
- Type feedback → submit → card flips to "Writing…" → new document reflects feedback.
- Record voice → transcript appears → edit → submit works.
- Deny mic permission → inline error, modal still usable for typing.
