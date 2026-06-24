# Fix: grant admin to the reset account

## Diagnosis

Two separate accounts exist:

- `fastresults@gmail.com` → `super_admin` (the original admin)
- `fastresultsai@gmail.com` → `user` only (the account you just reset)

The password reset email went to `fastresultsai@gmail.com`, so after signing back in you landed on the non-admin account, which correctly fails the `/admin` gate.

## Change

Insert a `super_admin` row into `public.user_roles` for `e09d766a-3503-464b-905d-9f66d5833831` (`fastresultsai@gmail.com`), idempotent on `(user_id, role)`.

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('e09d766a-3503-464b-905d-9f66d5833831', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

No code, schema, or RLS changes. The existing `fastresults@gmail.com` super_admin is left alone — say the word if you want it demoted afterward.

## Verify

- Re-run the lookup query and confirm `fastresultsai@gmail.com` now shows `{user, super_admin}`.
- Sign in as `fastresultsai@gmail.com`, navigate to `/admin` — gate should pass.
