
-- ============================================================
-- Private Tuesday Sessions with Adam
-- ============================================================

-- Settings (single row)
CREATE TABLE public.private_session_settings (
  id smallint PRIMARY KEY DEFAULT 1,
  price_cents integer NOT NULL DEFAULT 29700,
  weeks_ahead integer NOT NULL DEFAULT 8,
  hold_minutes integer NOT NULL DEFAULT 15,
  location_label text NOT NULL DEFAULT 'IGNITE Center · Greater Atlanta Christian School',
  contact_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

GRANT SELECT ON public.private_session_settings TO anon, authenticated;
GRANT ALL ON public.private_session_settings TO service_role;
ALTER TABLE public.private_session_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read private session settings"
  ON public.private_session_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can update private session settings"
  ON public.private_session_settings FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

INSERT INTO public.private_session_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Slots
CREATE TABLE public.private_session_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','blocked','booked')),
  blocked_reason text,
  hold_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_date, start_time),
  CONSTRAINT tuesday_only CHECK (EXTRACT(DOW FROM session_date) = 2)
);

CREATE INDEX private_session_slots_date_idx ON public.private_session_slots (session_date);

GRANT SELECT ON public.private_session_slots TO anon, authenticated;
GRANT ALL ON public.private_session_slots TO service_role;
ALTER TABLE public.private_session_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view slots"
  ON public.private_session_slots FOR SELECT
  USING (true);

CREATE POLICY "Admins manage slots"
  ON public.private_session_slots FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Bookings
CREATE TABLE public.private_session_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid NOT NULL UNIQUE REFERENCES public.private_session_slots(id) ON DELETE RESTRICT,
  user_id uuid,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  business_idea text,
  stage text,
  notes text,
  amount_cents integer NOT NULL DEFAULT 29700,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','refunded','failed')),
  payment_ref text,
  status text NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment','confirmed','cancelled','completed')),
  hold_expires_at timestamptz,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX private_session_bookings_email_idx ON public.private_session_bookings (lower(email));
CREATE INDEX private_session_bookings_user_idx ON public.private_session_bookings (user_id);

GRANT SELECT, INSERT ON public.private_session_bookings TO anon, authenticated;
GRANT UPDATE, DELETE ON public.private_session_bookings TO authenticated;
GRANT ALL ON public.private_session_bookings TO service_role;
ALTER TABLE public.private_session_bookings ENABLE ROW LEVEL SECURITY;

-- Owner or admin can select; also allow selecting via booking id + email match (via RPC).
CREATE POLICY "Owner or admin reads bookings"
  ON public.private_session_bookings FOR SELECT
  TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (user_id IS NOT NULL AND user_id = auth.uid())
  );

CREATE POLICY "Admins update bookings"
  ON public.private_session_bookings FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins delete bookings"
  ON public.private_session_bookings FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- We insert through an RPC (security definer) — no direct insert policy needed for anon,
-- but keep GRANT INSERT so the RPC's writes work under caller privileges if we ever switch.

-- updated_at triggers
CREATE TRIGGER trg_pss_updated
  BEFORE UPDATE ON public.private_session_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_psslot_updated
  BEFORE UPDATE ON public.private_session_slots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_psb_updated
  BEFORE UPDATE ON public.private_session_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Helper functions
-- ============================================================

-- Ensure slots exist for the next N Tuesdays. Safe to call anytime.
CREATE OR REPLACE FUNCTION public.ensure_private_session_slots()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  weeks int;
  d date;
  i int;
