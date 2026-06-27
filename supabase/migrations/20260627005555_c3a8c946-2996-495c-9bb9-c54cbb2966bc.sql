CREATE OR REPLACE FUNCTION public.reset_founder_workspace(_user_id uuid)
 RETURNS text[]
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  remaining int;
  cleared text[] := ARRAY[]::text[];
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF auth.uid() <> _user_id AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT count(*) INTO remaining FROM public.venture_snapshots WHERE user_id = _user_id;
  IF remaining > 0 THEN
    RAISE EXCEPTION 'Cannot reset: % venture(s) still exist', remaining;
  END IF;

  DELETE FROM public.attendee_business_brief WHERE user_id = _user_id;
  cleared := array_append(cleared, 'attendee_business_brief');

  DELETE FROM public.attendee_founder_profile WHERE user_id = _user_id;
  cleared := array_append(cleared, 'attendee_founder_profile');

  DELETE FROM public.attendee_founder_memory WHERE user_id = _user_id;
  cleared := array_append(cleared, 'attendee_founder_memory');

  DELETE FROM public.attendee_market_profile WHERE user_id = _user_id;
  cleared := array_append(cleared, 'attendee_market_profile');

  DELETE FROM public.attendee_goals WHERE user_id = _user_id;
  cleared := array_append(cleared, 'attendee_goals');

  DELETE FROM public.attendee_stage_intake WHERE user_id = _user_id;
  cleared := array_append(cleared, 'attendee_stage_intake');

  DELETE FROM public.attendee_filing_info WHERE user_id = _user_id;
  cleared := array_append(cleared, 'attendee_filing_info');

  UPDATE public.attendee_profiles
     SET headline = NULL,
         background = NULL,
         skills = '{}',
         time_commitment_hours = NULL,
         primary_goal = NULL,
         business_name = NULL,
         industry = NULL,
         stage = NULL,
         target_market = NULL,
         problem_solved = NULL,
         value_prop = NULL,
         competitors = '{}',
         business_model = NULL,
         current_revenue = NULL,
         funding_raised = NULL,
         monthly_burn = NULL,
         runway_months = NULL,
         projections = '{}'::jsonb,
         intake_completed_at = NULL,
         updated_at = now()
   WHERE user_id = _user_id;
  cleared := array_append(cleared, 'attendee_profiles(venture_fields)');

  RETURN cleared;
END;
$function$;