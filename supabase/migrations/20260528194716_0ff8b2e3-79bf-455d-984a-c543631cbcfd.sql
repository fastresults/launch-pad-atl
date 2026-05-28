
drop policy if exists "anyone can register" on public.workshop_registrations;
revoke insert on public.workshop_registrations from anon, authenticated;
