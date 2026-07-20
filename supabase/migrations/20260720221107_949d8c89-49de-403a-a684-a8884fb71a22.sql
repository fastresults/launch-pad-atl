-- Remove stale/duplicate Foundation cohorts so Aug 20, 2026 is the next open cohort.
DELETE FROM public.cohorts WHERE id IN ('2026-07-15', '2026-08-19');
UPDATE public.cohorts SET sort_order = 2 WHERE id = '2026-08-20';