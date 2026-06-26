
REVOKE EXECUTE ON FUNCTION public.verify_bulk_unlock(uuid, uuid, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_set_bulk_unlock_default(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_clear_bulk_unlock_default() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_bulk_unlock(uuid, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_clear_user_bulk_unlock(uuid) FROM anon, PUBLIC;
