
ALTER TABLE public.venture_snapshots
  ADD COLUMN IF NOT EXISTS research_artifacts JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS research_brief JSONB;
