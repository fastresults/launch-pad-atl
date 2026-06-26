
-- 1. Add bonus flag column
ALTER TABLE public.deliverable_types
  ADD COLUMN IF NOT EXISTS bonus boolean NOT NULL DEFAULT false;

-- 2. Drop the read function so we can recreate it with the new column
DROP FUNCTION IF EXISTS public.list_deliverable_types_public();

-- 3. Deactivate legacy active rows that don't map cleanly into the new framework
UPDATE public.deliverable_types
   SET active = false
 WHERE key IN (
   'concept_brief','business_plan','pricing_strategy','customer_acquisition',
   'partnership_strategy','team_structure','technology_stack','investor_memo','exit_strategy'
 );

-- 4. Relabel & remap existing keepers
UPDATE public.deliverable_types SET label='Executive Summary',         stage_n=1, stage_label='Foundation', sort_order=101, active=true, bonus=false WHERE key='executive_summary';
UPDATE public.deliverable_types SET label='Value Proposition',         stage_n=1, stage_label='Foundation', sort_order=104, active=true, bonus=false WHERE key='value_proposition';
UPDATE public.deliverable_types SET label='Market Analysis',           stage_n=2, stage_label='Strategy',   sort_order=201, active=true, bonus=false WHERE key='market_sizing';
UPDATE public.deliverable_types SET label='Competitive Positioning',   stage_n=2, stage_label='Strategy',   sort_order=203, active=true, bonus=false WHERE key='competitive_landscape';
UPDATE public.deliverable_types SET label='Go-to-Market Plan',         stage_n=2, stage_label='Strategy',   sort_order=204, active=true, bonus=false WHERE key='go_to_market';
UPDATE public.deliverable_types SET label='Product Roadmap',           stage_n=3, stage_label='Operations', sort_order=301, active=true, bonus=false WHERE key='product_roadmap';
UPDATE public.deliverable_types SET label='Operating Plan',            stage_n=3, stage_label='Operations', sort_order=302, active=true, bonus=false WHERE key='operations_plan';
UPDATE public.deliverable_types SET label='Financial Model',           stage_n=4, stage_label='Finance',    sort_order=401, active=true, bonus=false WHERE key='financial_model';
UPDATE public.deliverable_types SET label='Funding Strategy',          stage_n=4, stage_label='Finance',    sort_order=403, active=true, bonus=false WHERE key='funding_strategy';
UPDATE public.deliverable_types SET label='Risk Register',             stage_n=5, stage_label='Governance', sort_order=502, active=true, bonus=false WHERE key='risk_assessment';
UPDATE public.deliverable_types SET label='Board & Governance Plan',   stage_n=5, stage_label='Governance', sort_order=503, active=true, bonus=false WHERE key='board_presentation';

-- 5. Insert the new framework rows. New rows have no prompt yet, so
--    user_can_trigger = false (UI will render them as "Coming soon").
INSERT INTO public.deliverable_types
  (key, label, description, stage_label, stage_n, sort_order, active, bonus, user_can_trigger, auto_runnable)
