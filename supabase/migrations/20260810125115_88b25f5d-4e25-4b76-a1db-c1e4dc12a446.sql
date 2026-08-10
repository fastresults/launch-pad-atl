CREATE TABLE public.ai_capacity_notices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  snapshot_id uuid REFERENCES public.venture_snapshots(id) ON DELETE SET NULL,
  context_label text,
  error_code text,
  providers text[] NOT NULL DEFAULT '{}',
  note text,
  status text NOT NULL DEFAULT 'open',
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_capacity_notices_user_created_idx ON public.ai_capacity_notices (user_id, created_at DESC);
CREATE INDEX ai_capacity_notices_status_idx ON public.ai_capacity_notices (status, created_at DESC);

GRANT SELECT, INSERT ON public.ai_capacity_notices TO authenticated;
GRANT ALL ON public.ai_capacity_notices TO service_role;

ALTER TABLE public.ai_capacity_notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own capacity notices"
  ON public.ai_capacity_notices FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users can create their own capacity notices"
  ON public.ai_capacity_notices FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update capacity notices"
  ON public.ai_capacity_notices FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));