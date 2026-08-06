CREATE TABLE public.brand_logo_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id uuid NOT NULL REFERENCES public.venture_snapshots(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','developing_brief','developing_directions','rendering','reviewing','completed','completed_with_review','failed','canceled')),
  requested_count integer NOT NULL DEFAULT 4 CHECK (requested_count BETWEEN 1 AND 8),
  completed_count integer NOT NULL DEFAULT 0 CHECK (completed_count >= 0),
  strategy jsonb NOT NULL DEFAULT '{}'::jsonb,
  reference_images jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_error text,
  heartbeat_at timestamptz,
  canceled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.brand_logo_runs TO authenticated;
GRANT ALL ON public.brand_logo_runs TO service_role;
ALTER TABLE public.brand_logo_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners read logo runs" ON public.brand_logo_runs
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.venture_snapshots s
      WHERE s.id = snapshot_id
        AND (s.user_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );
CREATE INDEX brand_logo_runs_snapshot_created_idx ON public.brand_logo_runs(snapshot_id, created_at DESC);
CREATE INDEX brand_logo_runs_work_idx ON public.brand_logo_runs(status, heartbeat_at);
CREATE UNIQUE INDEX brand_logo_runs_one_active_idx ON public.brand_logo_runs(snapshot_id)
  WHERE status NOT IN ('completed','completed_with_review','failed','canceled');
CREATE TRIGGER brand_logo_runs_updated
  BEFORE UPDATE ON public.brand_logo_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.brand_logo_directions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.brand_logo_runs(id) ON DELETE CASCADE,
  snapshot_id uuid NOT NULL REFERENCES public.venture_snapshots(id) ON DELETE CASCADE,
  slot integer NOT NULL CHECK (slot BETWEEN 0 AND 7),
  idempotency_key text NOT NULL,
  direction_name text,
  logo_type text,
  concept jsonb NOT NULL DEFAULT '{}'::jsonb,
  vector_spec jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','developing_vector','drawing','reviewing','retry_wait','ready','needs_review','failed','canceled')),
  current_stage text NOT NULL DEFAULT 'develop_vector' CHECK (current_stage IN ('develop_vector','draw_vector','review_vector','revise_vector','publish_vector','complete')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  review_attempts integer NOT NULL DEFAULT 0 CHECK (review_attempts >= 0),
  review_passed boolean,
  review_score jsonb NOT NULL DEFAULT '{}'::jsonb,
  review_note text,
  svg_path text,
  preview_path text,
  asset jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_error text,
  error_class text,
  retry_at timestamptz,
  lease_token uuid,
  lease_expires_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (run_id, slot),
  UNIQUE (idempotency_key)
);
GRANT SELECT ON public.brand_logo_directions TO authenticated;
GRANT ALL ON public.brand_logo_directions TO service_role;
ALTER TABLE public.brand_logo_directions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners read logo directions" ON public.brand_logo_directions
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.venture_snapshots s
      WHERE s.id = snapshot_id
        AND (s.user_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );
CREATE INDEX brand_logo_directions_run_slot_idx ON public.brand_logo_directions(run_id, slot);
CREATE INDEX brand_logo_directions_queue_idx ON public.brand_logo_directions(status, retry_at, lease_expires_at);
CREATE TRIGGER brand_logo_directions_updated
  BEFORE UPDATE ON public.brand_logo_directions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.publish_brand_logo_direction(
  p_direction_id uuid,
  p_run_id uuid,
  p_run_version integer,
  p_asset jsonb,
  p_svg_path text,
  p_preview_path text,
  p_review_passed boolean,
  p_review_score jsonb,
  p_review_note text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_run public.brand_logo_runs%ROWTYPE;
  v_direction public.brand_logo_directions%ROWTYPE;
  v_logos jsonb;
  v_completed integer;
  v_needs_review integer;
BEGIN
  SELECT * INTO v_run FROM public.brand_logo_runs
  WHERE id = p_run_id AND version = p_run_version AND status <> 'canceled'
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Logo run is stale or canceled'; END IF;

  SELECT * INTO v_direction FROM public.brand_logo_directions
  WHERE id = p_direction_id AND run_id = p_run_id
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Logo direction not found'; END IF;

  UPDATE public.brand_logo_directions SET
    status = CASE WHEN p_review_passed THEN 'ready' ELSE 'needs_review' END,
    current_stage = 'complete',
    asset = p_asset,
    svg_path = p_svg_path,
    preview_path = p_preview_path,
    review_passed = p_review_passed,
    review_score = COALESCE(p_review_score, '{}'::jsonb),
    review_note = p_review_note,
    last_error = NULL,
    error_class = NULL,
    lease_token = NULL,
    lease_expires_at = NULL,
    completed_at = now()
  WHERE id = p_direction_id;

  SELECT COALESCE(jsonb_agg(d.asset ORDER BY d.slot), '[]'::jsonb)
    INTO v_logos
  FROM public.brand_logo_directions d
  WHERE d.run_id = p_run_id AND d.status IN ('ready','needs_review');

  INSERT INTO public.venture_brand_kits (snapshot_id, logos)
  VALUES (v_run.snapshot_id, v_logos)
  ON CONFLICT (snapshot_id) DO UPDATE SET logos = EXCLUDED.logos, updated_at = now();

  SELECT count(*) FILTER (WHERE status IN ('ready','needs_review')),
         count(*) FILTER (WHERE status = 'needs_review')
    INTO v_completed, v_needs_review
  FROM public.brand_logo_directions WHERE run_id = p_run_id;

  UPDATE public.brand_logo_runs SET
    completed_count = v_completed,
    status = CASE
      WHEN v_completed >= requested_count THEN CASE WHEN v_needs_review > 0 THEN 'completed_with_review' ELSE 'completed' END
      ELSE 'rendering'
    END,
    completed_at = CASE WHEN v_completed >= requested_count THEN now() ELSE NULL END,
    heartbeat_at = now(),
    last_error = NULL
  WHERE id = p_run_id;

  RETURN p_asset;
END;
$$;
REVOKE ALL ON FUNCTION public.publish_brand_logo_direction(uuid, uuid, integer, jsonb, text, text, boolean, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_brand_logo_direction(uuid, uuid, integer, jsonb, text, text, boolean, jsonb, text) TO service_role;