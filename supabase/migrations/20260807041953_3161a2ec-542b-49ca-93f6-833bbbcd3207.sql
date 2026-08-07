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
           jsonb_build_array(p_logo || jsonb_build_object('primary', true)) ||
           COALESCE(
             (SELECT jsonb_agg(e || jsonb_build_object('primary', false))
                FROM jsonb_array_elements(
                  CASE WHEN jsonb_typeof(logos) = 'array' THEN logos ELSE '[]'::jsonb END
                ) e),
             '[]'::jsonb
           )
         ) AS x
         LIMIT GREATEST(p_max, 1)
       ) s
     )
   WHERE snapshot_id = p_snapshot_id
  RETURNING logos;
$$;

-- Backfill: kits with logos but no primary promote their newest (first) logo.
UPDATE public.venture_brand_kits k
   SET logos = (
     SELECT jsonb_agg(
       CASE WHEN ord = 1 THEN e || jsonb_build_object('primary', true)
            ELSE e || jsonb_build_object('primary', false) END
       ORDER BY ord
     )
     FROM jsonb_array_elements(k.logos) WITH ORDINALITY AS t(e, ord)
   )
 WHERE jsonb_typeof(k.logos) = 'array'
   AND jsonb_array_length(k.logos) > 0
   AND NOT EXISTS (
     SELECT 1 FROM jsonb_array_elements(k.logos) e
      WHERE (e->>'primary')::boolean IS TRUE
   );