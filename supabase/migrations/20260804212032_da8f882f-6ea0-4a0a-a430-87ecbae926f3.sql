CREATE TABLE public.workshop_waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  workshop_slug TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT INSERT ON public.workshop_waitlist TO anon;
GRANT INSERT, SELECT ON public.workshop_waitlist TO authenticated;
GRANT ALL ON public.workshop_waitlist TO service_role;

ALTER TABLE public.workshop_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join the workshop waitlist"
ON public.workshop_waitlist FOR INSERT TO anon, authenticated
WITH CHECK (char_length(email) BETWEEN 3 AND 320 AND char_length(workshop_slug) BETWEEN 2 AND 80);

CREATE POLICY "Admins can view the workshop waitlist"
ON public.workshop_waitlist FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE INDEX workshop_waitlist_slug_idx ON public.workshop_waitlist (workshop_slug, created_at DESC);