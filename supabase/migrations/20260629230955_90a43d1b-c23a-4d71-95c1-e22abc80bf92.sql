
CREATE TABLE public.venture_style_previews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id uuid NOT NULL,
  user_id uuid NOT NULL,
  direction text NOT NULL CHECK (direction IN ('editorial','photographic','geometric','illustrative')),
  storage_path text NOT NULL,
  signed_url text,
  signed_url_expires_at timestamptz,
  canvas_plan jsonb,
  qa_status text,
  qa_notes jsonb,
  prompt_used text,
  model_used text,
  last_feedback text,
  brand_kit_locked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (snapshot_id, direction)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.venture_style_previews TO authenticated;
GRANT ALL ON public.venture_style_previews TO service_role;

ALTER TABLE public.venture_style_previews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own style previews"
  ON public.venture_style_previews FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_venture_style_previews_updated_at
  BEFORE UPDATE ON public.venture_style_previews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_venture_style_previews_snapshot ON public.venture_style_previews(snapshot_id);
