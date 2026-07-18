
-- Phase 1 continuation: lock down system-only maintenance function.
-- sweep_stuck_generations is invoked by a scheduled cron/edge function only.
-- It should not be reachable from client sessions.
REVOKE EXECUTE ON FUNCTION public.sweep_stuck_generations() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sweep_stuck_generations() TO service_role;
