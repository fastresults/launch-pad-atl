CREATE POLICY "Public read landing-only mode setting"
ON public.site_settings
FOR SELECT
TO anon, authenticated
USING (key = 'landing_only_mode');