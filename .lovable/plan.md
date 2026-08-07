# Logo Studio: feedback is being dropped between the founder and the drawing

## What the logs actually show

I pulled the live session for this venture (`status: interviewing`, one step recorded).

- The stored brief still proposes only "a welcoming front porch — one sheltering roof, two sturdy posts and an open doorway." There is no elderly person, no caregiver, no wordmark anywhere in it.
- The session has exactly **one** update after it was created: the `approve_brief` call that drew the porch. There is **no** `revise_brief` call in the record and none in the function logs.
- The single drawn rough's render brief is the unmodified opening direction, word for word.

So the feedback never reached the designer. It was typed, and then thrown away.

## Root causes (four, in order of severity)

**1. The brief-stage note is silently discarded when you approve.**
In the studio UI, the correction box and the "Approve the brief & draw it" button are separate. Approving calls the edge function with no instruction and then clears the textarea. Anything typed is lost with no warning. This is exactly what happened here — the elderly-person / caregiver / wordmark note went into the box, Approve was pressed, and the drawing ran off the original porch direction.

**2. A wordmark can never appear in a rough, by hard rule.**
Both the designer's system prompt ("NEVER put letters, words or text in a rough") and the image prompt ("Absolutely no letters, no words, no text") forbid type. That rule exists for a good reason — the real wordmark is set later in the brand typeface — but the founder was never told, so asking for "the company name to the right" reads as being ignored.

**3. Nothing carries a requirement forward.**
Each turn re-derives the drawing brief from scratch. There is no accumulated list of non-negotiables, so even a correctly delivered instruction ("two human figures, one elderly, one caregiver") can quietly evaporate on the next redraw.

**4. Redraws are blind.**
Every rough is a fresh text-to-image call. The previous rough is never passed back as a visual reference, and the previous render brief is never shown to the interviewer — only the rough's title. "Evolve this mark" is therefore impossible; each turn is a new guess.

## The fix

### A. Never lose a typed correction
- If the brief-stage box has text, "Approve the brief & draw it" applies that correction first (rewrite, then draw) instead of ignoring it — one click, correction honoured.
- Same guard on the interview: unsent free text is folded into the action, never cleared without being used.

### B. A requirements ledger the designer cannot forget
- Add a `requirements` list on the session: short, literal constraints extracted from every founder message ("symbol must show an older adult and a caregiver together", "warm, not clinical").
- The list is re-injected into **every** subsequent interviewer call and appended verbatim to **every** image prompt.
- Show it in the UI above the mark as "Locked in", each item removable — so a dropped requirement becomes visible rather than silent.

### C. Honest handling of wordmark requests
- Detect lockup/typography requests ("company name to the right", "text beside the mark") and answer them explicitly: the symbol is drawn alone on purpose, the wordmark is set in the real brand typeface at approval.
- Add a live **lockup preview** beside the rough — the current mark with the company name typeset in the brand font, horizontal and stacked — so "name to the right" is answered on screen instead of denied.

### D. Real iteration, not a fresh guess each turn
- Pass the current rough image back to the image model as the primary reference on `answer` and `refine`, ahead of the moodboard tiles, with instruction to keep the existing composition and change only what was asked.
- Pass the previous render brief (not just the title) into the interviewer, plus the requirements ledger, so the new direction reads as an edit of the old one.
- Show a short "what changed" line under each new rough so drift is visible immediately.

### E. Recovery for the session already open
- A "Resume with my notes" affordance so this session can be corrected in place rather than started over.

## Technical notes

- `src/components/hub/logo-studio/LogoStudio.tsx` — approve-with-pending-note behaviour, requirements chips, lockup preview, "what changed" line.
- `supabase/functions/_shared/logo-interview.ts` — add `requirements` to the turn schema and system prompt; accept prior render brief + ledger; append ledger to `roughPrompt`; replace the blanket text ban with "no text in the symbol, the wordmark is set separately."
- `supabase/functions/venture-logo-studio/index.ts` — persist `requirements` on the session, merge each turn, pass the current rough's signed URL as the lead reference into `drawOne`, apply pending brief corrections inside `approve_brief`.
- `supabase/functions/_shared/logo-lockup.ts` — reuse for the raster lockup preview during the interview, not just at commit.
- No schema change required; `requirements` lives inside the existing `brief` JSON column.
