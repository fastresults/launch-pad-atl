ALTER TABLE public.venture_shares ADD COLUMN IF NOT EXISTS slug text;

CREATE UNIQUE INDEX IF NOT EXISTS venture_shares_slug_active_uidx
  ON public.venture_shares (lower(slug))
  WHERE slug IS NOT NULL AND revoked_at IS NULL;

DO $$
DECLARE
  r record;
  base text;
  candidate text;
  n int;
BEGIN
  FOR r IN
    SELECT vs.id, coalesce(nullif(trim(vsn.company_name), ''), vs.title, '') AS name
    FROM public.venture_shares vs
    LEFT JOIN public.venture_snapshots vsn ON vsn.id = vs.snapshot_id
    WHERE vs.slug IS NULL AND vs.revoked_at IS NULL
  LOOP
    base := lower(regexp_replace(regexp_replace(r.name, '[^a-zA-Z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g'));
    base := regexp_replace(left(base, 40), '-+$', '', 'g');
    IF base IS NULL OR length(base) < 3 THEN
      base := 'v' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 7);
    END IF;
    candidate := base;
    n := 1;
    WHILE EXISTS (
      SELECT 1 FROM public.venture_shares
      WHERE lower(slug) = candidate AND revoked_at IS NULL
    ) LOOP
      n := n + 1;
      candidate := regexp_replace(left(base, 37), '-+$', '', 'g') || '-' || n::text;
    END LOOP;
    UPDATE public.venture_shares SET slug = candidate WHERE id = r.id;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.venture_share_slug_available(_slug text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'
     AND NOT EXISTS (
       SELECT 1 FROM public.venture_shares
       WHERE lower(slug) = lower(_slug) AND revoked_at IS NULL
     );
$$;

GRANT EXECUTE ON FUNCTION public.venture_share_slug_available(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.venture_share_slug_available(text) TO service_role;