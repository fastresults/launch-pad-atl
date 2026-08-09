ALTER TABLE public.venture_snapshots
  ADD COLUMN IF NOT EXISTS scene_brief jsonb,
  ADD COLUMN IF NOT EXISTS scene_brief_at timestamptz;