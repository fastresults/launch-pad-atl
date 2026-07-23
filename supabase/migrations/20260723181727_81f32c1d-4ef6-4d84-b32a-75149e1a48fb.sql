DROP POLICY IF EXISTS "Anyone can submit an inquiry" ON public.inquiries;

CREATE POLICY "Public visitors can submit valid inquiries"
ON public.inquiries
FOR INSERT
TO anon, authenticated
WITH CHECK (
  name IS NOT NULL
  AND length(btrim(name)) BETWEEN 2 AND 160
  AND email IS NOT NULL
  AND length(btrim(email)) BETWEEN 5 AND 254
  AND email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  AND subject IS NOT NULL
  AND length(btrim(subject)) BETWEEN 2 AND 240
  AND message IS NOT NULL
  AND length(btrim(message)) BETWEEN 5 AND 5000
  AND status = 'new'
  AND assigned_to IS NULL
);