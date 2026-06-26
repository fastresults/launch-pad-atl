## Why the previous fix wasn't enough

`/dashboard/workflow` doesn't just render hardcoded numbers — it renders whatever `getMyWorkflow()` returns, which is driven by the `deliverable_types` table. The table currently has only **22 active rows across 5 stages** (Foundation / Strategy / Operations / Finance / Governance). That's why the page still says "20 founder-ready deliverables across 5 categories" — the data source itself is outdated.

The homepage and `/dashboard/day` show the right shape because they read `FRAMEWORK_STAGES` from `src/lib/framework-deliverables.ts` (35 items / 8 categories, including the Brand, Marketing, and Social bonus tracks). The workflow page never will until the database matches.

## Plan

### 1. Sync `deliverable_types` to the live framework (SQL migration)

Make the table the single source of truth that matches `FRAMEWORK_STAGES`:

- Renumber the 5 existing categories to `stage_n` 1–5 with labels Foundation, Strategy, Operations, Finance, Governance.
- Map existing active rows to the new framework titles where they correspond (e.g. `executive_summary`, `value_proposition`, `market_sizing → market_analysis`, `competitive_landscape → competitive_positioning`, `business_plan → brand_messaging`, etc.). Keep old keys as aliases (`active=false`) so generated docs aren't lost.
- Insert the **missing rows** so every framework deliverable exists:
  - Foundation: `problem_solution_brief`
  - Strategy: `customer_personas`
  - Operations: `sales_playbook`, `marketing_plan`
  - Finance: `unit_economics`, `budget_proforma`, `pitch_deck_outline`
  - Governance: `legal_structure_brief`, `risk_register`, `board_governance_plan`
  - **Category 6 — Brand (bonus):** `brand_strategy_framework`, `brand_messaging_house`, `visual_identity_brief`, `brand_voice_tone_guide`, `brand_guidelines_book`
  - **Category 7 — Marketing (bonus):** `website_prd`
  - **Category 8 — Social & Content (bonus):** `social_audit_setup`, `content_strategy_pillars`, `content_calendar_90`, `launch_content_kit`, `community_engagement_playbook`, `influencer_partnership_brief`, `paid_ads_starter_pack`
- For every new row: set `active=true`, `sort_order` (`stage_n * 100 + position`), `stage_label`, `description`, `user_can_trigger=true`. Mark bonus-category rows so the UI can badge them.

Grants/RLS unchanged — the table already exists.

### 2. Add a `bonus` flag column (optional but tidy)

`ALTER TABLE deliverable_types ADD COLUMN bonus boolean default false`, then mark Brand/Marketing/Social rows true. UI shows a "Bonus" badge alongside category headers.

### 3. Update `src/lib/userPipeline.functions.ts`

Return the new columns (`bonus`) so the UI can render them. No logic changes.

### 4. Update `src/lib/workflow.ts`

Rewrite `STAGES` and `WORKFLOW` to mirror the new framework (8 stages, 35 deliverables). Keep `BRIEF_FIELDS` untouched. This file is used by intake forms, so each new key gets a minimal `intake` array (or none) — defaults are safe.

### 5. Update `src/routes/_authenticated/dashboard/workflow.tsx`

- Iterate `STAGES.filter(n >= 1)` (now 1–8) so all 8 categories render.
- Render the bonus pill when `stage.bonus` is true.
- The dynamic counts already work — they'll now read 35 deliverables across 8 categories straight from the data.
- Refine the subhead to match the warmer tone used on `/dashboard/day` and explicitly call out the bonus tracks ("…including bonus Brand, Marketing, and Social tracks").

### 6. Prompt coverage for new keys (honest scope note)

The 13 net-new rows won't have `prompt_template`s yet, so trying to generate them will fail until prompts are authored. Two options:

- **(a) Ship now, prompts later** — rows appear in the UI as "Coming soon" / disabled `user_can_trigger=false` until prompts land. This fixes the cosmetics and category counts immediately.
- **(b) Author all 13 prompts in this same change** — much bigger, slower.

Recommend **(a)** so the count/category complaint is resolved this pass; prompts can be added per category in follow-ups.

### Files touched

- `supabase/migrations/<timestamp>_workflow_framework_sync.sql` (new)
- `src/lib/workflow.ts`
- `src/lib/userPipeline.functions.ts`
- `src/routes/_authenticated/dashboard/workflow.tsx`

### Verification

- Reload `/dashboard/workflow`: header shows "35 founder-ready deliverables across 8 categories"; 8 category sections render with Brand/Marketing/Social badged as bonus.
- Already-generated deliverables (e.g. `executive_summary`) still show as Generated.
- `/dashboard/day` and homepage Framework remain unchanged (still source from `FRAMEWORK_STAGES`).
