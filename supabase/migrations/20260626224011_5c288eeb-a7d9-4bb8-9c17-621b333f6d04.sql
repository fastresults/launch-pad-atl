
ALTER TABLE public.venture_document_types
  ADD COLUMN IF NOT EXISTS context_keys text[],
  ADD COLUMN IF NOT EXISTS model_tier text NOT NULL DEFAULT 'flash';

-- Heavy / strategic / numerical docs → Pro tier (deeper reasoning)
UPDATE public.venture_document_types
   SET model_tier = 'pro'
 WHERE type IN (
   'executive_summary',
   'market_analysis',
   'competitive_positioning',
   'go_to_market_plan',
   'financial_model',
   'unit_economics',
   'funding_strategy',
   'budget_pro_forma',
   'pitch_deck_outline',
   'business_plan',
   'brand_strategy_framework',
   'board_governance_plan',
   'risk_register'
 );

-- Per-deliverable brain slices (only keys it actually needs).
UPDATE public.venture_document_types SET context_keys =
  CASE type
    WHEN 'executive_summary'        THEN ARRAY['identity','problem','solution','customer','business_model_summary','market_facts','differentiators','known_numbers']
    WHEN 'vision_mission'           THEN ARRAY['identity','problem','solution','differentiators']
    WHEN 'problem_solution'         THEN ARRAY['identity','problem','solution','customer','market_facts']
    WHEN 'value_proposition'        THEN ARRAY['identity','customer','solution','differentiators']
    WHEN 'market_analysis'          THEN ARRAY['identity','customer','market_facts','business_model_summary']
    WHEN 'customer_personas'        THEN ARRAY['identity','customer','problem','solution']
    WHEN 'competitive_positioning'  THEN ARRAY['identity','solution','differentiators','market_facts']
    WHEN 'go_to_market_plan'        THEN ARRAY['identity','customer','business_model_summary','differentiators','known_numbers']
    WHEN 'brand_messaging'          THEN ARRAY['identity','customer','differentiators','solution']
    WHEN 'product_roadmap'          THEN ARRAY['identity','solution','customer','differentiators']
    WHEN 'operating_plan'           THEN ARRAY['identity','business_model_summary','known_numbers']
    WHEN 'sales_playbook'           THEN ARRAY['identity','customer','business_model_summary','differentiators','known_numbers']
    WHEN 'marketing_plan'           THEN ARRAY['identity','customer','differentiators','known_numbers']
    WHEN 'website_prd'              THEN ARRAY['identity','solution','customer','differentiators']
    WHEN 'financial_model'          THEN ARRAY['identity','business_model_summary','known_numbers','market_facts']
    WHEN 'unit_economics'           THEN ARRAY['identity','business_model_summary','known_numbers']
    WHEN 'funding_strategy'         THEN ARRAY['identity','business_model_summary','known_numbers','market_facts']
    WHEN 'budget_pro_forma'         THEN ARRAY['identity','business_model_summary','known_numbers']
    WHEN 'pitch_deck_outline'       THEN ARRAY['identity','problem','solution','customer','business_model_summary','market_facts','differentiators','known_numbers']
    WHEN 'legal_structure_brief'    THEN ARRAY['identity','business_model_summary']
    WHEN 'risk_register'            THEN ARRAY['identity','business_model_summary','market_facts','known_numbers']
    WHEN 'board_governance_plan'    THEN ARRAY['identity','business_model_summary','known_numbers']
    WHEN 'brand_strategy_framework' THEN ARRAY['identity','customer','differentiators','solution']
    WHEN 'brand_messaging_house'    THEN ARRAY['identity','customer','differentiators']
    WHEN 'visual_identity_brief'    THEN ARRAY['identity','differentiators']
    WHEN 'brand_voice_tone_guide'   THEN ARRAY['identity','customer','differentiators']
    WHEN 'brand_guidelines_pdf'     THEN ARRAY['identity','differentiators']
    WHEN 'social_media_audit_setup' THEN ARRAY['identity','customer','differentiators']
    WHEN 'content_strategy_pillars' THEN ARRAY['identity','customer','differentiators','solution']
    WHEN 'content_calendar_90day'   THEN ARRAY['identity','customer','differentiators']
    WHEN 'launch_content_kit'       THEN ARRAY['identity','customer','differentiators','solution']
    WHEN 'community_engagement_playbook' THEN ARRAY['identity','customer','differentiators']
    WHEN 'influencer_partnership_brief'  THEN ARRAY['identity','customer','differentiators']
    WHEN 'paid_ads_starter_pack'    THEN ARRAY['identity','customer','differentiators','known_numbers']
    ELSE context_keys
  END
WHERE context_keys IS NULL;
