CREATE OR REPLACE FUNCTION public.match_founder_brain_memory(
  _user_id uuid,
  query_embedding vector,
  match_count integer DEFAULT 8,
  _snapshot_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid, kind text, source_ref text, title text, content text, similarity double precision
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT m.id, m.kind, m.source_ref, m.title, m.content,
         1 - (m.embedding <=> query_embedding) AS similarity
    FROM public.founder_brain_memory m
   WHERE m.user_id = _user_id
     AND m.embedding IS NOT NULL
     AND (
       (_snapshot_id IS NULL AND m.snapshot_id IS NULL)
       OR (_snapshot_id IS NOT NULL AND m.snapshot_id = _snapshot_id)
     )
   ORDER BY m.embedding <=> query_embedding
   LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION public.match_founder_brain_memory(uuid, vector, integer, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.purge_founder_generated_assets(
  _user_id uuid,
  _snapshot_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  del_deliv int := 0;
  del_mem int := 0;
  del_notes int := 0;
  del_msgs int := 0;
  del_jobs int := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF auth.uid() <> _user_id AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  IF _snapshot_id IS NULL THEN
    WITH d AS (DELETE FROM public.attendee_deliverables WHERE user_id = _user_id RETURNING 1)
      SELECT count(*) INTO del_deliv FROM d;
    WITH m AS (DELETE FROM public.founder_brain_memory WHERE user_id = _user_id RETURNING 1)
      SELECT count(*) INTO del_mem FROM m;
    WITH n AS (DELETE FROM public.founder_brain_notes WHERE user_id = _user_id RETURNING 1)
      SELECT count(*) INTO del_notes FROM n;
    WITH msg AS (DELETE FROM public.founder_brain_messages WHERE user_id = _user_id RETURNING 1)
      SELECT count(*) INTO del_msgs FROM msg;
    WITH j AS (DELETE FROM public.brain_indexing_jobs WHERE user_id = _user_id RETURNING 1)
      SELECT count(*) INTO del_jobs FROM j;
  ELSE
    WITH m AS (
      DELETE FROM public.founder_brain_memory
       WHERE user_id = _user_id
         AND (snapshot_id = _snapshot_id OR snapshot_id IS NULL)
       RETURNING 1
    ) SELECT count(*) INTO del_mem FROM m;
    WITH n AS (
      DELETE FROM public.founder_brain_notes
       WHERE user_id = _user_id AND snapshot_id = _snapshot_id RETURNING 1
    ) SELECT count(*) INTO del_notes FROM n;
    WITH msg AS (
      DELETE FROM public.founder_brain_messages
       WHERE user_id = _user_id AND snapshot_id = _snapshot_id RETURNING 1
    ) SELECT count(*) INTO del_msgs FROM msg;
    WITH j AS (
      DELETE FROM public.brain_indexing_jobs
       WHERE user_id = _user_id AND snapshot_id = _snapshot_id RETURNING 1
    ) SELECT count(*) INTO del_jobs FROM j;
  END IF;

  RETURN jsonb_build_object(
    'deliverables_deleted', del_deliv,
    'memory_chunks_deleted', del_mem,
    'notes_deleted', del_notes,
    'messages_deleted', del_msgs,
    'indexing_jobs_deleted', del_jobs
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.purge_founder_generated_assets(uuid, uuid) TO authenticated;