BEGIN
  SELECT weeks_ahead INTO weeks FROM public.private_session_settings WHERE id = 1;
  IF weeks IS NULL THEN weeks := 8; END IF;

  -- Find next Tuesday (including today if it's Tuesday)
  d := current_date + ((2 - EXTRACT(DOW FROM current_date)::int + 7) % 7);

  FOR i IN 0..(weeks - 1) LOOP
    INSERT INTO public.private_session_slots (session_date, start_time, end_time, status)
    VALUES
      (d + (i * 7), TIME '09:30', TIME '11:30', 'available'),
      (d + (i * 7), TIME '12:00', TIME '14:00', 'available'),
      (d + (i * 7), TIME '14:30', TIME '16:30', 'available')
    ON CONFLICT (session_date, start_time) DO NOTHING;
  END LOOP;
END;
$$;

-- Atomic reservation: hold a slot + create pending booking.
CREATE OR REPLACE FUNCTION public.reserve_private_session_slot(
  _slot_id uuid,
  _name text,
  _email text,
  _phone text,
  _business_idea text,
  _stage text,
  _notes text
)
RETURNS TABLE(booking_id uuid, hold_expires_at timestamptz, amount_cents int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  slot RECORD;
  hold_mins int;
  price int;
  new_booking_id uuid;
  hold_until timestamptz;
BEGIN
  IF _name IS NULL OR length(trim(_name)) = 0 THEN
    RAISE EXCEPTION 'Name is required';
  END IF;
  IF _email IS NULL OR length(trim(_email)) = 0 THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  SELECT hold_minutes, price_cents INTO hold_mins, price
    FROM public.private_session_settings WHERE id = 1;
  IF hold_mins IS NULL THEN hold_mins := 15; END IF;
  IF price IS NULL THEN price := 29700; END IF;

  -- Lock the slot row
  SELECT * INTO slot FROM public.private_session_slots WHERE id = _slot_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Slot not found';
  END IF;

  -- If slot is held but hold expired, release it first
  IF slot.status = 'booked' AND slot.hold_expires_at IS NOT NULL AND slot.hold_expires_at < now() THEN
    -- Release booking too if unpaid
    DELETE FROM public.private_session_bookings
      WHERE slot_id = slot.id AND payment_status = 'pending' AND (hold_expires_at IS NULL OR hold_expires_at < now());
    UPDATE public.private_session_slots
       SET status = 'available', hold_expires_at = NULL
     WHERE id = slot.id;
    slot.status := 'available';
    slot.hold_expires_at := NULL;
  END IF;

  IF slot.status <> 'available' THEN
    RAISE EXCEPTION 'This time is no longer available';
  END IF;

  hold_until := now() + make_interval(mins => hold_mins);

  INSERT INTO public.private_session_bookings (
    slot_id, user_id, name, email, phone, business_idea, stage, notes,
    amount_cents, payment_status, status, hold_expires_at
  ) VALUES (
    _slot_id, auth.uid(), _name, lower(_email), _phone, _business_idea, _stage, _notes,
    price, 'pending', 'pending_payment', hold_until
  ) RETURNING id INTO new_booking_id;

  UPDATE public.private_session_slots
     SET status = 'booked', hold_expires_at = hold_until
   WHERE id = _slot_id;

  RETURN QUERY SELECT new_booking_id, hold_until, price;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reserve_private_session_slot(uuid, text, text, text, text, text, text) TO anon, authenticated;

-- Confirm booking after payment
CREATE OR REPLACE FUNCTION public.confirm_private_session_booking(
  _booking_id uuid,
  _payment_ref text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  b RECORD;
BEGIN
  SELECT * INTO b FROM public.private_session_bookings WHERE id = _booking_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found'; END IF;

  UPDATE public.private_session_bookings
     SET payment_status = 'paid',
         payment_ref = COALESCE(_payment_ref, payment_ref),
         status = 'confirmed',
         confirmed_at = COALESCE(confirmed_at, now()),
         hold_expires_at = NULL
   WHERE id = _booking_id;

  UPDATE public.private_session_slots
     SET status = 'booked', hold_expires_at = NULL
   WHERE id = b.slot_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_private_session_booking(uuid, text) TO service_role, authenticated;

-- Release expired holds (call from cron)
CREATE OR REPLACE FUNCTION public.release_expired_private_session_holds()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  released int := 0;
BEGIN
  WITH expired AS (
    SELECT id, slot_id FROM public.private_session_bookings
     WHERE payment_status = 'pending'
       AND hold_expires_at IS NOT NULL
       AND hold_expires_at < now()
  ),
  del AS (
    DELETE FROM public.private_session_bookings
     WHERE id IN (SELECT id FROM expired)
     RETURNING slot_id
  )
  UPDATE public.private_session_slots s
     SET status = 'available', hold_expires_at = NULL
   FROM del
   WHERE s.id = del.slot_id AND s.status = 'booked';

  GET DIAGNOSTICS released = ROW_COUNT;
  RETURN released;
END;
$$;

GRANT EXECUTE ON FUNCTION public.release_expired_private_session_holds() TO service_role, authenticated;

-- Admin: block / unblock a slot
CREATE OR REPLACE FUNCTION public.admin_set_private_session_slot_status(
  _slot_id uuid,
  _status text,
  _reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;
  IF _status NOT IN ('available','blocked') THEN
    RAISE EXCEPTION 'Invalid status: %', _status;
  END IF;

  UPDATE public.private_session_slots
     SET status = _status,
         blocked_reason = CASE WHEN _status = 'blocked' THEN _reason ELSE NULL END,
         hold_expires_at = NULL
   WHERE id = _slot_id
     AND status <> 'booked';
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_private_session_slot_status(uuid, text, text) TO authenticated;

-- Public helper: fetch upcoming available slots (ensures generation on read)
CREATE OR REPLACE FUNCTION public.get_upcoming_private_session_slots()
RETURNS TABLE(id uuid, session_date date, start_time time, end_time time, status text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT s.id, s.session_date, s.start_time, s.end_time,
           CASE
             WHEN s.status = 'booked' AND s.hold_expires_at IS NOT NULL AND s.hold_expires_at < now()
               THEN 'available'
             ELSE s.status
           END AS status
      FROM public.private_session_slots s
     WHERE s.session_date >= current_date
     ORDER BY s.session_date, s.start_time;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_upcoming_private_session_slots() TO anon, authenticated;

-- Seed initial slots
SELECT public.ensure_private_session_slots();
