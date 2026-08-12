CREATE TABLE public.venture_generation_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_id uuid NOT NULL REFERENCES public.venture_snapshots(id) ON DELETE CASCADE,
  job_id uuid,
  document_type text NOT NULL,
  phase text,
  mode text,
  model text,
  attempt integer NOT NULL DEFAULT 1,
  duration_ms integer,
  outcome text NOT NULL,
  error_class text,
  error text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.venture_generation_events TO authenticated;
GRANT ALL ON public.venture_generation_events TO service_role;

ALTER TABLE public.venture_generation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read their generation events"
ON public.venture_generation_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.venture_snapshots s
    WHERE s.id = venture_generation_events.snapshot_id
      AND s.user_id = auth.uid()
  )
  OR public.is_admin(auth.uid())
);

CREATE INDEX venture_generation_events_snapshot_idx
  ON public.venture_generation_events (snapshot_id, created_at DESC);
CREATE INDEX venture_generation_events_type_idx
  ON public.venture_generation_events (document_type, created_at DESC);

CREATE OR REPLACE FUNCTION public.sweep_stuck_generations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- venture_documents and venture_generation_jobs are deliberately NOT touched
  -- here. The checkpoint-aware venture-job-watchdog owns generation state: it
  -- republishes saved drafts instead of destroying them, and resumes runs.

  UPDATE public.venture_snapshots
     SET roadmap_status = 'failed'
   WHERE roadmap_status = 'generating'
     AND COALESCE(roadmap_generated_at, updated_at) < now() - interval '10 minutes';

  UPDATE public.venture_documents
     SET deep_assessment_status = 'failed'
   WHERE deep_assessment_status = 'generating'
     AND COALESCE(deep_assessment_generated_at, updated_at) < now() - interval '15 minutes';

  UPDATE public.ai_pipeline_runs
     SET status = 'failed', updated_at = now()
   WHERE status IN ('queued', 'running')
     AND updated_at < now() - interval '15 minutes';

  UPDATE public.ai_pipeline_steps
     SET status = 'failed', updated_at = now()
   WHERE status IN ('queued', 'running')
     AND updated_at < now() - interval '15 minutes';
END;
$$;