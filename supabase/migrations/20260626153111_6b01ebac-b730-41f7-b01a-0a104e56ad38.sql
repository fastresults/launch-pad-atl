
CREATE TABLE public.deck_slide_overrides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deck_slug text NOT NULL,
  slide_id text NOT NULL,
  field text NOT NULL,
  value_text text,
  value_image_url text,
  value_image_alt text,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (deck_slug, slide_id, field)
);

GRANT SELECT ON public.deck_slide_overrides TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.deck_slide_overrides TO authenticated;
GRANT ALL ON public.deck_slide_overrides TO service_role;

ALTER TABLE public.deck_slide_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read deck overrides"
  ON public.deck_slide_overrides FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert deck overrides"
  ON public.deck_slide_overrides FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update deck overrides"
  ON public.deck_slide_overrides FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete deck overrides"
  ON public.deck_slide_overrides FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER trg_deck_slide_overrides_updated_at
  BEFORE UPDATE ON public.deck_slide_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_deck_slide_overrides_deck ON public.deck_slide_overrides (deck_slug);

CREATE TABLE public.deck_slide_override_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deck_slug text NOT NULL,
  slide_id text NOT NULL,
  field text NOT NULL,
  value_text text,
  value_image_url text,
  value_image_alt text,
  version integer NOT NULL DEFAULT 1,
  changed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.deck_slide_override_history TO authenticated;
GRANT INSERT ON public.deck_slide_override_history TO authenticated;
GRANT ALL ON public.deck_slide_override_history TO service_role;

ALTER TABLE public.deck_slide_override_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read deck override history"
  ON public.deck_slide_override_history FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert deck override history"
  ON public.deck_slide_override_history FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX idx_deck_slide_override_history_lookup
  ON public.deck_slide_override_history (deck_slug, slide_id, field, created_at DESC);
