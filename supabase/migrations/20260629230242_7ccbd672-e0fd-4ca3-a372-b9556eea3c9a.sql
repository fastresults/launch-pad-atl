ALTER TABLE public.venture_social_assets
  ADD COLUMN IF NOT EXISTS last_feedback text,
  ADD COLUMN IF NOT EXISTS last_regenerated_at timestamptz;