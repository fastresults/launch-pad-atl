UPDATE public.deliverable_types
SET depends_on_keys = ARRAY['value_proposition','customer_personas','brand_messaging_house','brand_voice_tone_guide','visual_identity_brief','go_to_market']
WHERE key = 'website_prd';