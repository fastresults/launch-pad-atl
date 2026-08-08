ALTER TABLE public.venture_snapshots
  ADD COLUMN IF NOT EXISTS venture_timeline jsonb,
  ADD COLUMN IF NOT EXISTS venture_timeline_scenario jsonb,
  ADD COLUMN IF NOT EXISTS venture_timeline_at timestamptz;