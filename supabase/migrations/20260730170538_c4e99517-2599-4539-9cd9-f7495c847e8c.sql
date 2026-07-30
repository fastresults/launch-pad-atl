CREATE TABLE public.brain_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_id UUID REFERENCES public.venture_snapshots(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled material',
  source_type TEXT NOT NULL DEFAULT 'file',
  mime_type TEXT,
  byte_size BIGINT,
  storage_bucket TEXT,
  storage_path TEXT,
  source_url TEXT,
  extracted_text TEXT,
  summary TEXT,
  key_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  doc_kind TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  chunk_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brain_materials TO authenticated;
GRANT ALL ON public.brain_materials TO service_role;

ALTER TABLE public.brain_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own brain materials"
ON public.brain_materials FOR ALL TO authenticated
USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE INDEX brain_materials_user_snapshot_idx ON public.brain_materials (user_id, snapshot_id, created_at DESC);

CREATE TRIGGER brain_materials_set_updated_at
BEFORE UPDATE ON public.brain_materials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();