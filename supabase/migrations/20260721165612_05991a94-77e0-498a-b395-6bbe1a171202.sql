CREATE OR REPLACE FUNCTION public.ensure_private_session_slots()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  weeks int;
  d date;
  i int;
BEGIN
  SELECT weeks_ahead INTO weeks FROM public.private_session_settings WHERE id = 1;
  IF weeks IS NULL THEN weeks := 8; END IF;

  d := current_date + ((2 - EXTRACT(DOW FROM current_date)::int + 7) % 7);

  FOR i IN 0..(weeks - 1) LOOP
    INSERT INTO public.private_session_slots (session_date, start_time, end_time, status)
    VALUES
      (d + (i * 7), TIME '09:30', TIME '11:00', 'available'),
      (d + (i * 7), TIME '11:10', TIME '12:40', 'available'),
      (d + (i * 7), TIME '12:50', TIME '14:20', 'available'),
      (d + (i * 7), TIME '14:30', TIME '16:00', 'available')
    ON CONFLICT (session_date, start_time) DO NOTHING;
  END LOOP;
END;
$function$;

-- Remove future unbooked slots that don't match the new start times
DELETE FROM public.private_session_slots
 WHERE session_date >= current_date
   AND status = 'available'
   AND start_time NOT IN (TIME '09:30', TIME '11:10', TIME '12:50', TIME '14:30');

-- Seed the new rolling window
SELECT public.ensure_private_session_slots();
