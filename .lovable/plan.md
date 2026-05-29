# Dashboard UX Redesign — v2 (Workshop-Companion Edition)

## What changed in this pass

The first plan treated the dashboard as a self-service workflow tool. But this product is really a **one-day, in-person workshop** (8:00 AM – 4:30 PM ET, 7 timed stages, catered lunch, coffee reset) followed by a 90-day execution period. The dashboard's real job is to be the **workshop companion in the room** during the day, then the **execution coach** for the 90 days after.

That reframes everything. The dashboard now has **three modes** that swap automatically based on time-of-day and cohort date:

```text
Mode A — BEFORE the workshop  (pre-day)
Mode B — DURING the workshop  (the live day, 8:00–4:30)
Mode C — AFTER the workshop   (90-day execution)
```

Same routes, same data, same AI pipeline — but the **"Today" screen** reshapes itself so the user always sees what matters *right now*.

---

## Mode A — Before the workshop (pre-day)

Goal: arrive prepared without overwhelm. Today screen shows:

1. **Countdown card** — "Your workshop is in 4 days · Saturday, Dec 14 · 8:00 AM at [Venue]". Add-to-calendar, directions, what-to-bring (laptop, idea, ID for LLC filing). One primary button: **"Get directions"**.
2. **One pre-work task** at a time — the Business Brief wizard (10 questions), gated so they can't see the 25-step plan yet. Copy: *"Before the workshop, just answer 10 quick questions. Your AI assistant will use these all day."* Progress shows X/10, not a completeness score.
3. **What you'll walk out with** — a small visual of the 7 stages as a journey map (locked icons), framed as *"By 4:30 PM Saturday, you'll have all of this."* This sets expectation, not workload.

Hidden in this mode: the 25-step Plan tab is replaced with a locked card *"Unlocks at 8:30 AM Saturday — Stage 1."*

---

## Mode B — During the workshop (the live day)

This is the new heart of the product. The dashboard becomes a **live workshop runner** that mirrors the schedule.

### Today screen, live

**Top: the room clock** — a slim, sticky strip:
```text
[●NOW]  Stage 2 · Find your customer  ·  9:30–10:30 AM  ·  18 min left
```
Color shifts as the stage nears its end (last 5 minutes = amber). At lunch / coffee reset it becomes a friendly break card with a countdown to the next stage.

**Center: the current stage card** — this is the only thing they should be looking at. Contains:
- Stage name in plain English ("Find your customer") + one-sentence "what we're doing right now".
- The **intake questions for this stage's deliverables**, one at a time, voice-first. Each answered question shows ✅ and quietly fires the AI in the background.
- A live **"Your AI assistant is working on…"** strip showing which deliverables are generating right now (3 of 4 done, etc.), so they *feel* the AI working in parallel without having to manage it.
- A **"I'm stuck — raise hand"** ghost button (writes a flag to the admin review queue so an instructor in the room can walk over).

**Bottom: just-finished card** — when a deliverable completes mid-stage, it slides in: *"Your LLC filing packet is ready. Take a peek?"* One peek, then it tucks into "My Files". Never more than one shown.

### What's removed during live mode
- The full 25-step Plan accordion is hidden behind a small "See full plan" link — by default, only the current stage is on screen.
- All "Regenerate" / "Run remaining" controls — during the workshop the AI runs automatically as questions are answered. Manual control returns in Mode C.
- The Brief and Filing tabs collapse into the current stage's flow (their fields appear inline when the relevant stage asks for them).

### Stage transitions
At each scheduled boundary (e.g., 9:30 → 10:30), the screen gently transitions: a 10-second "Nice — Stage 1 complete ✅ · Stage 2 starting" celebration, then the new stage card. Auto-driven by the cohort schedule, but with a manual **"Instructor: advance stage"** override (admin-only) for cohorts that run hot or slow.

### Break screens
At 11:30 AM lunch and 2:15 PM coffee reset, the dashboard literally shows: *"Lunch — relax. Back at 12:00. While you eat, your AI is finishing your competitor research."* with a live progress bar. This is on-brand and removes the "what do I do now?" anxiety.

---

## Mode C — After the workshop (90-day execution)

Goal: keep momentum without re-introducing overwhelm. Today screen shows:

1. **"You're on day 6 of 90"** progress strip with the signed launch plan visible.
2. **This week's focus** — pulled from the 30/60/90 launch plan deliverable (Stage 7). One card, one primary action: *"This week: email your first 5 prospects. Open the script."*
3. **What changed since you left** — any deliverable the AI finished or that an admin reviewed/published while they were away.
4. The full **Plan** (25 steps) is now accessible as a checklist with friendly state pills — but it's the secondary surface, not the primary one.

