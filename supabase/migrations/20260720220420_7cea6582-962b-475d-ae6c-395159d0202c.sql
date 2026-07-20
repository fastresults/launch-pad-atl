INSERT INTO public.cohorts (id, cohort_date, tz, status, sort_order)
VALUES ('2026-08-20', '2026-08-20', 'EDT', 'open', 3)
ON CONFLICT (id) DO UPDATE SET cohort_date='2026-08-20', status='open', sort_order=3;