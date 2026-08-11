CREATE TABLE public.venture_ops_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id uuid NOT NULL REFERENCES public.venture_snapshots(id) ON DELETE CASCADE,
  phase smallint NOT NULL DEFAULT 1,
  day smallint NOT NULL DEFAULT 1,
  task_key text NOT NULL,
  title text NOT NULL,
  why text NOT NULL DEFAULT '',
  done_when text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Operations',
  asset_keys text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'todo',
  owner_kind text NOT NULL DEFAULT 'client',
  owner_name text,
  due_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  proof_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (snapshot_id, task_key)
);

CREATE INDEX venture_ops_tasks_snapshot_idx ON public.venture_ops_tasks(snapshot_id, sort_order);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.venture_ops_tasks TO authenticated;
GRANT ALL ON public.venture_ops_tasks TO service_role;

ALTER TABLE public.venture_ops_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners manage ops tasks" ON public.venture_ops_tasks
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.venture_snapshots s WHERE s.id = snapshot_id AND (s.user_id = auth.uid() OR public.is_admin(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.venture_snapshots s WHERE s.id = snapshot_id AND (s.user_id = auth.uid() OR public.is_admin(auth.uid()))));

CREATE TABLE public.venture_ops_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.venture_ops_tasks(id) ON DELETE CASCADE,
  author_kind text NOT NULL DEFAULT 'client',
  author_name text,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX venture_ops_notes_task_idx ON public.venture_ops_notes(task_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.venture_ops_notes TO authenticated;
GRANT ALL ON public.venture_ops_notes TO service_role;

ALTER TABLE public.venture_ops_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners manage ops notes" ON public.venture_ops_notes
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.venture_ops_tasks t
    JOIN public.venture_snapshots s ON s.id = t.snapshot_id
    WHERE t.id = task_id AND (s.user_id = auth.uid() OR public.is_admin(auth.uid()))))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.venture_ops_tasks t
    JOIN public.venture_snapshots s ON s.id = t.snapshot_id
    WHERE t.id = task_id AND (s.user_id = auth.uid() OR public.is_admin(auth.uid()))));

CREATE TABLE public.venture_ops_state (
  snapshot_id uuid PRIMARY KEY REFERENCES public.venture_snapshots(id) ON DELETE CASCADE,
  runway_started_at timestamptz NOT NULL DEFAULT now(),
  client_can_edit boolean NOT NULL DEFAULT true,
  seeded_version integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.venture_ops_state TO authenticated;
GRANT ALL ON public.venture_ops_state TO service_role;

ALTER TABLE public.venture_ops_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners manage ops state" ON public.venture_ops_state
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.venture_snapshots s WHERE s.id = snapshot_id AND (s.user_id = auth.uid() OR public.is_admin(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.venture_snapshots s WHERE s.id = snapshot_id AND (s.user_id = auth.uid() OR public.is_admin(auth.uid()))));

CREATE TRIGGER venture_ops_tasks_updated_at BEFORE UPDATE ON public.venture_ops_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER venture_ops_state_updated_at BEFORE UPDATE ON public.venture_ops_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();