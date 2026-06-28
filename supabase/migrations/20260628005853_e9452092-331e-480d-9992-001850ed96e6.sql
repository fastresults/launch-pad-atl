INSERT INTO public.site_settings (key, value)
VALUES ('bulk_unlock_default', jsonb_build_object('hash', crypt('4321', gen_salt('bf'))))
ON CONFLICT (key) DO UPDATE
  SET value = jsonb_build_object('hash', crypt('4321', gen_salt('bf'))),
      updated_at = now();