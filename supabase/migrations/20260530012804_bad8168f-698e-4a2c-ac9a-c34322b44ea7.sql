-- Founder profile (resume / LinkedIn / bio + extracted structure)
CREATE TABLE public.attendee_founder_profile (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  source text,
  source_file_path text,
  linkedin_url text,
  raw_text text,
  extracted jsonb NOT NULL DEFAULT '{}'::jsonb,
  right_person_reason text,
  unfair_advantage text,
  extracted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendee_founder_profile TO authenticated;
GRANT ALL ON public.attendee_founder_profile TO service_role;

ALTER TABLE public.attendee_founder_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own founder profile"
ON public.attendee_founder_profile
FOR SELECT TO authenticated
USING ((auth.uid() = user_id) OR is_admin(auth.uid()));

CREATE POLICY "Users insert own founder profile"
ON public.attendee_founder_profile
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own founder profile"
ON public.attendee_founder_profile
FOR UPDATE TO authenticated
USING ((auth.uid() = user_id) OR is_admin(auth.uid()));

CREATE TRIGGER update_attendee_founder_profile_updated_at
BEFORE UPDATE ON public.attendee_founder_profile
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Market profile (archetype, geography, channels, customer type)
CREATE TABLE public.attendee_market_profile (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  archetype text[] NOT NULL DEFAULT '{}'::text[],
  geography text,
  industry text,
  channels text[] NOT NULL DEFAULT '{}'::text[],
  customer_type text,
  market_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendee_market_profile TO authenticated;
GRANT ALL ON public.attendee_market_profile TO service_role;

ALTER TABLE public.attendee_market_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own market profile"
ON public.attendee_market_profile
FOR SELECT TO authenticated
USING ((auth.uid() = user_id) OR is_admin(auth.uid()));

CREATE POLICY "Users insert own market profile"
ON public.attendee_market_profile
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own market profile"
ON public.attendee_market_profile
FOR UPDATE TO authenticated
USING ((auth.uid() = user_id) OR is_admin(auth.uid()));

CREATE TRIGGER update_attendee_market_profile_updated_at
BEFORE UPDATE ON public.attendee_market_profile
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();