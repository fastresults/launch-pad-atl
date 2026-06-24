CREATE POLICY "Public read testimonial slider settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (key = 'testimonial_slider');
GRANT SELECT ON public.site_settings TO anon;