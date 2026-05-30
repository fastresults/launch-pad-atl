## Root cause

Submitting the free cohort application fails with a generic "Could not save your application" message. The server log shows the real error:

```
code: 23514
message: new row for relation "workshop_registrations" violates check constraint "workshop_registrations_status_check"
```

`submitFounderApplication` inserts `status: "applied"`, but the existing check constraint only allows `pending | paid | confirmed | refunded | cancelled`. The selection flow was added without updating the constraint.

## Fix

One migration on `public.workshop_registrations`:

1. Drop `workshop_registrations_status_check`.
2. Recreate it allowing the selection lifecycle in addition to the paid lifecycle:
   `applied | selected | waitlisted | declined | pending | paid | confirmed | refunded | cancelled`.

Including `selected | waitlisted | declined` now so the admin selection decisions on July 15 don't hit the same wall.

No code changes required — `submitFounderApplication` already inserts `"applied"`, and `RegisterSelection.tsx` already surfaces the server error if anything else goes wrong.

## Verification

- Resubmit the application form from `/register` → row lands in `workshop_registrations` with `status='applied'`.
- Confirm existing paid flow (`reserve_cohort_seat` setting `status='paid'`) still passes the new constraint.
