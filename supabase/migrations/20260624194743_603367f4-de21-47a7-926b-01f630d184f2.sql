
-- Add cancel + stall detection to venture_generation_jobs
ALTER TABLE public.venture_generation_jobs
  ADD COLUMN IF NOT EXISTS cancel_requested boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS heartbeat_at timestamptz;

-- Allow users to read failures for their own snapshots
ALTER TABLE public.venture_generation_failures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read their venture failures" ON public.venture_generation_failures;
CREATE POLICY "Users read their venture failures"
ON public.venture_generation_failures FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.venture_snapshots s
  WHERE s.id = venture_generation_failures.snapshot_id AND s.user_id = auth.uid()
));

DROP POLICY IF EXISTS "Admins read all venture failures" ON public.venture_generation_failures;
CREATE POLICY "Admins read all venture failures"
ON public.venture_generation_failures FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

GRANT SELECT ON public.venture_generation_failures TO authenticated;

-- Allow users to request cancel on their own jobs
DROP POLICY IF EXISTS "Users cancel their venture jobs" ON public.venture_generation_jobs;
CREATE POLICY "Users cancel their venture jobs"
ON public.venture_generation_jobs FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.venture_snapshots s
  WHERE s.id = venture_generation_jobs.snapshot_id AND s.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.venture_snapshots s
  WHERE s.id = venture_generation_jobs.snapshot_id AND s.user_id = auth.uid()
));
