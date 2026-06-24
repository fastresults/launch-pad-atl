-- Concept extras (Epiphany engine state + brand tokens cache)
ALTER TABLE public.venture_snapshots
  ADD COLUMN IF NOT EXISTS epiphany_runs jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS saved_enhancements jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS brand_tokens jsonb;

-- Catalog rows (idempotent)
INSERT INTO public.venture_document_types (type, name, description, category, sort_order, dependencies, estimated_minutes, icon, free_tier) VALUES
  ('brand_strategy_framework',     'Brand Strategy Framework',     'Purpose, vision, mission, values, brand promise, positioning (Geoffrey Moore), pillars, Jung archetype, essence.', 'Brand', 21, '{value_proposition,competitive_positioning}', 6, 'Compass', true),
  ('brand_messaging_house',        'Brand Messaging House',        'Tagline + variants, elevator pitches (15/30/60s), StoryBrand 7-part narrative, proof points, banned phrases.',     'Brand', 22, '{brand_strategy_framework}',                  5, 'MessageSquare', false),
  ('visual_identity_brief',        'Visual Identity Brief',        'Logo direction, color system (with AA contrast), typography, iconography, photography style, brand-tokens JSON.', 'Brand', 23, '{brand_strategy_framework}',                  6, 'Palette', false),
  ('brand_voice_tone_guide',       'Brand Voice & Tone Guide',     'Voice attributes, contextual tone shifts, reading level, before/after rewrites, inclusive-language rules.',        'Brand', 24, '{brand_messaging_house}',                     4, 'Mic', false),
  ('brand_guidelines_pdf',         'Brand Guidelines Book',        'Consolidated brand book combining identity, voice, do/don''ts, asset usage, and approval governance.',             'Brand', 25, '{visual_identity_brief,brand_voice_tone_guide}', 6, 'BookOpen', false),

  ('social_media_audit_setup',     'Social Media Audit & Setup',   'Platform fit matrix (Yes/Maybe/Skip), profile templates, handles, bios, hashtag seeds, accounts to follow.',      'Social & Content', 26, '{brand_voice_tone_guide,customer_personas}',  5, 'Share2', true),
  ('content_strategy_pillars',     'Content Strategy & Pillars',   '4-6 content pillars with JTBD, mix %, formats, POV statements, content-to-funnel map.',                            'Social & Content', 27, '{social_media_audit_setup,value_proposition}',5, 'Layers', true),
  ('content_calendar_90day',       '90-Day Content Calendar',      'Weeks 1-4 fully drafted posts, weeks 5-12 outlined briefs, repurposing matrix.',                                   'Social & Content', 28, '{content_strategy_pillars}',                  8, 'Calendar', false),
  ('launch_content_kit',           'Launch Content Kit',           '10 ready-to-paste launch posts + 5 email/DM templates + press one-pager.',                                         'Social & Content', 29, '{content_calendar_90day,brand_messaging_house}', 6, 'Rocket', false),
  ('community_engagement_playbook','Community Engagement Playbook','Reply scripts, comment formulas, DM funnel, UGC scripts, crisis tree, daily ritual, KPI dashboard.',              'Social & Content', 30, '{social_media_audit_setup,brand_voice_tone_guide}', 5, 'Users', false),
  ('influencer_partnership_brief', 'Influencer & Partnership Brief','Tiered creator targets (nano/micro/mid), 25 named candidates, outreach scripts, terms template.',                  'Social & Content', 31, '{content_strategy_pillars,customer_personas}',5, 'Handshake', false),
  ('paid_ads_starter_pack',        'Paid Ads Starter Pack',        'Budget tiers ($300/$1k/$3k), 3 ad creatives per platform, audiences, tracking, test framework.',                  'Social & Content', 32, '{content_strategy_pillars,customer_personas}',5, 'Target', false)
ON CONFLICT (type) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      category = EXCLUDED.category,
      sort_order = EXCLUDED.sort_order,
      dependencies = EXCLUDED.dependencies,
      estimated_minutes = EXCLUDED.estimated_minutes,
      icon = EXCLUDED.icon,
      free_tier = EXCLUDED.free_tier;