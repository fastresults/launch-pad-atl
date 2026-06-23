
-- 1) attendee_deliverables: explicit owner write policies + admin manage
CREATE POLICY "Users insert own deliverables"
  ON public.attendee_deliverables FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own deliverables"
  ON public.attendee_deliverables FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own deliverables"
  ON public.attendee_deliverables FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all deliverables"
  ON public.attendee_deliverables FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 2) deliverable_revisions: explicit admin write policies (service_role bypasses RLS)
CREATE POLICY "Admins insert revisions"
  ON public.deliverable_revisions FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins update revisions"
  ON public.deliverable_revisions FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins delete revisions"
  ON public.deliverable_revisions FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- 3) deliverable_types: keep base table admin-only; expose safe metadata via a
-- view + security-definer function that omit prompt_template and output_schema.
CREATE OR REPLACE VIEW public.deliverable_types_public
WITH (security_invoker = on) AS
SELECT
  key,
  label,
  description,
  stage_label,
  stage_n,
  schema_version,
  default_model,
  depends_on_keys,
  sort_order,
  tier_required,
  active,
  created_at,
  requires_context_keys,
  produces_context_key,
  output_kind,
  user_can_trigger,
  auto_runnable
FROM public.deliverable_types;

GRANT SELECT ON public.deliverable_types_public TO authenticated;

CREATE OR REPLACE FUNCTION public.list_deliverable_types_public()
RETURNS TABLE (
  key text,
  label text,
  description text,
  stage_label text,
  stage_n integer,
  schema_version integer,
  default_model text,
  depends_on_keys text[],
  sort_order integer,
  tier_required text,
  active boolean,
  created_at timestamptz,
  requires_context_keys text[],
  produces_context_key text,
  output_kind text,
  user_can_trigger boolean,
  auto_runnable boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT key, label, description, stage_label, stage_n, schema_version,
         default_model, depends_on_keys, sort_order, tier_required, active,
         created_at, requires_context_keys, produces_context_key, output_kind,
         user_can_trigger, auto_runnable
    FROM public.deliverable_types
   WHERE active = true;
$$;

GRANT EXECUTE ON FUNCTION public.list_deliverable_types_public() TO authenticated;
