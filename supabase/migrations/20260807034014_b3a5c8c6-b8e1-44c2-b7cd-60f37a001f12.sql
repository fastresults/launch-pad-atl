CREATE TABLE public.venture_logo_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_id UUID NOT NULL REFERENCES public.venture_snapshots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'interviewing',
  brief JSONB NOT NULL DEFAULT '{}'::jsonb,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  inspiration JSONB NOT NULL DEFAULT '[]'::jsonb,
  approved_rough JSONB,
  vector_svg TEXT,
  vector_path TEXT,
  traced BOOLEAN NOT NULL DEFAULT false,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX venture_logo_sessions_snapshot_idx ON public.venture_logo_sessions (snapshot_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.venture_logo_sessions TO authenticated;
GRANT ALL ON public.venture_logo_sessions TO service_role;

ALTER TABLE public.venture_logo_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Founders manage their own logo sessions"
  ON public.venture_logo_sessions FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE TRIGGER update_venture_logo_sessions_updated_at
  BEFORE UPDATE ON public.venture_logo_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();