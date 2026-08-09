ALTER TABLE public.venture_snapshots DROP CONSTRAINT IF EXISTS venture_snapshots_track_check;

ALTER TABLE public.venture_snapshots
  ADD CONSTRAINT venture_snapshots_track_check
  CHECK (
    track IS NULL OR track = ANY (ARRAY[
      'lifestyle'::text,
      'ecommerce_dtc'::text,
      'scalable_tech'::text,
      'marketplace'::text,
      'deep_tech'::text,
      'social_impact'::text,
      'corporate'::text
    ])
  );