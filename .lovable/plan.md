## Goal
When a founder finishes (or meaningfully advances) the dashboard Startup Brief, automatically populate the Profile & Intake page (`/dashboard/profile`) so they don't have to retype anything. Mark intake complete when the brief is complete.

## Source → Target mapping

Source tables already filled by the brief workflow:
- `attendee_business_brief` (10 Q&A fields)
- `attendee_founder_profile` (Block 4 "About you" — full_name, background, headline, unfair_advantage, right_person_reason, linkedin_url)
- `attendee_market_profile` (Block 5 "Market & model" — archetype, geography, industry, customer_type, channels, market_note)

Target: `attendee_profiles` (the row the Profile page reads/writes).

Deterministic mapping (no AI required):

| attendee_profiles field | Source |
|---|---|
| full_name | founder_profile.full_name → fallback profiles.display_name |
| headline | founder_profile.headline → fallback first sentence of brief.one_line_pitch |
| background | founder_profile.background → fallback brief.origin_story |
| primary_goal | brief.twelve_month_vision |
| business_name | extracted from brief.one_line_pitch / offer_description (best-effort; left blank if unclear) |
| industry | market_profile.industry |
| stage | market_profile.archetype mapped to "idea / mvp / launched" (default "idea") |
| problem_solved | brief.problem_statement |
| value_prop | brief.unique_insight + brief.offer_description condensed |
| target_market | brief.target_customer + market_profile.geography + customer_type |
| business_model | brief.business_model |
| competitors | left as-is (not collected in brief) |
| current_revenue / funding_raised / monthly_burn / runway_months | left untouched (financial block, not in brief) |
| intake_completed_at | set when the brief reaches 10/10 |

Existing non-empty values in `attendee_profiles` are preserved (never overwrite founder-edited fields). Empty/null fields are filled.

## Implementation

1. **New client lib `src/lib/brief-sync-profile.ts`**
   - `syncProfileFromBrief()`: reads the three source tables, computes the mapping above, and calls `upsertMyProfile` only with non-empty target fields that are currently empty on the profile row (merge-not-overwrite). Returns `{ fieldsFilled: number }`.

2. **Auto-trigger points**
   - `src/routes/_authenticated/dashboard/brief.tsx`: when `setMode("complete")` fires (line 158), call `syncProfileFromBrief()` and pass `intake_completed_at = now()`.
   - `src/components/brief/FounderBlock.tsx` and `MarketBlock.tsx`: after their save, fire-and-forget `syncProfileFromBrief()` so the profile fills incrementally.
   - Toast on success: "Profile updated from your brief — X fields filled."

3. **Manual trigger on Profile page** (`src/routes/_authenticated/dashboard/profile.tsx`)
   - Add a header button "Pull from my brief" that calls `syncProfileFromBrief()` and refetches the profile query. Shows a small note: "Empty fields only — your edits are never overwritten."

4. **No DB migration needed.** All target columns already exist on `attendee_profiles`.

## Why no edge function / no AI
The mapping is 1:1 string copy from data the user already typed in their own words. Using an LLM would add latency, cost, and the risk of rewording the founder's voice. If polish is needed later (e.g., generating a `headline` when none exists), we can add an opt-in "Polish with AI" button on the profile page in a follow-up.

## Acceptance
- Finishing the brief navigates to the completion screen AND silently fills the Profile page.
- Visiting `/dashboard/profile` right after shows full_name, headline, background, primary_goal, industry, stage, problem_solved, value_prop, target_market, business_model populated where source data existed.
- Re-running the sync never clobbers a value the user has manually edited on the Profile page.
- "Pull from my brief" button works idempotently.
