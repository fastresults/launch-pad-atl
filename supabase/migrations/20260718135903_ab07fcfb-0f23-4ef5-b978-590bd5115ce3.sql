-- Phase 1 · Rate-limit anonymous submissions on public endpoints

CREATE OR REPLACE FUNCTION public.enforce_submission_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count int;
  window_minutes int := 60;
  max_per_window int := 5;
BEGIN
  IF NEW.email IS NULL OR length(trim(NEW.email)) = 0 THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'inquiries' THEN
    SELECT count(*) INTO recent_count
      FROM public.inquiries
     WHERE lower(email) = lower(NEW.email)
       AND created_at > now() - make_interval(mins => window_minutes);
  ELSIF TG_TABLE_NAME = 'founder_applications' THEN
    SELECT count(*) INTO recent_count
      FROM public.founder_applications
     WHERE lower(email) = lower(NEW.email)
       AND created_at > now() - make_interval(mins => window_minutes);
  ELSE
    RETURN NEW;
  END IF;

  IF recent_count >= max_per_window THEN
    RAISE EXCEPTION 'Too many submissions from this email in the last hour. Please try again later.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_submission_rate_limit() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_inquiries_rate_limit ON public.inquiries;
CREATE TRIGGER trg_inquiries_rate_limit
  BEFORE INSERT ON public.inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_submission_rate_limit();

DROP TRIGGER IF EXISTS trg_founder_applications_rate_limit ON public.founder_applications;
CREATE TRIGGER trg_founder_applications_rate_limit
  BEFORE INSERT ON public.founder_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_submission_rate_limit();
