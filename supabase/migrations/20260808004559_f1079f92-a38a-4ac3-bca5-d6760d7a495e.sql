ALTER TABLE public.venture_snapshots
  ADD COLUMN IF NOT EXISTS executive_summary text,
  ADD COLUMN IF NOT EXISTS executive_summary_at timestamptz;

ALTER TABLE public.venture_shares
  ADD COLUMN IF NOT EXISTS map_enabled boolean NOT NULL DEFAULT true;