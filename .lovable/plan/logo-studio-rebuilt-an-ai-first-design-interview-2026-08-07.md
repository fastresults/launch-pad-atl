# Logo Studio, rebuilt: an AI-first design interview

## Scrap first

The current pipeline is retired, not patched. Deleted or reduced to nothing:

- The multi-stage run machine in `venture-brand-assets` — `logo_create_run`, `logo_read_context`, `logo_develop_brief`, `logo_develop_directions`, `logo_render_concept`, `logo_jury`, `logo_vectorize`, `logo_draw_vector`, `logo_retry_direction`, `logo_restore_render`, `logo_force_reset`, and the lease/heartbeat plumbing around them.
- The client-side driver, stall detection, "Clear queue", "Resume this one", and the render-history archive in `BrandWizard.tsx`.
- `logo-geometry.ts` primitive drawing (the source of the arch-in-a-circle blobs), `logo-jury.ts`, `logo-business-read.ts`, `logo-reference-read.ts`, `logo-render-prompt.ts` as they stand.
- The `brand_logo_runs` / `brand_logo_directions` job ledger. Existing rows are kept read-only for reference and no longer written to.

Nothing about batch runs, queues, retries, or watchdogs survives. There is no background job to stall.

## What replaces it

A conversation. The founder talks to an award-winning logo designer who is drawing while they talk. Every exchange is a question plus a fresh set of roughs on screen. Back and forward at any point. No spinners waiting on a batch of three; each step is one short request the user is watching.

### The designer's starting knowledge

Before the first question, the studio loads the venture's real context: the brand kit (typefaces, colour system, personality), the mood board, and the substance of the sixty-odd generated assets — positioning, customer, offer, tone, the words the founder actually used. The opening line is not "what do you want" but a designer's read-back: here is who I think you are, here is where I'd take the mark, correct me.

### The interview

Adaptive, not a fixed form. The designer asks the next most useful question given what it already knows and what the founder just said, and stops asking as soon as it has enough. Typical arc:

1. **Read-back and correction.** The designer states the business in one line and names the human truth it wants the mark to carry. The founder confirms, corrects, or redirects.
2. **Type of mark.** Symbol plus wordmark, wordmark alone, lettermark/monogram, or an emblem. Shown as roughs, not described in words.
3. **What the symbol is.** Two or three candidate subjects drawn from the context, each with a one-line reason. The founder picks or rejects; rejection triggers a fresh set.
4. **Character.** Geometric or humanist, weight, line versus solid, how much detail survives at 24px.
5. **Colour and type.** Defaults come from the existing brand system; the founder can pull a different accent or lock to mono.
6. **Refinement.** Free-form. "Heavier", "lose the circle", "make the two figures read as parent and child", "closer to option 2 but simpler."

At every step the founder can go back a step and take a different branch. Earlier roughs stay reachable so nothing good is lost.

### Live roughs — how quality gets fixed

Roughs are drawn by an image model with the full brand context in the prompt, at small size and low step count so a set returns in seconds. This is the part that was working before it got replaced with primitive-assembly; it is coming back and staying. Two or three roughs per step, never a large batch, so a set is cheap to discard.

Text is never baked into a rough. The wordmark is set separately in the brand typeface and locked to the symbol in the lockup, which removes the mangled-lettering failure entirely.

### Approval and vectorisation

When the founder approves, the approved rough is what gets vectorised — traced, not redrawn. Edges are extracted to closed paths, colours snapped to the brand tokens, paths simplified and cleaned, and the wordmark is placed as real outlined type. Shape fidelity is guaranteed by construction: the approval and the vector are the same artwork. The founder sees the traced vector side by side with the rough before it is committed, and can send it back for another pass.

Committing writes the primary mark plus the horizontal, stacked, mono and knockout lockups into the brand kit, and unlocks the existing downstream paths: the website PRD infusion, social assets, and the design system.

## Technical notes

- New edge function `venture-logo-studio` with a small synchronous action set: `start_session`, `answer` (returns next question plus roughs), `back`, `refine`, `approve`, `commit`. Every action returns within one request. No leases, no heartbeats, no watchdog.
- One new table `venture_logo_sessions` holding the transcript, the accumulated design brief, and every rough generated, with `GRANT`s and owner-scoped RLS in the same migration. Branching is a pointer into the transcript, so back/forward is a state change rather than a rerun.
- The interviewer is a single `openai/gpt-5.6-sol` call per turn via the gateway Responses API, given the brand kit, mood board, asset digest, and transcript so far; it returns the next question and the art direction for the roughs.
- Roughs render through the Higgsfield connector, falling back to a gateway image model. Failures are reported inline on the step with a retry button — never a silent fallback, never a paused card.
- Tracing runs in the edge function on approval only: a real raster-to-vector trace, no model call.
- New UI at `src/components/hub/logo-studio/` — a conversation column with the step's question and a canvas of roughs beside it. `BrandWizard.tsx` keeps the brand kit, mood board and PRD sections and links out to the studio for the mark.
- Uploading an existing logo stays available and skips straight to commit.

## What changes for you

You answer a handful of questions and watch marks appear as you answer them. You steer while it draws instead of judging three finished things you did not ask for. What you approve is what you download. Nothing runs in the background, so nothing can stall.
