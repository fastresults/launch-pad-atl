ALTER TABLE public.venture_brand_kits
ADD COLUMN IF NOT EXISTS logo_set_version bigint NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.mutate_venture_logo_set(
  p_snapshot_id uuid,
  p_operation text,
  p_variant text,
  p_entry jsonb DEFAULT NULL,
  p_expected_path text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_logos jsonb;
  v_next jsonb;
  v_version bigint;
  v_removed jsonb;
  v_removed_count integer := 0;
  v_entry jsonb;
  v_has_primary boolean;
BEGIN
  IF p_operation NOT IN ('replace', 'remove') THEN
    RAISE EXCEPTION 'Unsupported logo mutation operation';
  END IF;

  IF p_variant NOT IN ('primary', 'reversed', 'stacked', 'stacked_reversed', 'icon', 'icon_reversed', 'wordmark', 'wordmark_reversed') THEN
    RAISE EXCEPTION 'Unsupported logo variant';
  END IF;

  SELECT COALESCE(logos, '[]'::jsonb), logo_set_version
  INTO v_logos, v_version
  FROM public.venture_brand_kits
  WHERE snapshot_id = p_snapshot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Brand kit not found';
  END IF;

  IF p_operation = 'replace' THEN
    IF p_entry IS NULL OR jsonb_typeof(p_entry) <> 'object' THEN
      RAISE EXCEPTION 'Logo entry is required';
    END IF;

    SELECT COALESCE(jsonb_agg(item), '[]'::jsonb), COALESCE(jsonb_agg(item) FILTER (
      WHERE item->>'source' = 'upload'
        AND COALESCE(item->>'variant', 'primary') = p_variant
    ), '[]'::jsonb), count(*) FILTER (
      WHERE item->>'source' = 'upload'
        AND COALESCE(item->>'variant', 'primary') = p_variant
    )
    INTO v_next, v_removed, v_removed_count
    FROM jsonb_array_elements(v_logos) item
    WHERE NOT (
      item->>'source' = 'upload'
      AND COALESCE(item->>'variant', 'primary') = p_variant
    );

    IF p_variant = 'primary' THEN
      SELECT COALESCE(jsonb_agg(item || jsonb_build_object('primary', false)), '[]'::jsonb)
      INTO v_next
      FROM jsonb_array_elements(v_next) item;
      v_entry := p_entry || jsonb_build_object('primary', true);
      v_next := jsonb_build_array(v_entry) || v_next;
    ELSE
      v_entry := p_entry || jsonb_build_object('primary', COALESCE((p_entry->>'primary')::boolean, false));
      v_next := v_next || jsonb_build_array(v_entry);
    END IF;
  ELSE
    SELECT COALESCE(jsonb_agg(item) FILTER (
      WHERE NOT (
        item->>'source' = 'upload'
        AND COALESCE(item->>'variant', 'primary') = p_variant
        AND (p_expected_path IS NULL OR item->>'path' = p_expected_path)
      )), '[]'::jsonb), COALESCE(jsonb_agg(item) FILTER (
      WHERE item->>'source' = 'upload'
        AND COALESCE(item->>'variant', 'primary') = p_variant
        AND (p_expected_path IS NULL OR item->>'path' = p_expected_path)
    ), '[]'::jsonb), count(*) FILTER (
      WHERE item->>'source' = 'upload'
        AND COALESCE(item->>'variant', 'primary') = p_variant
        AND (p_expected_path IS NULL OR item->>'path' = p_expected_path)
    )
    INTO v_next, v_removed, v_removed_count
    FROM jsonb_array_elements(v_logos) item;

    IF v_removed_count > 0 THEN
      SELECT EXISTS (SELECT 1 FROM jsonb_array_elements(v_next) item WHERE (item->>'primary')::boolean IS TRUE)
      INTO v_has_primary;
      IF NOT v_has_primary AND jsonb_array_length(v_next) > 0 THEN
        SELECT COALESCE(jsonb_agg(CASE WHEN ordinality = 1 THEN item || jsonb_build_object('primary', true) ELSE item END ORDER BY ordinality), '[]'::jsonb)
        INTO v_next
        FROM jsonb_array_elements(v_next) WITH ORDINALITY AS entries(item, ordinality);
      END IF;
    END IF;
  END IF;

  IF v_removed_count > 0 OR p_operation = 'replace' THEN
    UPDATE public.venture_brand_kits
    SET logos = v_next, logo_set_version = logo_set_version + 1
    WHERE snapshot_id = p_snapshot_id
    RETURNING logo_set_version INTO v_version;
  END IF;

  RETURN jsonb_build_object(
    'logos', v_next,
    'removed', v_removed,
    'removed_count', v_removed_count,
    'version', v_version,
    'operation', p_operation,
    'variant', p_variant
  );
END;
$$;

REVOKE ALL ON FUNCTION public.mutate_venture_logo_set(uuid, text, text, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mutate_venture_logo_set(uuid, text, text, jsonb, text) FROM anon;
REVOKE ALL ON FUNCTION public.mutate_venture_logo_set(uuid, text, text, jsonb, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.mutate_venture_logo_set(uuid, text, text, jsonb, text) TO service_role;