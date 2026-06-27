
-- Phase 2 hardening:
-- 1. Prevent concurrent generates of the same venture_documents row.
--    A partial unique index means two simultaneous requests for the same
--    (snapshot_id, document_type) where one is already 'generating' will
--    have the second one fail at the DB instead of double-spending AI.
CREATE UNIQUE INDEX IF NOT EXISTS venture_documents_inflight_unique
  ON public.venture_documents (snapshot_id, document_type)
  WHERE status = 'generating';

-- 2. Prevent concurrent bulk jobs for the same snapshot.
CREATE UNIQUE INDEX IF NOT EXISTS venture_generation_jobs_inflight_unique
  ON public.venture_generation_jobs (snapshot_id)
  WHERE status IN ('queued', 'running');

-- 3. RLS: let users read their own ai_pipeline_runs (workflow page needs this).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ai_pipeline_runs'
      AND policyname = 'Users read own pipeline runs'
  ) THEN
    CREATE POLICY "Users read own pipeline runs"
      ON public.ai_pipeline_runs
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- 4. Orphan sweeper: mark venture_documents stuck in 'generating' > 10 min as failed
--    so the user can retry instead of seeing a spinner forever.
CREATE OR REPLACE FUNCTION public.sweep_stuck_generations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.venture_documents
     SET status = 'failed',
         updated_at = now()
   WHERE status = 'generating'
     AND updated_at < now() - interval '10 minutes';

  UPDATE public.venture_generation_jobs
     SET status = 'failed',
         error_message = COALESCE(error_message, 'Worker timed out (no heartbeat for 10+ minutes)'),
         updated_at = now()
   WHERE status IN ('queued', 'running')
     AND COALESCE(heartbeat_at, created_at) < now() - interval '10 minutes';

  -- Roadmap / deep assessment stuck states (these run in foreground today).
  UPDATE public.venture_snapshots
     SET roadmap_status = 'failed'
   WHERE roadmap_status = 'generating'
     AND COALESCE(roadmap_generated_at, updated_at) < now() - interval '10 minutes';

  UPDATE public.venture_documents
     SET deep_assessment_status = 'failed'
   WHERE deep_assessment_status = 'generating'
     AND COALESCE(deep_assessment_generated_at, updated_at) < now() - interval '10 minutes';
END;
$$;

GRANT EXECUTE ON FUNCTION public.sweep_stuck_generations() TO service_role;
