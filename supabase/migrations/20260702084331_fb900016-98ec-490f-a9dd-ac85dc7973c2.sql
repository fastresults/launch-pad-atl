
-- ============================================================
-- venture_content_calendar_posts
-- ============================================================
CREATE TABLE public.venture_content_calendar_posts (
  id TEXT PRIMARY KEY,
  snapshot_id UUID NOT NULL REFERENCES public.venture_snapshots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  week INT NOT NULL,
  day TEXT,
  platform TEXT,
  pillar TEXT,
  format TEXT,
  hook TEXT,
  body TEXT,
  cta TEXT,
  hashtags TEXT[] DEFAULT '{}',
  asset_notes TEXT,
  best_time TEXT,
  source_doc_id UUID,
  parsed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_vcc_posts_snapshot ON public.venture_content_calendar_posts(snapshot_id, week);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.venture_content_calendar_posts TO authenticated;
GRANT ALL ON public.venture_content_calendar_posts TO service_role;

ALTER TABLE public.venture_content_calendar_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their calendar posts"
  ON public.venture_content_calendar_posts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_vcc_posts_updated_at BEFORE UPDATE ON public.venture_content_calendar_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- venture_content_ads
-- ============================================================
CREATE TABLE public.venture_content_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id UUID NOT NULL REFERENCES public.venture_snapshots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  post_id TEXT NOT NULL REFERENCES public.venture_content_calendar_posts(id) ON DELETE CASCADE,
  aspect TEXT NOT NULL CHECK (aspect IN ('1:1','4:5','9:16')),
  art_direction TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  signed_url TEXT,
  signed_url_expires_at TIMESTAMPTZ,
  width INT,
  height INT,
  prompt_used TEXT,
  model_used TEXT,
  brand_kit_locked_at TIMESTAMPTZ,
  is_selected BOOLEAN NOT NULL DEFAULT false,
  canvas_plan JSONB,
  qa_status TEXT,
  qa_notes JSONB,
  last_feedback TEXT,
  last_headline TEXT,
  last_logo_size TEXT,
  last_regenerated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_vca_snapshot ON public.venture_content_ads(snapshot_id);
CREATE INDEX idx_vca_post_aspect ON public.venture_content_ads(post_id, aspect);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.venture_content_ads TO authenticated;
GRANT ALL ON public.venture_content_ads TO service_role;

ALTER TABLE public.venture_content_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their content ads"
  ON public.venture_content_ads FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_vca_updated_at BEFORE UPDATE ON public.venture_content_ads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- venture_content_progress
-- ============================================================
CREATE TABLE public.venture_content_progress (
  snapshot_id UUID PRIMARY KEY REFERENCES public.venture_snapshots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  current_step INT NOT NULL DEFAULT 1,
  selected_weeks INT[] DEFAULT '{}',
  art_direction TEXT,
  default_aspects TEXT[] DEFAULT ARRAY['1:1'],
  launch_status JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.venture_content_progress TO authenticated;
GRANT ALL ON public.venture_content_progress TO service_role;

ALTER TABLE public.venture_content_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their content progress"
  ON public.venture_content_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_vcp_updated_at BEFORE UPDATE ON public.venture_content_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
