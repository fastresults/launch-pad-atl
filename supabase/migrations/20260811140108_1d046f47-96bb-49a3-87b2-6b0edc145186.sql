CREATE TYPE public.creative_review_state AS ENUM ('draft','in_review','changes_requested','approved','ready_to_publish');

CREATE TABLE public.venture_creative_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id uuid NOT NULL REFERENCES public.venture_snapshots(id) ON DELETE CASCADE,
  asset_kind text NOT NULL,
  asset_ref text NOT NULL,
  label text,
  preview_path text,
  state public.creative_review_state NOT NULL DEFAULT 'draft',
  submitted_at timestamptz,
  submitted_by text,
  decided_at timestamptz,
  decided_by text,
  last_comment text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (snapshot_id, asset_kind, asset_ref)
);

CREATE INDEX idx_creative_reviews_snapshot ON public.venture_creative_reviews (snapshot_id, asset_kind);

CREATE TABLE public.venture_creative_review_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.venture_creative_reviews(id) ON DELETE CASCADE,
  from_state public.creative_review_state,
  to_state public.creative_review_state NOT NULL,
  actor_kind text NOT NULL,
  actor_name text,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_creative_review_events_review ON public.venture_creative_review_events (review_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.venture_creative_reviews TO authenticated;
GRANT ALL ON public.venture_creative_reviews TO service_role;
GRANT SELECT, INSERT ON public.venture_creative_review_events TO authenticated;
GRANT ALL ON public.venture_creative_review_events TO service_role;

ALTER TABLE public.venture_creative_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venture_creative_review_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and admins manage creative reviews"
ON public.venture_creative_reviews FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.venture_snapshots s WHERE s.id = snapshot_id AND s.user_id = auth.uid())
  OR public.is_admin(auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.venture_snapshots s WHERE s.id = snapshot_id AND s.user_id = auth.uid())
  OR public.is_admin(auth.uid())
);

CREATE POLICY "Owners and admins read review history"
ON public.venture_creative_review_events FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.venture_creative_reviews r
    JOIN public.venture_snapshots s ON s.id = r.snapshot_id
    WHERE r.id = review_id AND (s.user_id = auth.uid() OR public.is_admin(auth.uid()))
  )
);

CREATE POLICY "Owners and admins write review history"
ON public.venture_creative_review_events FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.venture_creative_reviews r
    JOIN public.venture_snapshots s ON s.id = r.snapshot_id
    WHERE r.id = review_id AND (s.user_id = auth.uid() OR public.is_admin(auth.uid()))
  )
);

CREATE TRIGGER update_venture_creative_reviews_updated_at
BEFORE UPDATE ON public.venture_creative_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();