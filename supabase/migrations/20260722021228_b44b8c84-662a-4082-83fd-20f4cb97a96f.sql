UPDATE public.private_session_settings SET price_cents = 39700 WHERE id = 1;
ALTER TABLE public.private_session_settings ALTER COLUMN price_cents SET DEFAULT 39700;
ALTER TABLE public.private_session_bookings ALTER COLUMN amount_cents SET DEFAULT 39700;