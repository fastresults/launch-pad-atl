ALTER TABLE public.workshop_waitlist
  ADD COLUMN IF NOT EXISTS format text NOT NULL DEFAULT 'workshop';

ALTER TABLE public.workshop_waitlist
  ADD CONSTRAINT workshop_waitlist_format_check
  CHECK (format IN ('workshop', 'course'));