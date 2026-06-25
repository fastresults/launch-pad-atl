ALTER TABLE public.venture_snapshots
  ADD COLUMN IF NOT EXISTS track text
  CHECK (track IS NULL OR track IN (
    'lifestyle','small_business','scalable_tech','marketplace',
    'deep_tech','social_impact','corporate'
  ));