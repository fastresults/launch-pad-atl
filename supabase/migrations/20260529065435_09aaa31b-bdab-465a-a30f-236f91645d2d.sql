ALTER TABLE public.cohorts
  ADD COLUMN IF NOT EXISTS founders_display_floor integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS founders_warming_boost integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS founders_honest_threshold_pct integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS cohort_display_floor integer NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS cohort_warming_boost integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS cohort_honest_threshold_pct integer NOT NULL DEFAULT 50;

ALTER TABLE public.cohorts
  ADD CONSTRAINT cohorts_founders_threshold_range CHECK (founders_honest_threshold_pct BETWEEN 1 AND 100),
  ADD CONSTRAINT cohorts_cohort_threshold_range CHECK (cohort_honest_threshold_pct BETWEEN 1 AND 100),
  ADD CONSTRAINT cohorts_founders_floor_nonneg CHECK (founders_display_floor >= 0),
  ADD CONSTRAINT cohorts_cohort_floor_nonneg CHECK (cohort_display_floor >= 0),
  ADD CONSTRAINT cohorts_founders_boost_nonneg CHECK (founders_warming_boost >= 0),
  ADD CONSTRAINT cohorts_cohort_boost_nonneg CHECK (cohort_warming_boost >= 0);