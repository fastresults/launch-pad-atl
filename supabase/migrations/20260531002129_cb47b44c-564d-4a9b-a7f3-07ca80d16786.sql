ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_member_status_chk;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_member_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_member_status_chk CHECK (member_status IN ('pending','approved','rejected','paused'));