# Fix: Site Settings toggles fail with "Could not find the table"

## Forensic findings

1. **Root cause**: The `public.site_settings` table does not exist in the database. Verified via `information_schema.tables` — zero rows. The earlier migration that was supposed to create it never actually executed (it was drafted but the SQL never landed in Postgres).
2. **Symptom**: Every call to `updateSiteSetting` (Original ⇄ Selection toggles) hits PostgREST, which checks its schema cache, finds no `site_settings`, and returns `Could not find the table 'public.site_settings' in the schema cache`. The toast surfaces that error verbatim.
3. **Code is correct**: `src/lib/site-settings.functions.ts` and `src/routes/_authenticated/_admin/admin.site.tsx` reference the table as designed. The selection cohort row (`id = '2026-07-15'`, date 2026-07-23) already exists — that side is healthy.
4. **No other related drift**: `applications.functions.ts` points at the correct cohort id (`2026-07-15`). Nothing else needs touching.

## Fix

A single migration that re-creates the missing table with the structure and policies originally specified:

```sql
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site settings are publicly readable"
  ON public.site_settings FOR SELECT
  USING (true);
-- Writes go through the super-admin-gated server fn using supabaseAdmin,
-- so no INSERT/UPDATE policy for end users.

-- Seed defaults so the loader has something to read
INSERT INTO public.site_settings (key, value) VALUES
  ('home_variant',     '"original"'::jsonb),
  ('register_variant', '"original"'::jsonb);
```

Public read is intentional: the homepage and `/register` need to know which variant to render before the user authenticates. No PII lives here — just two enum strings.

## Verification

After the migration runs:
1. Reload `/admin/site` — toggle from Original → Selection. Expect no error, "Saved" feedback.
2. Reload `/` — confirm the chosen variant renders.
3. Toggle back and re-verify.

## Out of scope

No code changes required. The components, server functions, and cohort seed are already correct.
