
-- 1) Per-cohort pricing and seat caps
ALTER TABLE public.cohorts
  ADD COLUMN IF NOT EXISTS founders_price_cents integer NOT NULL DEFAULT 67900,
  ADD COLUMN IF NOT EXISTS founders_seats integer NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS cohort_price_cents integer NOT NULL DEFAULT 99700,
  ADD COLUMN IF NOT EXISTS cohort_seats integer NOT NULL DEFAULT 13;

ALTER TABLE public.cohorts
  ADD CONSTRAINT cohorts_founders_seats_positive CHECK (founders_seats >= 0),
  ADD CONSTRAINT cohorts_cohort_seats_positive CHECK (cohort_seats >= 0),
  ADD CONSTRAINT cohorts_founders_price_nonneg CHECK (founders_price_cents >= 0),
  ADD CONSTRAINT cohorts_cohort_price_nonneg CHECK (cohort_price_cents >= 0);

-- 2) Registrations: record assigned tier + price paid + expanded status
ALTER TABLE public.workshop_registrations
  ADD COLUMN IF NOT EXISTS assigned_tier text,
  ADD COLUMN IF NOT EXISTS price_paid_cents integer,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- Replace status constraint to allow paid/confirmed/refunded/cancelled
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND table_name='workshop_registrations'
      AND constraint_name='workshop_registrations_status_check'
  ) THEN
    ALTER TABLE public.workshop_registrations DROP CONSTRAINT workshop_registrations_status_check;
  END IF;
END $$;

ALTER TABLE public.workshop_registrations
  ADD CONSTRAINT workshop_registrations_status_check
  CHECK (status IN ('pending','paid','confirmed','refunded','cancelled'));

ALTER TABLE public.workshop_registrations
  ADD CONSTRAINT workshop_registrations_assigned_tier_check
  CHECK (assigned_tier IS NULL OR assigned_tier IN ('founders','cohort'));

CREATE INDEX IF NOT EXISTS idx_workshop_reg_cohort_status_tier
  ON public.workshop_registrations (cohort_id, status, assigned_tier);

-- 3) Atomic seat reservation
CREATE OR REPLACE FUNCTION public.reserve_cohort_seat(
  _registration_id uuid,
  _cohort_id text,
  _requested_tier text
) RETURNS TABLE (assigned_tier text, price_cents integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c RECORD;
  founders_taken integer;
  cohort_taken integer;
  chosen text;
  chosen_price integer;
BEGIN
  IF _requested_tier NOT IN ('founders','cohort') THEN
    RAISE EXCEPTION 'Invalid tier: %', _requested_tier;
  END IF;

  -- Lock cohort row to serialize concurrent reservations
  SELECT id, founders_seats, founders_price_cents, cohort_seats, cohort_price_cents
    INTO c
    FROM public.cohorts
   WHERE id = _cohort_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cohort % not found', _cohort_id;
  END IF;

  SELECT
    COUNT(*) FILTER (WHERE assigned_tier='founders'),
    COUNT(*) FILTER (WHERE assigned_tier='cohort')
  INTO founders_taken, cohort_taken
  FROM public.workshop_registrations
  WHERE cohort_id = _cohort_id
    AND status IN ('paid','confirmed')
    AND id <> _registration_id;

  IF _requested_tier = 'founders' AND founders_taken < c.founders_seats THEN
    chosen := 'founders';
    chosen_price := c.founders_price_cents;
  ELSIF cohort_taken < c.cohort_seats THEN
    chosen := 'cohort';
    chosen_price := c.cohort_price_cents;
  ELSIF _requested_tier = 'cohort' AND founders_taken < c.founders_seats THEN
    -- edge case: cohort tier requested but full while founders has room
    chosen := 'founders';
    chosen_price := c.founders_price_cents;
  ELSE
    RAISE EXCEPTION 'Cohort sold out';
  END IF;

  UPDATE public.workshop_registrations
     SET status = 'paid',
         assigned_tier = chosen,
         price_paid_cents = chosen_price,
         paid_at = COALESCE(paid_at, now())
   WHERE id = _registration_id;

  RETURN QUERY SELECT chosen, chosen_price;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_cohort_seat(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_cohort_seat(uuid, text, text) TO service_role;

-- 4) Keep cohorts.status / seats_left in sync with paid counts
CREATE OR REPLACE FUNCTION public.sync_cohort_seat_cache(_cohort_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c RECORD;
  paid_total integer;
  capacity integer;
  remaining integer;
  new_status text;
BEGIN
  SELECT founders_seats, cohort_seats INTO c
  FROM public.cohorts WHERE id = _cohort_id FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;

  capacity := c.founders_seats + c.cohort_seats;

  SELECT COUNT(*) INTO paid_total
  FROM public.workshop_registrations
  WHERE cohort_id = _cohort_id AND status IN ('paid','confirmed');

  remaining := GREATEST(capacity - paid_total, 0);

  IF remaining = 0 THEN
    new_status := 'sold_out';
  ELSIF paid_total > 0 OR remaining < capacity THEN
    new_status := 'filling';
  ELSE
    new_status := 'open';
  END IF;

  UPDATE public.cohorts
     SET status = new_status,
         seats_left = CASE WHEN new_status='filling' THEN remaining ELSE NULL END,
         updated_at = now()
   WHERE id = _cohort_id;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_cohort_seat_cache(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_cohort_seat_cache(text) TO service_role;

CREATE OR REPLACE FUNCTION public.trg_sync_cohort_seat_cache()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.cohort_id IS NOT NULL THEN
    PERFORM public.sync_cohort_seat_cache(NEW.cohort_id);
  END IF;
  IF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') AND OLD.cohort_id IS NOT NULL
     AND (TG_OP = 'DELETE' OR NEW.cohort_id IS DISTINCT FROM OLD.cohort_id) THEN
    PERFORM public.sync_cohort_seat_cache(OLD.cohort_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS workshop_registrations_sync_cohort ON public.workshop_registrations;
CREATE TRIGGER workshop_registrations_sync_cohort
AFTER INSERT OR UPDATE OR DELETE ON public.workshop_registrations
FOR EACH ROW EXECUTE FUNCTION public.trg_sync_cohort_seat_cache();
