
CREATE EXTENSION IF NOT EXISTS vector;

-- Memory chunks (embeddings)
CREATE TABLE public.founder_brain_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  kind TEXT NOT NULL,               -- 'deliverable' | 'assessment' | 'brief' | 'note' | 'brand' | 'legal' | 'brain_summary'
  source_ref TEXT,                  -- e.g. deliverable_key, note id
  title TEXT,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX founder_brain_memory_user_kind_idx ON public.founder_brain_memory (user_id, kind);
CREATE INDEX founder_brain_memory_source_idx ON public.founder_brain_memory (user_id, kind, source_ref);
CREATE INDEX founder_brain_memory_embedding_idx ON public.founder_brain_memory
  USING hnsw (embedding vector_cosine_ops);
GRANT SELECT ON public.founder_brain_memory TO authenticated;
GRANT ALL ON public.founder_brain_memory TO service_role;
ALTER TABLE public.founder_brain_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brain_memory_owner_read" ON public.founder_brain_memory FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Freeform notes
CREATE TABLE public.founder_brain_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'text', -- 'text' | 'voice' | 'chat'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX founder_brain_notes_user_idx ON public.founder_brain_notes (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.founder_brain_notes TO authenticated;
GRANT ALL ON public.founder_brain_notes TO service_role;
ALTER TABLE public.founder_brain_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brain_notes_owner_all" ON public.founder_brain_notes FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Persistent chat transcript (single evolving thread per user)
CREATE TABLE public.founder_brain_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  citations JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX founder_brain_messages_user_idx ON public.founder_brain_messages (user_id, created_at);
GRANT SELECT, INSERT, DELETE ON public.founder_brain_messages TO authenticated;
GRANT ALL ON public.founder_brain_messages TO service_role;
ALTER TABLE public.founder_brain_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brain_messages_owner_all" ON public.founder_brain_messages FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Cosine-similarity match function
CREATE OR REPLACE FUNCTION public.match_founder_brain_memory (
  _user_id UUID,
  query_embedding vector(1536),
  match_count INT DEFAULT 8
)
RETURNS TABLE (
  id UUID,
  kind TEXT,
  source_ref TEXT,
  title TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT m.id, m.kind, m.source_ref, m.title, m.content,
         1 - (m.embedding <=> query_embedding) AS similarity
    FROM public.founder_brain_memory m
   WHERE m.user_id = _user_id
     AND m.embedding IS NOT NULL
   ORDER BY m.embedding <=> query_embedding
   LIMIT match_count;
$$;
GRANT EXECUTE ON FUNCTION public.match_founder_brain_memory(UUID, vector, INT) TO authenticated, service_role;
