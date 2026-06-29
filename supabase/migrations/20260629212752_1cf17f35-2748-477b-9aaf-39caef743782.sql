
CREATE TABLE public.venture_social_progress (
  snapshot_id UUID PRIMARY KEY REFERENCES public.venture_snapshots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  current_step INT NOT NULL DEFAULT 1,
  goals JSONB NOT NULL DEFAULT '{}'::jsonb,
  selected_platforms TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  art_direction TEXT,
  launch_status JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.venture_social_progress TO authenticated;
GRANT ALL ON public.venture_social_progress TO service_role;

ALTER TABLE public.venture_social_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own social progress"
  ON public.venture_social_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_venture_social_progress_updated_at
  BEFORE UPDATE ON public.venture_social_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
