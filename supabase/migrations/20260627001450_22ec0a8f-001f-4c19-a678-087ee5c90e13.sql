CREATE OR REPLACE FUNCTION public.sweep_stuck_generations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.venture_documents
     SET status = 'failed', updated_at = now()
   WHERE status = 'generating'
     AND updated_at < now() - interval '10 minutes';

  UPDATE public.venture_generation_jobs
     SET status = 'failed',
         error_message = COALESCE(error_message, 'Worker timed out (no heartbeat for 10+ minutes)'),
         updated_at = now()
   WHERE status IN ('queued', 'running')
     AND COALESCE(heartbeat_at, created_at) < now() - interval '10 minutes';

  UPDATE public.venture_snapshots
     SET roadmap_status = 'failed'
   WHERE roadmap_status = 'generating'
     AND COALESCE(roadmap_generated_at, updated_at) < now() - interval '10 minutes';

  UPDATE public.venture_documents
     SET deep_assessment_status = 'failed'
   WHERE deep_assessment_status = 'generating'
     AND COALESCE(deep_assessment_generated_at, updated_at) < now() - interval '10 minutes';

  -- F6: ai_pipeline_runs were left out of the original sweeper. Queued or
  -- running rows older than 15 minutes with no recent step heartbeat are
  -- marked failed so the workflow page stops spinning.
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