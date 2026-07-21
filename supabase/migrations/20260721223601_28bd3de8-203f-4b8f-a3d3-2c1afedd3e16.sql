
-- 1. Reservation no longer expires
CREATE OR REPLACE FUNCTION public.reserve_private_session_slot(_slot_id uuid, _name text, _email text, _phone text, _business_idea text, _stage text, _notes text)
 RETURNS TABLE(booking_id uuid, hold_expires_at timestamp with time zone, amount_cents integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  slot RECORD;
  price int;
  new_booking_id uuid;
BEGIN
  IF _name IS NULL OR length(trim(_name)) = 0 THEN
    RAISE EXCEPTION 'Name is required';
  END IF;
  IF _email IS NULL OR length(trim(_email)) = 0 THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  SELECT price_cents INTO price FROM public.private_session_settings WHERE id = 1;
  IF price IS NULL THEN price := 29700; END IF;

  SELECT * INTO slot FROM public.private_session_slots WHERE id = _slot_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Slot not found';
  END IF;

  IF slot.status <> 'available' THEN
    RAISE EXCEPTION 'This time is no longer available';
  END IF;

  INSERT INTO public.private_session_bookings (
    slot_id, user_id, name, email, phone, business_idea, stage, notes,
    amount_cents, payment_status, status, hold_expires_at
  ) VALUES (
    _slot_id, auth.uid(), _name, lower(_email), _phone, _business_idea, _stage, _notes,
    price, 'pending', 'pending_payment', NULL
  ) RETURNING id INTO new_booking_id;

  UPDATE public.private_session_slots
     SET status = 'booked', hold_expires_at = NULL
   WHERE id = _slot_id;

  RETURN QUERY SELECT new_booking_id, NULL::timestamptz, price;
END;
$function$;

-- 2. Do not auto-release expired holds
CREATE OR REPLACE FUNCTION public.get_upcoming_private_session_slots()
 RETURNS TABLE(id uuid, session_date date, start_time time without time zone, end_time time without time zone, status text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
    SELECT s.id, s.session_date, s.start_time, s.end_time, s.status
      FROM public.private_session_slots s
     WHERE s.session_date >= (now() AT TIME ZONE 'America/New_York')::date
       AND (
         s.session_date > (now() AT TIME ZONE 'America/New_York')::date
         OR ((s.session_date + s.end_time) AT TIME ZONE 'America/New_York') > now()
       )
     ORDER BY s.session_date, s.start_time;
END;
$function$;

-- 3. Admin release booking
CREATE OR REPLACE FUNCTION public.admin_release_private_session_booking(_booking_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  b RECORD;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO b FROM public.private_session_bookings WHERE id = _booking_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found'; END IF;

  UPDATE public.private_session_bookings
     SET status = 'cancelled',
         hold_expires_at = NULL
   WHERE id = _booking_id;

  UPDATE public.private_session_slots
     SET status = 'available', hold_expires_at = NULL
   WHERE id = b.slot_id;
END;
$function$;

-- 4. Admin confirm booking (offline payment)
CREATE OR REPLACE FUNCTION public.admin_confirm_private_session_booking(_booking_id uuid, _payment_ref text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  UPDATE public.private_session_bookings
     SET payment_status = 'paid',
         payment_ref = COALESCE(_payment_ref, payment_ref),
         status = 'confirmed',
         confirmed_at = COALESCE(confirmed_at, now()),
         hold_expires_at = NULL
   WHERE id = _booking_id;
END;
$function$;

-- 5. Clear any stale hold_expires_at values
UPDATE public.private_session_slots SET hold_expires_at = NULL WHERE hold_expires_at IS NOT NULL;
UPDATE public.private_session_bookings SET hold_expires_at = NULL WHERE hold_expires_at IS NOT NULL AND status = 'pending_payment';
