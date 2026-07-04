## Ship 12 AI-first launch-tooling assets + AI Stack panel

The strategy and doc coverage is strong. What's missing to actually generate money in 14 days is the **installable tech stack** — CRM, calendar, email tool, ads creative, automations, support bot, referral system, and the named AI toolkit that binds them together. This pass adds 12 new deliverables and a live "AI Stack" setup panel on the Hub.

## 12 new deliverables (all AI-first, all with `## Paste-Ready` fenced artifacts)

Each follows the same pattern as the last pass: specialized prompt, targeted `context_keys`, `model_tier`, and one paste-ready block a founder can drop into the named tool.

| # | Key | Category | Tier | Day | What ships (paste-ready) |
|---|---|---|---|---|---|
| 1 | `ai_tool_stack_recommendation` | Foundation | pro | 1 | Table of named tools per job (AI writer, site builder, CRM, calendar, email, analytics, support bot, automations, ads, reviews), signup URL, free-tier notes, and *why this vs alternatives* — plus a JSON setup checklist keyed by tool for the AI Stack panel. |
| 2 | `ai_prompt_library` | Foundation | flash | 2 | 25 copy-paste prompts tuned to the venture (cold email v1, ad hook v1, weekly recap, competitor scan, invoice draft, refund reply, launch tweet, etc.), each with variable slots. Fenced as `.md`. |
| 3 | `crm_pipeline_starter` | Strategy | flash | 3 | Attio/Folk/HubSpot Free schema (stages, custom fields, tags), CSV import derived from the First-50 list, 3 saved views. Two fenced blocks: JSON schema + CSV. |
| 4 | `booking_calendar_setup` | Operations | flash | 6 | Cal.com/Calendly event types tuned to the sales playbook (Discovery 20m, Working 45m, Onboarding 30m), routing rules, confirmation copy, reminder cadence. JSON export block + email copy block. |
| 5 | `sales_call_recording_stack` | Operations | flash | 6 | Fathom/Grain/Fireflies setup, AI post-call summary template, tagging convention, "insight → content" pipeline that feeds the calendar. |
| 6 | `email_marketing_setup` | Marketing | pro | 10 | Resend/Loops/Beehiiv sender domain setup (SPF/DKIM/DMARC), list architecture, 5-email welcome sequence, first broadcast, deliverability warm-up plan. |
| 7 | `logo_brand_asset_pack` | Brand | flash | 11 | AI-generation prompt bundle for logo (3 directions), favicon, OG image, avatar, email banner — plus a size/format spec sheet. |
| 8 | `ai_support_bot_setup` | Operations | flash | 12 | Deploy an AI FAQ/support bot (Chatbase/Intercom Fin) trained on this venture's own docs; escalation to human support inbox. Fenced: source-docs list + system prompt + widget snippet. |
| 9 | `automation_recipes_starter` | Operations | flash | 12 | 5 n8n/Zapier/Make recipes: new lead → CRM + Slack, new Stripe sale → welcome + review ask, form submit → Cal booking, weekly KPI digest, review captured → wall-of-love. Fenced JSON workflow exports. |
| 10 | `founder_operating_cadence` | Foundation | flash | 13 | Weekly rhythm — Monday plan, daily 10-min AI recap standup, Friday retro, KPI dashboard with metrics named and their sources. Notion/Linear-friendly template + KPI JSON. |
| 11 | `ad_creative_pack` | Social & Content | pro | 14 | 12 ready-to-run ad units: 4 static image prompts, 4 short-form video scripts, 4 headline+body pairs, mapped to Meta/Google/TikTok/LinkedIn and to a specific offer. |
| 12 | `referral_affiliate_starter` | Social & Content | flash | 14 | Rewardful/Tolt (or manual) setup, referral offer + terms, invite email, tracking link convention, first-10-advocates list template. |

