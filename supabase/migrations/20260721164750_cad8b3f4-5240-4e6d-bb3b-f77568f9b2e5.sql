CREATE OR REPLACE FUNCTION public.get_upcoming_private_session_slots()
 RETURNS TABLE(id uuid, session_date date, start_time time without time zone, end_time time without time zone, status text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
    SELECT s.id, s.session_date, s.start_time, s.end_time,
           CASE
             WHEN s.status = 'booked' AND s.hold_expires_at IS NOT NULL AND s.hold_expires_at < now()
               THEN 'available'
             ELSE s.status
           END AS status
      FROM public.private_session_slots s
     WHERE s.session_date >= (now() AT TIME ZONE 'America/New_York')::date
       AND (
         s.session_date > (now() AT TIME ZONE 'America/New_York')::date
         OR ((s.session_date + s.end_time) AT TIME ZONE 'America/New_York') > now()
       )
     ORDER BY s.session_date, s.start_time;
END;
$function$;