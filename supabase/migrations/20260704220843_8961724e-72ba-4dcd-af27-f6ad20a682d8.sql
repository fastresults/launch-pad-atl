CREATE TABLE public.venture_tool_stack_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id uuid NOT NULL REFERENCES public.venture_snapshots(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_key text NOT NULL,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','signed_up','configured','live')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (snapshot_id, tool_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.venture_tool_stack_status TO authenticated;
GRANT ALL ON public.venture_tool_stack_status TO service_role;

ALTER TABLE public.venture_tool_stack_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read their tool stack status"
  ON public.venture_tool_stack_status FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can insert their tool stack status"
  ON public.venture_tool_stack_status FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update their tool stack status"
  ON public.venture_tool_stack_status FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can delete their tool stack status"
  ON public.venture_tool_stack_status FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_venture_tool_stack_status_updated_at
  BEFORE UPDATE ON public.venture_tool_stack_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_venture_tool_stack_status_snapshot ON public.venture_tool_stack_status(snapshot_id);
