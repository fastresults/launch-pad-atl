
ALTER TABLE public.venture_snapshots
  ADD COLUMN IF NOT EXISTS snapshot_brain jsonb,
  ADD COLUMN IF NOT EXISTS snapshot_brain_updated_at timestamptz;

ALTER TABLE public.deliverable_types
  ADD COLUMN IF NOT EXISTS context_keys text[] DEFAULT '{}'::text[];

-- Seed sensible context routing for known deliverables. Keys map to slices of
-- the snapshot_brain JSON. Anything not seeded falls back to the full brain.
UPDATE public.deliverable_types SET context_keys = ARRAY['identity','customer','business_model_summary','known_numbers','market_facts','differentiators']
  WHERE key IN ('budget_pro_forma','pricing_strategy','financial_model','unit_economics');

UPDATE public.deliverable_types SET context_keys = ARRAY['identity','problem','solution','customer','differentiators','market_facts']
  WHERE key IN ('brand_strategy_framework','brand_messaging_house','brand_voice_tone_guide','visual_identity_brief','brand_guidelines_pdf');

UPDATE public.deliverable_types SET context_keys = ARRAY['identity','customer','business_model_summary','market_facts','differentiators']
  WHERE key IN ('go_to_market_plan','launch_content_kit','content_strategy_pillars','content_calendar_90day','social_media_audit_setup','community_engagement_playbook','influencer_partnership_brief','paid_ads_starter_pack','website_prd');

UPDATE public.deliverable_types SET context_keys = ARRAY['identity','business_model_summary','known_numbers']
  WHERE key IN ('legal_entity_overview','founding_documents','operating_agreement','cap_table_overview','governance_framework');
