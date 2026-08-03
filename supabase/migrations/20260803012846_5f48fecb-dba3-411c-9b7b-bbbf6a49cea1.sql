GRANT SELECT ON public.founder_video_wall TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.founder_video_wall TO authenticated;
GRANT ALL ON public.founder_video_wall TO service_role;