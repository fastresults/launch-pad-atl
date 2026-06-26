CREATE POLICY "Public read dashboard nav visibility"
ON public.site_settings
FOR SELECT
USING (key = 'dashboard_nav_visibility');