CREATE TABLE public.venture_ops_engagements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_id UUID NOT NULL REFERENCES public.venture_snapshots(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  start_pref TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX venture_ops_engagements_snapshot_idx ON public.venture_ops_engagements(snapshot_id);

GRANT SELECT ON public.venture_ops_engagements TO authenticated;
GRANT ALL ON public.venture_ops_engagements TO service_role;

ALTER TABLE public.venture_ops_engagements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Venture owners and admins can view engagement requests"
ON public.venture_ops_engagements FOR SELECT TO authenticated
USING (
  public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.venture_snapshots s
    WHERE s.id = venture_ops_engagements.snapshot_id AND s.user_id = auth.uid()
  )
);