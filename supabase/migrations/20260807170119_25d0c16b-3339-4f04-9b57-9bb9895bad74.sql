ALTER TABLE public.venture_content_calendar_posts
  ADD COLUMN IF NOT EXISTS caption_variants jsonb NOT NULL DEFAULT '{}'::jsonb;