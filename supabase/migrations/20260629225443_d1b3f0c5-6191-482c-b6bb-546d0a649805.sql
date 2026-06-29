ALTER TABLE public.venture_social_assets
  ADD COLUMN IF NOT EXISTS canvas_plan jsonb,
  ADD COLUMN IF NOT EXISTS qa_status text,
  ADD COLUMN IF NOT EXISTS qa_notes jsonb;