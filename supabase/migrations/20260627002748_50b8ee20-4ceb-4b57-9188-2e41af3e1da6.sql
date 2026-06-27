
-- F19: promote_application is granted to authenticated, but the function did
-- not verify the caller is an admin. Any authed user who knew an application
-- UUID in 'selected' status could promote it and create a registration.
-- Add an is_admin gate as the first statement.
CREATE OR REPLACE FUNCTION public.promote_application(_app_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  a RECORD;
  new_reg_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO a FROM public.founder_applications WHERE id = _app_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Application % not found', _app_id; END IF;
  IF a.converted_registration_id IS NOT NULL THEN
    RETURN a.converted_registration_id;
  END IF;
  IF a.status <> 'selected' THEN
    RAISE EXCEPTION 'Application must be in selected status to promote (current: %)', a.status;
  END IF;

  INSERT INTO public.workshop_registrations (
    name, email, phone, business_idea, industry, stage,
    referral_source, tier_interest, cohort_id, status, assigned_tier
  ) VALUES (
    a.name, a.email, a.phone,
    'ABOUT THE FOUNDER:'||E'\n'||a.about_you||E'\n\n'||
    'ABOUT THE STARTUP:'||E'\n'||a.about_startup||E'\n\n'||
    'WHY THIS, WHY NOW:'||E'\n'||a.why_now||
    CASE WHEN a.linkedin_url IS NOT NULL AND a.linkedin_url <> '' THEN E'\n\nLINKEDIN: '||a.linkedin_url ELSE '' END,
    a.industry, a.stage, a.referral_source,
    'selection', a.cohort_id, 'confirmed', 'selection'
  ) RETURNING id INTO new_reg_id;

  UPDATE public.founder_applications
     SET converted_registration_id = new_reg_id, updated_at = now()
   WHERE id = _app_id;

  RETURN new_reg_id;
END;
$function$;

-- F20: auto_approve_member_on_payment trusted an email match against profiles
-- when user_id was NULL on the registration. That let any registration insert
-- with someone else's email auto-approve their membership. Restrict approval
-- to verified, linked registrations only (user_id NOT NULL).
CREATE OR REPLACE FUNCTION public.auto_approve_member_on_payment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  target_user_id uuid;
BEGIN
  IF NEW.status NOT IN ('paid','confirmed') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- F20: only auto-approve when the registration is explicitly linked to an
  -- authenticated user. Email-based lookup removed to prevent pre-approval
  -- of unlinked accounts via attacker-submitted registrations.
  target_user_id := NEW.user_id;
  IF target_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.profiles
     SET member_status = 'approved',
         approved_at = COALESCE(approved_at, now()),
         approved_via = COALESCE(approved_via, 'payment')
   WHERE user_id = target_user_id
     AND member_status <> 'approved';

  RETURN NEW;
END;
$function$;
