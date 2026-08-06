CREATE OR REPLACE FUNCTION public.publish_brand_logo_direction(p_direction_id uuid, p_run_id uuid, p_run_version integer, p_asset jsonb, p_svg_path text, p_preview_path text, p_review_passed boolean, p_review_score jsonb, p_review_note text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  INSERT INTO public.venture_brand_kits (snapshot_id, user_id, logos)
  VALUES (v_run.snapshot_id, v_run.user_id, v_logos)
  ON CONFLICT (snapshot_id) DO UPDATE SET
    user_id = COALESCE(public.venture_brand_kits.user_id, EXCLUDED.user_id),
    logos = EXCLUDED.logos,
    updated_at = now();

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
$function$;