GRANT INSERT ON public.workshop_registrations TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.workshop_registrations TO authenticated;
GRANT ALL ON public.workshop_registrations TO service_role;