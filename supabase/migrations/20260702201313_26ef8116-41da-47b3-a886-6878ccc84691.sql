
-- 1) Impersonation audit log
CREATE TABLE IF NOT EXISTS public.admin_impersonation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.admin_impersonation_log TO authenticated;
GRANT ALL ON public.admin_impersonation_log TO service_role;
ALTER TABLE public.admin_impersonation_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage impersonation log"
  ON public.admin_impersonation_log
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.start_impersonation(_target uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.admin_impersonation_log(actor_user_id, target_user_id)
    VALUES (auth.uid(), _target)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.end_impersonation(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.admin_impersonation_log
     SET ended_at = now()
   WHERE id = _id AND actor_user_id = auth.uid() AND ended_at IS NULL;
END;
$$;

-- 2) Admin write bypass on founder-owned tables.
--    Use a helper to add an "Admins full access" ALL policy without duplicating boilerplate.
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'venture_snapshots','venture_documents','venture_brand_kits','venture_social_assets',
    'venture_content_ads','venture_content_calendar_posts','venture_content_progress',
    'venture_social_progress','venture_style_previews','venture_generation_jobs',
    'venture_generation_failures','deliverable_revisions','attendee_business_brief',
    'attendee_founder_profile','attendee_market_profile','attendee_goals',
    'attendee_stage_intake','attendee_filing_info','attendee_founder_memory',
    'attendee_profiles','attendee_deliverables','attendee_documents','attendee_progress',
    'social_setup_brand','social_setup_progress','social_setup_brand_package',
    'social_brand_assets','media_assets','media_collections','media_collection_items',
    'media_folders','bulk_unlock_grants'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- Skip tables that don't exist in this project
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=t) THEN
      EXECUTE format('DROP POLICY IF EXISTS "Admins full access" ON public.%I', t);
      EXECUTE format(
        'CREATE POLICY "Admins full access" ON public.%I FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()))',
        t
      );
    END IF;
  END LOOP;
END $$;
