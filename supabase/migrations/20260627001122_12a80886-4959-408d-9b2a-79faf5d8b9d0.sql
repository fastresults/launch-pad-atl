-- Hardening Package A — F8
-- Revoke INSERT on deck_slide_override_history from authenticated.
-- History rows are only ever written server-side via service_role from edge
-- functions; the broad GRANT INSERT to authenticated combined with the
-- WITH CHECK is_admin() policy was defense-in-depth gap (RLS blocks today,
-- but the privilege should not exist at all).

REVOKE INSERT ON public.deck_slide_override_history FROM authenticated;

-- Also drop the now-redundant INSERT policy since no role other than
-- service_role has the underlying grant.
DROP POLICY IF EXISTS "Admins can insert deck override history" ON public.deck_slide_override_history;