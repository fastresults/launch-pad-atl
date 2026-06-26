
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Per-user override unlock code (hashed)
CREATE TABLE public.bulk_unlock_codes (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  set_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.bulk_unlock_codes TO authenticated;
GRANT ALL ON public.bulk_unlock_codes TO service_role;

ALTER TABLE public.bulk_unlock_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage unlock codes"
  ON public.bulk_unlock_codes FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_bulk_unlock_codes_updated
  BEFORE UPDATE ON public.bulk_unlock_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Per (user, snapshot) grant that bulk generation has been unlocked
CREATE TABLE public.bulk_unlock_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_id uuid NOT NULL REFERENCES public.venture_snapshots(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  UNIQUE (user_id, snapshot_id)
);

GRANT SELECT, INSERT ON public.bulk_unlock_grants TO authenticated;
GRANT ALL ON public.bulk_unlock_grants TO service_role;

ALTER TABLE public.bulk_unlock_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own grants"
  ON public.bulk_unlock_grants FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins manage grants"
  ON public.bulk_unlock_grants FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Verify a candidate code against a user's override (if any) then the global default.
-- Records and returns a grant for (user, snapshot) on success.
CREATE OR REPLACE FUNCTION public.verify_bulk_unlock(_user_id uuid, _snapshot_id uuid, _code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_hash text;
  default_hash text;
  matched boolean := false;
BEGIN
  IF _code IS NULL OR length(_code) = 0 THEN
    RETURN false;
  END IF;

  SELECT code_hash INTO user_hash
    FROM public.bulk_unlock_codes
   WHERE user_id = _user_id AND revoked_at IS NULL;

  IF user_hash IS NOT NULL THEN
    matched := (crypt(_code, user_hash) = user_hash);
  ELSE
    SELECT (value->>'hash') INTO default_hash
      FROM public.site_settings
     WHERE key = 'bulk_unlock_default';
    IF default_hash IS NOT NULL THEN
      matched := (crypt(_code, default_hash) = default_hash);
    END IF;
  END IF;

  IF matched THEN
    INSERT INTO public.bulk_unlock_grants (user_id, snapshot_id)
    VALUES (_user_id, _snapshot_id)
    ON CONFLICT (user_id, snapshot_id) DO UPDATE SET revoked_at = NULL, granted_at = now();
  END IF;

  RETURN matched;
END;
$$;

-- Admin helpers: set / clear codes (hash on the server side using pgcrypto)
CREATE OR REPLACE FUNCTION public.admin_set_bulk_unlock_default(_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  INSERT INTO public.site_settings (key, value)
  VALUES ('bulk_unlock_default', jsonb_build_object('hash', crypt(_code, gen_salt('bf'))))
  ON CONFLICT (key) DO UPDATE
    SET value = jsonb_build_object('hash', crypt(_code, gen_salt('bf'))),
        updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_clear_bulk_unlock_default()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  DELETE FROM public.site_settings WHERE key = 'bulk_unlock_default';
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_bulk_unlock(_user_id uuid, _code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  INSERT INTO public.bulk_unlock_codes (user_id, code_hash, set_by, revoked_at)
  VALUES (_user_id, crypt(_code, gen_salt('bf')), auth.uid(), NULL)
  ON CONFLICT (user_id) DO UPDATE
    SET code_hash = crypt(_code, gen_salt('bf')),
        set_by = auth.uid(),
        revoked_at = NULL,
        updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_clear_user_bulk_unlock(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  DELETE FROM public.bulk_unlock_codes WHERE user_id = _user_id;
  UPDATE public.bulk_unlock_grants SET revoked_at = now() WHERE user_id = _user_id AND revoked_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_bulk_unlock(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_bulk_unlock_default(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_clear_bulk_unlock_default() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_bulk_unlock(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_clear_user_bulk_unlock(uuid) TO authenticated;
