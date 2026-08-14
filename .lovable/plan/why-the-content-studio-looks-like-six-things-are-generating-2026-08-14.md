# Why the Content Studio looks like six things are generating at once

## What I found

Two separate problems — one is cosmetic, one is real.

### 1. One run paints every button as busy (cosmetic)

`ContentStudio.tsx` has a single global `running` boolean set by `runWeek()` and `runAll()`. Every button reads it:

- "Generate all" spinner: `running`
- Each week header: `isLoading = autoRunWeek === w || running`, so "Generate week" **and** the three "Add & generate" rows for not-started weeks all spin
- Per-tile "Generate" is disabled by `running` too

So generating a single Week 1 ad makes the whole screen look like five concurrent jobs. That is exactly the screenshot.

### 2. Duplicate real invocations (actual concurrency)

The edge logs show two `venture-content-ad` requests 200ms apart for the same venture, both for Week 1, one finishing with `{"superseded":1}` — two jobs raced for the same tile and one result was thrown away.

Cause: the auto-kick effect at line 750 runs `runWeek(autoRunWeek)` guarded only by the `running` state (which is still `false` for that render) and re-runs when `tasks.length` changes. Nothing prevents it from overlapping a manual "Generate all" click, and `doGenerate()` has no per-key in-flight guard of its own — it only *reports* busy after the call has started.

## The fix

**A. Scope the busy state to what is actually running.**
Replace the single `running` flag with a run descriptor: `{ scope: "all" | "week", week?: number }`. Then:
- "Generate all" spins only for `scope: "all"`
- A week's button spins only when that week is the running week
- Not-started weeks' "Add & generate" never spin for someone else's run — they show disabled, not busy
- Per-tile "Generate" keeps its own `runningKeys[k]` spinner; other tiles stay idle-but-disabled

Result: at most one spinner for the tile in flight, plus the one button that started the run.

**B. Make double-firing impossible.**
- Add an in-flight ref (`inFlight = useRef(new Set<string>())`) checked at the top of `doGenerate`; a second call for the same `post:aspect` returns immediately.
- Add a `runLock` ref checked synchronously at the top of `runWeek`/`runAll` (state is too late).
- Make the auto-kick effect one-shot: mark the week consumed in a ref before starting, and depend on `autoRunWeek` only — not `tasks.length`.

**C. Say what is happening, in words.**
Under the section header, show the live line: "Generating week 1 — ad 1 of 1" instead of leaving the founder to read five spinners. Idle buttons render disabled and dimmed, never spinning.

## Technical notes

- All changes are in `src/components/hub/ContentStudio.tsx` (presentation + local run state).
- No edge function, schema, or generation-logic changes. `superseded` handling on the worker stays as the last line of defence.
- Same global-flag pattern exists in the Social Studio kit runner; if you want, I can apply the same scoping there in a follow-up.
