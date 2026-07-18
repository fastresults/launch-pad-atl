-- Phase 1 · SECURITY DEFINER lockdown
-- Shrinks the attack surface flagged by DB linter WARNs 5–41.

-- Trigger-only: never needs API EXECUTE
REVOKE EXECUTE ON FUNCTION public.auto_approve_member_on_payment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_sync_cohort_seat_cache() FROM PUBLIC, anon, authenticated;

-- Authenticated-only RPCs: revoke anon, keep authenticated
REVOKE EXECUTE ON FUNCTION public.admin_set_user_role(uuid, app_role, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_set_user_role(uuid, app_role, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.start_impersonation(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.start_impersonation(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.end_impersonation(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.end_impersonation(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.purge_founder_generated_assets(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.purge_founder_generated_assets(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.purge_founder_generated_assets(uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.purge_founder_generated_assets(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.reset_founder_workspace(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.reset_founder_workspace(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.sweep_stuck_generations() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.sweep_stuck_generations() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.match_founder_brain_memory(uuid, vector, integer) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.match_founder_brain_memory(uuid, vector, integer) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.match_founder_brain_memory(uuid, vector, integer, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.match_founder_brain_memory(uuid, vector, integer, uuid) TO authenticated;
