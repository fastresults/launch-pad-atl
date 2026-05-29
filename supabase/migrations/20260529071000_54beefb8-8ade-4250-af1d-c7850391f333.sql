ALTER TABLE public.cohorts
  ADD COLUMN founders_display_floor_pct integer NOT NULL DEFAULT 25,
  ADD COLUMN cohort_display_floor_pct integer NOT NULL DEFAULT 25;

ALTER TABLE public.cohorts
  DROP COLUMN founders_display_floor,
  DROP COLUMN cohort_display_floor;