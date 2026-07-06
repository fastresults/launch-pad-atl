ALTER TABLE public.venture_snapshots
  ADD COLUMN IF NOT EXISTS roadmap_coverage jsonb,
  ADD COLUMN IF NOT EXISTS roadmap_structure_version integer;