ALTER TABLE public.venture_ops_state
  ADD COLUMN IF NOT EXISTS delivery_mode text,
  ADD COLUMN IF NOT EXISTS delivery_mode_set_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivery_mode_set_by text,
  ADD COLUMN IF NOT EXISTS blended_rate_cents integer NOT NULL DEFAULT 7500;

ALTER TABLE public.venture_ops_tasks
  ADD COLUMN IF NOT EXISTS assignee_name text,
  ADD COLUMN IF NOT EXISTS assignee_user_id uuid,
  ADD COLUMN IF NOT EXISTS committed_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS work_product_url text,
  ADD COLUMN IF NOT EXISTS work_product_label text,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS client_review_state text NOT NULL DEFAULT 'none';

CREATE TABLE IF NOT EXISTS public.venture_ops_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id uuid NOT NULL REFERENCES public.venture_snapshots(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.venture_ops_tasks(id) ON DELETE CASCADE,
  author_kind text NOT NULL DEFAULT 'agency',
  author_name text,
  body text NOT NULL,
  visible_to_client boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.venture_ops_updates TO authenticated;
GRANT ALL ON public.venture_ops_updates TO service_role;

ALTER TABLE public.venture_ops_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and admins read venture ops updates"
ON public.venture_ops_updates FOR SELECT TO authenticated
USING (
  public.is_admin(auth.uid())
  OR (
    visible_to_client
    AND EXISTS (
      SELECT 1 FROM public.venture_snapshots s
      WHERE s.id = venture_ops_updates.snapshot_id AND s.user_id = auth.uid()
    )
  )
);

CREATE INDEX IF NOT EXISTS venture_ops_updates_snapshot_idx
  ON public.venture_ops_updates (snapshot_id, created_at DESC);

CREATE TRIGGER update_venture_ops_updates_updated_at
BEFORE UPDATE ON public.venture_ops_updates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();