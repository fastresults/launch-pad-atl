## Problem

`workshop_registrations` has correct RLS policies (including "Anyone can submit a registration" for anon+authenticated), but the table has **no GRANTs** for `anon`, `authenticated`, or `service_role`. PostgREST therefore returns `permission denied for table workshop_registrations` before RLS is even evaluated.

## Fix

Run a migration to add the missing Data API grants:

```sql
GRANT INSERT ON public.workshop_registrations TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.workshop_registrations TO authenticated;
GRANT ALL ON public.workshop_registrations TO service_role;
```

This matches the existing policies: anon can only INSERT; authenticated users get full CRUD gated by RLS (own rows / admin); edge functions use service_role.

No code changes required.