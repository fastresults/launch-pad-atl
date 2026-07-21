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
      (d + (i * 7), TIME '09:30', TIME '11:30', 'available'),
      (d + (i * 7), TIME '11:30', TIME '13:30', 'available'),
      (d + (i * 7), TIME '13:30', TIME '15:30', 'available'),
      (d + (i * 7), TIME '15:30', TIME '17:30', 'available')
    ON CONFLICT (session_date, start_time) DO NOTHING;
  END LOOP;
END;
$function$;