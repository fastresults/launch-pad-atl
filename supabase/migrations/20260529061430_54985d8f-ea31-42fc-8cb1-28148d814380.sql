
CREATE TABLE public.cohorts (
  id text PRIMARY KEY,
  cohort_date date NOT NULL UNIQUE,
  tz text NOT NULL DEFAULT 'EDT' CHECK (tz IN ('EDT','EST')),
  start_time time NOT NULL DEFAULT '08:00',
  end_time time NOT NULL DEFAULT '16:30',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('sold_out','filling','open')),
  seats_left int,
  venue_name text NOT NULL DEFAULT 'IGNITE Center at Greater Atlanta Christian School',
  venue_address text NOT NULL DEFAULT '1500 Indian Trail Lilburn Rd NW',
  venue_city text NOT NULL DEFAULT 'Norcross',
  venue_region text NOT NULL DEFAULT 'GA',
  venue_postal text NOT NULL DEFAULT '30093',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.cohorts TO anon, authenticated;
GRANT ALL ON public.cohorts TO service_role;

ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cohorts are publicly readable"
  ON public.cohorts FOR SELECT
  USING (true);

CREATE POLICY "Super admins insert cohorts"
  ON public.cohorts FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins update cohorts"
  ON public.cohorts FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins delete cohorts"
  ON public.cohorts FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_cohorts_updated_at
  BEFORE UPDATE ON public.cohorts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.cohorts (id, cohort_date, tz, status, seats_left, sort_order) VALUES
  ('2026-06-17', '2026-06-17', 'EDT', 'sold_out', NULL, 1),
  ('2026-07-15', '2026-07-15', 'EDT', 'filling', 6, 2),
  ('2026-08-19', '2026-08-19', 'EDT', 'open', NULL, 3),
  ('2026-09-16', '2026-09-16', 'EDT', 'open', NULL, 4),
  ('2026-10-21', '2026-10-21', 'EDT', 'open', NULL, 5),
  ('2026-11-18', '2026-11-18', 'EST', 'open', NULL, 6),
  ('2026-12-16', '2026-12-16', 'EST', 'open', NULL, 7),
  ('2027-01-20', '2027-01-20', 'EST', 'open', NULL, 8),
  ('2027-02-17', '2027-02-17', 'EST', 'open', NULL, 9),
  ('2027-03-17', '2027-03-17', 'EDT', 'open', NULL, 10),
  ('2027-04-21', '2027-04-21', 'EDT', 'open', NULL, 11),
  ('2027-05-19', '2027-05-19', 'EDT', 'open', NULL, 12);
