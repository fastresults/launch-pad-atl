CREATE OR REPLACE FUNCTION public.mutate_studio_mark_choice(
  p_snapshot_id uuid,
  p_placement_key text,
  p_choice jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_current jsonb;
  v_next jsonb;
BEGIN
  IF p_placement_key IS NULL OR length(trim(p_placement_key)) = 0 OR length(p_placement_key) > 240 THEN
    RAISE EXCEPTION 'Invalid placement key';
  END IF;

  SELECT user_id, COALESCE(studio_mark_choice, '{}'::jsonb)
    INTO v_user_id, v_current
  FROM public.venture_brand_kits
  WHERE snapshot_id = p_snapshot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Brand kit not found';
  END IF;

  IF auth.uid() IS NULL OR (auth.uid() <> v_user_id AND NOT public.is_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_choice IS NULL OR p_choice = 'null'::jsonb THEN
    v_next := v_current - p_placement_key;
  ELSE
    IF jsonb_typeof(p_choice) <> 'object'
       OR NOT (p_choice ? 'form')
       OR NOT (p_choice ? 'tone')
       OR (p_choice->>'form') NOT IN ('symbol', 'horizontal', 'stacked', 'wordmark')
       OR (p_choice->>'tone') NOT IN ('colour', 'inverse') THEN
      RAISE EXCEPTION 'Invalid logo choice';
    END IF;
    v_next := jsonb_set(v_current, ARRAY[p_placement_key], p_choice, true);
  END IF;

  UPDATE public.venture_brand_kits
  SET studio_mark_choice = v_next,
      updated_at = now()
  WHERE snapshot_id = p_snapshot_id;

  RETURN v_next;
END;
$$;

REVOKE ALL ON FUNCTION public.mutate_studio_mark_choice(uuid, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mutate_studio_mark_choice(uuid, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mutate_studio_mark_choice(uuid, text, jsonb) TO service_role;