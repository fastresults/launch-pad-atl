ALTER FUNCTION public.verify_bulk_unlock(uuid, uuid, text) SET search_path = public, extensions;
ALTER FUNCTION public.admin_set_bulk_unlock_default(text) SET search_path = public, extensions;
ALTER FUNCTION public.admin_set_user_bulk_unlock(uuid, text) SET search_path = public, extensions;

INSERT INTO public.site_settings (key, value)
VALUES ('bulk_unlock_default', jsonb_build_object('hash', extensions.crypt('4321', extensions.gen_salt('bf'))))
ON CONFLICT (key) DO UPDATE
  SET value = jsonb_build_object('hash', extensions.crypt('4321', extensions.gen_salt('bf'))),
      updated_at = now();