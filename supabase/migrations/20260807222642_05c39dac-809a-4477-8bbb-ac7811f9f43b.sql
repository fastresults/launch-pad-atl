CREATE TABLE public.venture_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id uuid NOT NULL REFERENCES public.venture_snapshots(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  title text,
  excluded_keys text[] NOT NULL DEFAULT '{}',
  password_hash text,
  expires_at timestamptz,
  revoked_at timestamptz,
  view_count integer NOT NULL DEFAULT 0,
  last_viewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_venture_shares_snapshot ON public.venture_shares(snapshot_id);
CREATE INDEX idx_venture_shares_user ON public.venture_shares(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.venture_shares TO authenticated;
GRANT ALL ON public.venture_shares TO service_role;

ALTER TABLE public.venture_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their venture shares"
  ON public.venture_shares FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE TRIGGER venture_shares_updated_at
  BEFORE UPDATE ON public.venture_shares
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();