VALUES
  ('vision_mission',           'Vision & Mission',         'The north-star statement that keeps every decision pointed the same direction.', 'Foundation', 1, 102, true, false, false, false),
  ('problem_solution_brief',   'Problem / Solution Brief', 'A crisp account of the painful problem you solve and exactly how your offer removes it.', 'Foundation', 1, 103, true, false, false, false),
  ('customer_personas',        'Customer Personas',        'Vivid profiles of the two or three people most likely to buy.', 'Strategy', 2, 202, true, false, false, false),
  ('brand_messaging',          'Brand & Messaging',        'The core message, tone, and proof points that make your brand feel like one voice.', 'Strategy', 2, 205, true, false, false, false),
  ('sales_playbook',           'Sales Playbook',           'A repeatable script that moves a stranger to a signed deal.', 'Operations', 3, 303, true, false, false, false),
  ('marketing_plan',           'Marketing Plan',           'Your channels, monthly spend, content cadence, and the metrics that tell you what works.', 'Operations', 3, 304, true, false, false, false),
  ('unit_economics',           'Unit Economics',           'What one customer costs to win and what they pay back over time.', 'Finance', 4, 402, true, false, false, false),
  ('budget_proforma',          'Budget & Pro Forma',       'A line-by-line budget and forecast tied to real assumptions.', 'Finance', 4, 404, true, false, false, false),
  ('pitch_deck_outline',       'Pitch Deck Outline',       'A tight slide-by-slide outline of the story that gets investors to lean in.', 'Finance', 4, 405, true, false, false, false),
  ('legal_structure_brief',    'Legal Structure Brief',    'Plain-English recommendation on entity, ownership, and the contracts you need on day one.', 'Governance', 5, 501, true, false, false, false),
  ('brand_strategy_framework', 'Brand Strategy Framework', 'Purpose, promise, audience, positioning — the strategic foundation under your brand.', 'Brand', 6, 601, true, true, false, false),
  ('brand_messaging_house',    'Brand Messaging House',    'Your headline, supporting messages, and proof — organized in one place.', 'Brand', 6, 602, true, true, false, false),
  ('visual_identity_brief',    'Visual Identity Brief',    'A clear brief for the logo, colors, type, and visual feel.', 'Brand', 6, 603, true, true, false, false),
  ('brand_voice_tone_guide',   'Brand Voice & Tone Guide', 'How your brand sounds — word choice, rhythm, what to avoid.', 'Brand', 6, 604, true, true, false, false),
  ('brand_guidelines_book',    'Brand Guidelines Book',    'Logo rules, colors, type, voice, and examples — all in one document.', 'Brand', 6, 605, true, true, false, false),
  ('website_prd',              'Website PRD (AI-builder prompt)', 'A complete PRD an AI builder can use to ship your site in a weekend.', 'Marketing', 7, 701, true, true, false, false),
  ('social_audit_setup',            'Social Media Audit & Setup',     'A clean review of current accounts plus the right handles, bios, and links.', 'Social & Content', 8, 801, true, true, false, false),
  ('content_strategy_pillars',      'Content Strategy & Pillars',     'Three to five content themes that consistently attract your buyer.',         'Social & Content', 8, 802, true, true, false, false),
  ('content_calendar_90',           '90-Day Content Calendar',        'Ninety days of post ideas, hooks, and formats mapped out.',                 'Social & Content', 8, 803, true, true, false, false),
  ('launch_content_kit',            'Launch Content Kit',             'A ready-to-publish set of announcement posts, captions, emails, and graphics.', 'Social & Content', 8, 804, true, true, false, false),
  ('community_engagement_playbook', 'Community Engagement Playbook',  'Rules and templates for replies, DMs, reviews, and customer moments.',     'Social & Content', 8, 805, true, true, false, false),
  ('influencer_partnership_brief',  'Influencer & Partnership Brief', 'A brief you can send to local influencers and partner brands.',            'Social & Content', 8, 806, true, true, false, false),
  ('paid_ads_starter_pack',         'Paid Ads Starter Pack',          'A starter set of ad targets, hooks, and budgets tuned to your offer.',     'Social & Content', 8, 807, true, true, false, false)
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  stage_label = EXCLUDED.stage_label,
  stage_n = EXCLUDED.stage_n,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active,
  bonus = EXCLUDED.bonus,
  user_can_trigger = EXCLUDED.user_can_trigger;

-- 6. Recreate the read function with the new bonus column
CREATE OR REPLACE FUNCTION public.list_deliverable_types_public()
 RETURNS TABLE(key text, label text, description text, stage_label text, stage_n integer, schema_version integer, default_model text, depends_on_keys text[], sort_order integer, tier_required text, active boolean, created_at timestamp with time zone, requires_context_keys text[], produces_context_key text, output_kind text, user_can_trigger boolean, auto_runnable boolean, bonus boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT key, label, description, stage_label, stage_n, schema_version,
         default_model, depends_on_keys, sort_order, tier_required, active,
         created_at, requires_context_keys, produces_context_key, output_kind,
         user_can_trigger, auto_runnable, bonus
    FROM public.deliverable_types
   WHERE active = true;
$function$;
