CREATE TABLE public.attendee_founder_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL,
  source_key text NOT NULL,
  block_n integer,
  field_keys text[] NOT NULL DEFAULT '{}',
  qa jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary text,
  bullets text[] NOT NULL DEFAULT '{}',
  model text,
  content_hash text NOT NULL,
  superseded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_founder_memory_current ON public.attendee_founder_memory (user_id, source, source_key) WHERE superseded_at IS NULL;
CREATE INDEX idx_founder_memory_recent ON public.attendee_founder_memory (user_id, source, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.attendee_founder_memory TO authenticated;
GRANT ALL ON public.attendee_founder_memory TO service_role;

ALTER TABLE public.attendee_founder_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own founder memory"
  ON public.attendee_founder_memory FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR is_admin(auth.uid()));

CREATE POLICY "Users insert own founder memory"
  ON public.attendee_founder_memory FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own founder memory"
  ON public.attendee_founder_memory FOR UPDATE TO authenticated
  USING ((auth.uid() = user_id) OR is_admin(auth.uid()));

CREATE TRIGGER update_attendee_founder_memory_updated_at
  BEFORE UPDATE ON public.attendee_founder_memory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();