`context_keys` per type reuse the existing eight brain keys (`identity`, `problem`, `solution`, `customer`, `business_model_summary`, `market_facts`, `differentiators`, `known_numbers`). Dependencies are set so, e.g., `crm_pipeline_starter` depends on `first_50_warm_list`, `booking_calendar_setup` depends on `sales_playbook`, `ai_support_bot_setup` depends on `customer_support_starter`, `ad_creative_pack` depends on `pricing_offer_sheet` + `brand_messaging`.

Kit total goes from 50 → **62 assets**.

## 14-day plan rebalancing

`src/lib/launch-14day-plan.ts` updated so each day owns ≤ 4 assets:

- Day 1 adds `ai_tool_stack_recommendation`
- Day 2 adds `ai_prompt_library`
- Day 3 adds `crm_pipeline_starter`
- Day 6 adds `booking_calendar_setup` + `sales_call_recording_stack`
- Day 10 adds `email_marketing_setup`
- Day 11 adds `logo_brand_asset_pack`
- Day 12 adds `ai_support_bot_setup` + `automation_recipes_starter`
- Day 13 adds `founder_operating_cadence`
- Day 14 adds `ad_creative_pack` + `referral_affiliate_starter`

## New surface: AI Stack panel

`src/components/hub/AIStackPanel.tsx`, mounted right under `LaunchPlanner14Day`. Reads the JSON checklist emitted by `ai_tool_stack_recommendation` and renders each tool as a row:

- Tool name + one-line role + category dot
- **Signup**, **Configured**, **Live** three-step progress chip (click to advance)
- "Open setup guide" link that scrolls to the related asset in the doc list (uses the existing `doc-{key}` anchors)
- Empty state when the recommendation isn't generated yet, with a one-click Generate CTA

State persists in a new table: `venture_tool_stack_status` (columns: `snapshot_id`, `tool_key`, `status enum(not_started, signed_up, configured, live)`, `updated_at`, `notes`). RLS scoped to `auth.uid() = user_id` via join through `venture_snapshots`. Standard GRANT block. Small edge function `venture-tool-stack-status` for upsert (or direct RLS-scoped supabase-js call from the client — I'll go with direct client to keep it simple).

## Chatbot routing

Add a "Launch Tech Stack" section to `src/lib/chatbot-knowledge.ts` and `supabase/functions/venture-chatbot/knowledge.ts` so concierge questions like "which CRM should I use?", "how do I set up Cal.com?", "which ad creative goes on Meta?" route to the right new asset.

## Files touched

**New**
- `src/components/hub/AIStackPanel.tsx`
- SQL migration: `venture_tool_stack_status` table + policies + grants

**Edited**
- `supabase/functions/_shared/deliverable-prompts.ts` — 12 specialized prompts appended
- `src/lib/launch-14day-plan.ts` — day mappings rebalanced
- `src/lib/framework-deliverables.ts` — 12 tiles added to matching stages (Foundation, Strategy, Operations, Brand, Marketing, Social & Content) so the homepage framework and Hub category list stay in sync
- `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx` — mount `<AIStackPanel />` under the 14-day planner
- `src/lib/chatbot-knowledge.ts` + `supabase/functions/venture-chatbot/knowledge.ts` — Launch Tech Stack section
- Database seed via `supabase--insert`: 12 rows into `venture_document_types` with category, sort_order, tier, model_tier, context_keys, depends_on, description, tooltip

## Out of scope

- No changes to the base model gateway, brain schema, existing 50 prompts, or the roadmap generator.
- No integrations with the actual third-party APIs (Chargebee, Cal.com, Chatbase, etc.) — the value in a 14-day sprint is the *setup runbook + paste-ready config*, not real-time API bridges. That's a separate future pass if any user asks.
- No pricing/entitlement changes; new assets follow existing tier logic.

## Verification

- `bunx tsgo` on edited TS files.
- Spot-generate `ai_tool_stack_recommendation`, `crm_pipeline_starter`, `ad_creative_pack`, and `automation_recipes_starter` against a live venture; each returns a paste-ready fenced artifact + `QUALITY_SCORE ≥ 70`.
- Hub renders 62/62 in progress ring, 14-day planner shows every new asset under its day, AI Stack panel loads from the JSON checklist and persists status changes across reload.