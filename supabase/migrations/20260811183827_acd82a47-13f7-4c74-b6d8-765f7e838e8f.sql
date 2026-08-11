CREATE TABLE public.venture_ops_platform_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_id UUID NOT NULL REFERENCES public.venture_snapshots(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  audience TEXT,
  deadline TEXT,
  contact TEXT,
  requested_by TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX venture_ops_platform_requests_snapshot_idx ON public.venture_ops_platform_requests(snapshot_id);

GRANT SELECT ON public.venture_ops_platform_requests TO authenticated;
GRANT ALL ON public.venture_ops_platform_requests TO service_role;

ALTER TABLE public.venture_ops_platform_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Venture owners and admins can view platform requests"
ON public.venture_ops_platform_requests FOR SELECT TO authenticated
USING (
  public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.venture_snapshots s
    WHERE s.id = venture_ops_platform_requests.snapshot_id AND s.user_id = auth.uid()
  )
);