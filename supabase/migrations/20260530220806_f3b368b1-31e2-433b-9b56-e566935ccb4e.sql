
-- 1. Add member_status fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS member_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_via text,
  ADD COLUMN IF NOT EXISTS rejected_reason text,
  ADD CONSTRAINT profiles_member_status_chk CHECK (member_status IN ('pending','approved','rejected')),
  ADD CONSTRAINT profiles_approved_via_chk CHECK (approved_via IS NULL OR approved_via IN ('admin','payment'));

-- 2. Add user_id link on workshop_registrations
ALTER TABLE public.workshop_registrations
  ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS workshop_registrations_user_id_idx ON public.workshop_registrations(user_id);
CREATE INDEX IF NOT EXISTS workshop_registrations_email_lower_idx ON public.workshop_registrations(lower(email));

-- 3. member_intakes table
CREATE TABLE IF NOT EXISTS public.member_intakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  startup_type text NOT NULL,
  startup_name text,
  one_line_idea text NOT NULL,
  supporting_info text,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','contacted','converted','closed')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewer_id uuid,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_intakes TO authenticated;
GRANT ALL ON public.member_intakes TO service_role;

ALTER TABLE public.member_intakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own intake" ON public.member_intakes
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_admin(auth.uid()));
CREATE POLICY "Users insert own intake" ON public.member_intakes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own intake" ON public.member_intakes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id OR is_admin(auth.uid()));
CREATE POLICY "Admins delete intake" ON public.member_intakes
  FOR DELETE TO authenticated USING (is_admin(auth.uid()));

CREATE TRIGGER trg_member_intakes_updated_at
  BEFORE UPDATE ON public.member_intakes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Auto-approval trigger on workshop_registrations
CREATE OR REPLACE FUNCTION public.auto_approve_member_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  IF NEW.status NOT IN ('paid','confirmed') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  target_user_id := NEW.user_id;
  IF target_user_id IS NULL AND NEW.email IS NOT NULL THEN
    SELECT user_id INTO target_user_id
      FROM public.profiles
     WHERE lower(email) = lower(NEW.email)
     LIMIT 1;
  END IF;

  IF target_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.profiles
     SET member_status = 'approved',
         approved_at = COALESCE(approved_at, now()),
         approved_via = COALESCE(approved_via, 'payment')
   WHERE user_id = target_user_id
     AND member_status <> 'approved';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_approve_member ON public.workshop_registrations;
CREATE TRIGGER trg_auto_approve_member
  AFTER INSERT OR UPDATE ON public.workshop_registrations
  FOR EACH ROW EXECUTE FUNCTION public.auto_approve_member_on_payment();

-- 5. Backfill: approve existing admins, and existing users with paid registrations
UPDATE public.profiles p
   SET member_status = 'approved',
       approved_at = COALESCE(p.approved_at, now()),
       approved_via = COALESCE(p.approved_via, 'admin')
  FROM public.user_roles ur
 WHERE ur.user_id = p.user_id
   AND ur.role IN ('admin','super_admin')
   AND p.member_status <> 'approved';

UPDATE public.profiles p
   SET member_status = 'approved',
       approved_at = COALESCE(p.approved_at, now()),
       approved_via = COALESCE(p.approved_via, 'payment')
  FROM public.workshop_registrations wr
 WHERE wr.status IN ('paid','confirmed')
   AND lower(wr.email) = lower(p.email)
   AND p.member_status <> 'approved';

-- 6. Update handle_new_user to keep default pending (no change to logic; trigger uses default)
-- (handle_new_user does not set member_status, so default 'pending' applies — no edit needed.)
