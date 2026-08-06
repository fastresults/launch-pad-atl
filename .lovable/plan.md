# Progressive new-venture intake

Today all three steps render at once as stacked cards (source memory, confirm details, pick track) with a sticky "Create" bar. Nothing is gated, so a founder can scroll past the AI intake and hit a form with 9 red "still needed" chips. Make it a true one-step-at-a-time wizard where each step unlocks only after the previous one validates.

## How it should feel

```text
[ 1 Source ]───[ 2 Confirm ]───[ 3 Track ]───[ Create ]
   active         locked         locked
```

- Only one step is expanded at a time; completed steps collapse into a one-line summary with a checkmark and an "Edit" affordance.
- Future steps render dimmed and non-interactive with a lock icon and a line explaining what unlocks them ("Add a source or describe the startup first").
- Advancing is explicit: a "Continue" button at the bottom of the active step, disabled until that step passes validation, with the blocking reason shown next to it.
- Going back is always allowed by clicking a completed step's header; later steps stay unlocked once reached (no re-locking on edit unless the step becomes invalid, in which case the Create button disables and the offending step is flagged).

## Moving forward and back

Navigation is two-way once a step has been reached:

- Each active step has a footer with **Back** (left) and **Continue** (right). Back is hidden on step 1; on step 3 Continue is replaced by the Create action.
- Clicking any step number/header in the top stepper strip jumps straight to that step, as long as it has already been reached. Not-yet-reached steps stay locked and unclickable.
- Clicking a collapsed completed card's header (or its "Edit" affordance) reopens that step in place.
- Nothing is lost when moving backward — all field, source, and track state persists, so returning forward lands on the same values. Continue re-validates on the way forward, so if an edit broke a required field the user is stopped there with the reason shown.
- Keyboard: the stepper strip is a real button group with arrow-key movement between reached steps, and Continue/Back are ordinary buttons in tab order.


## Gates per step

**Step 1 — Source memory (AI-first seeding).**
Unlocked always. Passes when there is real signal: at least one ready source (selected memory chip, uploaded file, scraped URL, or voice capture) whose text extraction finished, OR a typed concept of 20+ characters. While the AI synthesis is running, Continue shows "Reading your sources…" and stays disabled — this is what makes it AI-first rather than form-first. On success the step collapses to "3 sources · concept drafted · 7 fields filled".

**Step 2 — Confirm what we found.**
Locked until step 1 passes. Passes when the required fields are non-empty: concept (20+ chars), company name, founder name, founder email (valid format), city, region, country, industry. Invalid/missing fields are highlighted inline within the step rather than only as chips in the bottom bar. Collapses to the existing summary line.

**Step 3 — Track.**
Locked until step 2 passes. Passes when a track is selected; the recommended "Most attendees" track stays visibly default.

**Create.** The sticky bar's Create button only enables when all three steps pass; before that it shows which step is blocking and clicking it opens/scrolls to that step. The "still needed" chip list moves inside step 2 where the fields actually live.

## Technical notes

Single file: `src/routes/_authenticated/dashboard/hub.new.tsx`. All state already exists — this is presentation and gating, no backend or data-model change.

- Add `const [maxStepReached, setMaxStepReached] = useState(1)` and `const [activeStep, setActiveStep] = useState(1)`.
- Derive `step1Valid` (ready sources or concept length, and `!drafting`), `step2Valid` (reuse the existing `missing[]` computation minus the `track` entry), `step3Valid` (`!!track`). Split `missing` into `missingStep2` and the track check so each gate reads its own list.
- Replace each `<section>` header with a shared step-header component that renders number, title, state (locked / active / complete), summary line, and click-to-reopen when `n <= maxStepReached`.
- Body renders only when `activeStep === n`; locked bodies render a short muted explainer instead.
- Remove the `reviewOpen`/`reviewTouched` auto-expand effect — step visibility now drives step 2's expansion. Keep `jumpTo` but have it set `activeStep = 2` first so the scroll target is mounted.
- Reset step 1 also resets `activeStep`/`maxStepReached` back to 1.
- Add a compact stepper strip at the top of the page (replacing the "3 quick steps" eyebrow) showing the three step labels with active/complete/locked states.

Same component serves both super admins (`/admin/hub/new`) and founders (`/dashboard/hub/new`), so both get the gated flow.
