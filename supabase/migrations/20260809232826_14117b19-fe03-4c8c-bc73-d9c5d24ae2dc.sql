ALTER TABLE public.venture_content_progress
  ADD COLUMN IF NOT EXISTS campaign_cards jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.venture_content_ads
  ADD COLUMN IF NOT EXISTS set_qa jsonb;