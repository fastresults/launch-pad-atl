ALTER TABLE public.venture_snapshots
  ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_venture_snapshots_user_status_fav
  ON public.venture_snapshots (user_id, status, is_favorite, updated_at DESC);