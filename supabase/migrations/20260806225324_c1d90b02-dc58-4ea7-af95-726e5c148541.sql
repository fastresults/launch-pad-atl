CREATE OR REPLACE FUNCTION public.append_brand_logo(p_snapshot_id uuid, p_logo jsonb, p_max integer DEFAULT 8)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.venture_brand_kits
     SET logos = (
       SELECT jsonb_agg(x)
       FROM (
         SELECT x
         FROM jsonb_array_elements(
           jsonb_build_array(p_logo) ||
           COALESCE(CASE WHEN jsonb_typeof(logos) = 'array' THEN logos ELSE '[]'::jsonb END, '[]'::jsonb)
         ) AS x
         LIMIT GREATEST(p_max, 1)
       ) s
     )
   WHERE snapshot_id = p_snapshot_id
  RETURNING logos;
$$;

REVOKE ALL ON FUNCTION public.append_brand_logo(uuid, jsonb, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.append_brand_logo(uuid, jsonb, integer) TO service_role;