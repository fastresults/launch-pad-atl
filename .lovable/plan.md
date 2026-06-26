# Why nothing landed on Profile & Intake

Two real bugs, plus one UX gap. Your data is sitting in the brief tables — the sync just isn't moving it.

## Root causes

1. **Schema mismatch (silent miss).** `brief-sync-profile.ts` reads `founder.full_name`, `founder.headline`, `founder.background` from `attendee_founder_profile` — but that table has **no such columns**. Its real fields are `right_person_reason`, `unfair_advantage`, `linkedin_url`, `raw_text`, and an `extracted` JSONB. So every "founder-derived" candidate is `undefined` and nothing gets written for them. It also never copies your `right_person_reason` / `unfair_advantage` answers anywhere.

2. **Sync errors are swallowed.** Both `FounderBlock.tsx` and `MarketBlock.tsx` call sync as fire-and-forget with `.catch(() => {})`. If anything throws (mapping bug, network blip), you get no toast, no log, no DB write. The `attendee_profiles` row for your account still shows `updated_at = 2026-05-29` — the sync never reached the upsert this session.

3. **Mark-complete sync only fires at the very end.** The "merge into profile, set `intake_completed_at`" path only runs when you exit the **market checkpoint** into the complete screen. If you bounce to Profile mid-flow, nothing has been promoted yet beyond whatever the per-block syncs were supposed to do (and per #1/#2, they didn't).

## Fix plan

### 1. Rewrite `src/lib/brief-sync-profile.ts` mapping
- Pull founder values from the actual schema:
  - `headline` ← `founder.extracted.headline` || `firstSentence(brief.one_line_pitch)`
  - `background` ← `founder.raw_text` || `founder.extracted.summary` || `brief.origin_story`
  - `skills` ← `founder.extracted.skills` (array) when present and `profile.skills` is empty
  - `full_name` ← `founder.extracted.full_name` || `profiles.display_name`
- Append `right_person_reason` and `unfair_advantage` into `value_prop` (or a new line in `background`) so those answers actually surface on the Profile page.
- Keep merge-not-overwrite semantics (only fill empty fields).
- Improve `archetypeToStage`: "Main-street brick-and-mortar", "Service business", "Creator/Personal brand", "E-commerce/DTC" → default `idea` for pre-launch unless a "launched/revenue" archetype is chosen.
- Return `{ fieldsFilled, fieldsAttempted, skipped }` so the UI can show real feedback.

### 2. Make per-block sync reliable and visible
In `FounderBlock.tsx` and `MarketBlock.tsx`:
- Replace the fire-and-forget dynamic import with a top-level `import` and an `await` inside the save handler (still wrapped in try/catch so save success isn't blocked).
- On failure, `console.error` + `toast.error("Couldn't sync to Profile — try the Pull from my brief button.")`.
- On success with `fieldsFilled > 0`, optional small toast.

### 3. Auto-sync on the Profile page load
In `src/routes/_authenticated/dashboard/profile.tsx`:
- On first mount, if `attendee_profiles` has key fields empty (`headline`, `background`, `industry`, `problem_solved`, `value_prop`, `target_market`, `business_model`, `primary_goal`) AND brief tables have data, call `syncProfileFromBrief()` automatically and refetch.
- Keeps the existing "Pull from my brief" button for manual re-sync.

### 4. Backfill your current row
After the code fix, the next page load (or one click of "Pull from my brief") will populate your Profile from the brief data you've already entered — no DB migration needed since the sync is idempotent and merge-only.

## Files touched
- `src/lib/brief-sync-profile.ts` — mapping rewrite
- `src/components/brief/FounderBlock.tsx` — awaited sync + error surfacing
- `src/components/brief/MarketBlock.tsx` — same
- `src/routes/_authenticated/dashboard/profile.tsx` — auto-sync on mount when profile is sparse

## Out of scope
- No schema changes to `attendee_founder_profile` or `attendee_profiles`.
- No changes to the brief workflow steps or checkpoint flow.