---

## Information architecture (revised)

```text
Sidebar (mini, icon-first, collapsible)
├── 🏠  Today              ← morphs across Mode A / B / C
├── 📅  Workshop day       ← visible only in Mode A & B: schedule, venue, what to bring
├── 📋  My Business        ← brief + filing merged (mostly used in Mode A)
├── ✅  Plan (25 steps)    ← demoted during Mode B, primary in Mode C
├── 📁  My Files           ← documents + media + deliverables merged
└── 👤  Account
```

6 items, but **2 of them are mode-aware**: "Workshop day" disappears in Mode C; "Plan" is dimmed during Mode B.

---

## Workshop-specific patterns that make this award-winning

These are the small details that move this from "clean dashboard" to "the best workshop product anyone has used":

- **Time-aware everything.** The current stage is computed from `cohort.startISO` + the schedule blocks in `src/lib/schedule-data.ts`. No manual state machine — the clock drives the UI.
- **Voice as the default input on workshop day.** People in a room with 20 others don't want to type long answers. The existing `VoiceField` becomes the primary affordance during Mode B, with keyboard as a small toggle.
- **AI work is visible, not hidden.** A persistent, subtle "AI worklog" pill bottom-right shows the 1–2 things generating right now ("✨ Drafting your pitch deck…"). Click to expand. This is the AI-first paradigm made tangible without becoming noisy.
- **"Catch up" guardrails.** If someone falls behind during the day (didn't finish Stage 2's intake before Stage 3 starts), the new stage card opens with a soft *"Quick — 2 questions from the last stage first"* prompt. No shame, no red, just a gentle nudge.
- **Instructor handoff.** "Raise hand" creates an admin-visible flag with the attendee's current stage and last answered question — so instructors walking the room know *exactly* where to help, not just "Marcus needs you".
- **Stage-end micro-celebrations.** A small confetti burst + plain-language summary card at each stage close: *"Stage 2 done. You now know your customer and have a 25-name list. Take a breath."*
- **The "walk-out moment" at 4:30 PM.** The day closes with a **single celebratory full-screen state**: their LLC name, their offer, their signed 90-day plan, and one button *"Take me to my 90-day plan"* which transitions the dashboard into Mode C. This is the emotional payoff the whole product is designed around.

---

## Language pass (still ~9th-grade)

Reuse the v1 rewrites, plus workshop-specific:
- "Cohort" → "your workshop"
- "Stage" stays (it's used out loud in the room) but always paired with a plain-language subtitle.
- "Deliverable" → "what we made for you"
- "Pipeline run" → "your AI assistant"
- Timer states: "Wrapping up", "On break", "Up next", "We're live".

---

## Scope (frontend only, no DB/RLS/AI pipeline changes)

**New / rebuilt files:**
- `src/routes/_authenticated/dashboard.tsx` — sidebar IA + mode detection.
- `src/routes/_authenticated/dashboard.index.tsx` — mode-aware "Today".
- `src/routes/_authenticated/dashboard.brief.tsx` — one-question wizard (Mode A primary).
- `src/routes/_authenticated/dashboard.workflow.tsx` — accordion + simplified states (Mode C primary).
- New `src/routes/_authenticated/dashboard.day.tsx` — workshop day schedule & venue.
- New `src/routes/_authenticated/dashboard.files.tsx` — merged docs/media/deliverables.
- New `src/lib/workshop-mode.ts` — pure function `getWorkshopMode(now, cohort, schedule) → { mode, currentStage, secondsToNextBoundary, onBreak }`. Drives the whole UI.
- New components: `RoomClock`, `CurrentStageCard`, `AIWorklogPill`, `BreakCard`, `WalkOutMoment`, `ProgressRing`, `StageAccordion`, `RaiseHandButton`.
- Additive friendly-label fields in `src/lib/workflow.ts` and `src/lib/curriculum-data.ts`.

**Unchanged:** AI pipeline server functions, DB schema, RLS, admin views, auth, routing guards.

**Small backend addition (optional, can be deferred):**
- A `raise_hand` table + tiny insert function for the in-room help signal. If you'd rather ship UI-only first, this becomes a Phase 2.

---

## Three quick questions before I build

1. Confirm the **6-item, mode-aware sidebar** above — or do you want "Workshop day" to also stay visible in Mode C as an archive?
2. **"Raise hand" instructor signal** — ship in v1 (needs one tiny table + admin queue surface), or defer to Phase 2 and ship UI-only first?
3. **Mode B stage advance** — strictly clock-driven from the cohort schedule, or also expose an instructor "advance stage" override on day one (recommended for live teaching)?

Answer those and I'll implement in one focused pass.
