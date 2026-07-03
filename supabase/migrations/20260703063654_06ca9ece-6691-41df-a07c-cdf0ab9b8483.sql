
-- 1) RPC: allow a user (or admin) to purge their generated startup assets +
--    Second Brain memory. Use when the founder switched ventures and old
--    generated content is polluting the brain.
CREATE OR REPLACE FUNCTION public.purge_founder_generated_assets(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  del_deliv int := 0;
  del_mem int := 0;
  del_jobs int := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF auth.uid() <> _user_id AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  WITH d AS (DELETE FROM public.attendee_deliverables WHERE user_id = _user_id RETURNING 1)
  SELECT count(*) INTO del_deliv FROM d;

  WITH m AS (DELETE FROM public.founder_brain_memory WHERE user_id = _user_id RETURNING 1)
  SELECT count(*) INTO del_mem FROM m;

  WITH j AS (DELETE FROM public.brain_indexing_jobs WHERE user_id = _user_id RETURNING 1)
  SELECT count(*) INTO del_jobs FROM j;

  RETURN jsonb_build_object(
    'deliverables_deleted', del_deliv,
    'memory_chunks_deleted', del_mem,
    'indexing_jobs_deleted', del_jobs
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.purge_founder_generated_assets(uuid) TO authenticated;

-- 2) One-off cleanup for the affected account (StartupLabs user whose brain
--    was polluted by prior "Fancy's Foods" venture deliverables).
DELETE FROM public.founder_brain_memory
 WHERE user_id = '67d1c583-c10a-43d2-96e6-16ff62d4a329';

DELETE FROM public.attendee_deliverables
 WHERE user_id = '67d1c583-c10a-43d2-96e6-16ff62d4a329';

DELETE FROM public.brain_indexing_jobs
 WHERE user_id = '67d1c583-c10a-43d2-96e6-16ff62d4a329';
