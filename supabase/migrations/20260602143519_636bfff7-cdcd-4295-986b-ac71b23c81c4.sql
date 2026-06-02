
-- 1) Profiles: stop exposing emails (and entire profile rows) to anonymous visitors.
-- All app code reads profiles via supabaseAdmin (service_role), which bypasses RLS,
-- so tightening the SELECT policy is safe.
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Users read own profile or admins read all"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 2) site_settings: contains admin notification email. All reads happen server-side
-- via supabaseAdmin, so remove public SELECT entirely.
DROP POLICY IF EXISTS "Site settings are publicly readable" ON public.site_settings;
-- Allow authenticated admins to read for the admin UI; server fns use service_role.
CREATE POLICY "Admins read site settings"
  ON public.site_settings
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- 3) Realtime: no client code subscribes to these channels. Remove them from the
-- realtime publication so user-scoped row changes aren't broadcast to any subscriber.
ALTER PUBLICATION supabase_realtime DROP TABLE public.attendee_deliverables;
ALTER PUBLICATION supabase_realtime DROP TABLE public.ai_pipeline_steps;
ALTER PUBLICATION supabase_realtime DROP TABLE public.media_folders;
ALTER PUBLICATION supabase_realtime DROP TABLE public.media_assets;
ALTER PUBLICATION supabase_realtime DROP TABLE public.media_collections;

-- 4) Function search_path hardening on queue helpers (the rest already set it).
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;

-- 5) Queue helper functions are only meant for server-side (service_role) callers.
-- Revoke EXECUTE from anon/authenticated so end users can't enqueue/read/delete
-- arbitrary queue messages via the Data API.
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;

-- Promote/seat-reservation helpers should only run from trusted server code.
REVOKE EXECUTE ON FUNCTION public.promote_application(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reserve_cohort_seat(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_cohort_seat_cache(text) FROM PUBLIC, anon, authenticated;
