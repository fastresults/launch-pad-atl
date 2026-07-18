-- Phase 1 · Performance indexes
-- Targets the six hottest queries in pg_stat_statements.

CREATE INDEX IF NOT EXISTS idx_venture_documents_snapshot_id
  ON public.venture_documents (snapshot_id);

CREATE INDEX IF NOT EXISTS idx_venture_brand_kits_snapshot_id
  ON public.venture_brand_kits (snapshot_id);

CREATE INDEX IF NOT EXISTS idx_venture_content_ads_snapshot_created
  ON public.venture_content_ads (snapshot_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_venture_social_assets_snapshot_created
  ON public.venture_social_assets (snapshot_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_pipeline_runs_user_created
  ON public.ai_pipeline_runs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_pipeline_steps_run_id
  ON public.ai_pipeline_steps (run_id);
