
CREATE TABLE public.brain_indexing_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','done','failed')),
  total_sources INT NOT NULL DEFAULT 0,
  total_chunks INT NOT NULL DEFAULT 0,
  embedded_chunks INT NOT NULL DEFAULT 0,
  failed_chunks INT NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX brain_indexing_jobs_user_idx ON public.brain_indexing_jobs (user_id, created_at DESC);
GRANT SELECT ON public.brain_indexing_jobs TO authenticated;
GRANT ALL ON public.brain_indexing_jobs TO service_role;
ALTER TABLE public.brain_indexing_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brain_jobs_owner_read" ON public.brain_indexing_jobs FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE TRIGGER brain_indexing_jobs_touch
  BEFORE UPDATE ON public.brain_indexing_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
