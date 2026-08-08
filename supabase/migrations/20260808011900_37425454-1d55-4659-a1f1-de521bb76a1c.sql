REVOKE EXECUTE ON FUNCTION public.venture_share_slug_available(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.venture_share_slug_available(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.venture_share_slug_available(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.venture_share_slug_available(text) TO service_role;