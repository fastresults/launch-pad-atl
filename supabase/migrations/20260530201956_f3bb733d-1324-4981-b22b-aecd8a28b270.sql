
-- Inquiries: public contact/inquiry submissions with admin reply threads

CREATE TABLE public.inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  assigned_to UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT inquiries_status_check CHECK (status IN ('new','in_progress','replied','closed'))
);

CREATE INDEX idx_inquiries_status ON public.inquiries(status);
CREATE INDEX idx_inquiries_last_activity ON public.inquiries(last_activity_at DESC);

GRANT INSERT ON public.inquiries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inquiries TO authenticated;
GRANT ALL ON public.inquiries TO service_role;

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit an inquiry"
  ON public.inquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins read inquiries"
  ON public.inquiries FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins update inquiries"
  ON public.inquiries FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins delete inquiries"
  ON public.inquiries FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_inquiries_updated_at
  BEFORE UPDATE ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Thread messages (inbound = original submission / pasted-in replies; outbound = admin replies)
CREATE TABLE public.inquiry_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inquiry_id UUID NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  direction TEXT NOT NULL,
  author_id UUID,
  author_name TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT inquiry_messages_direction_check CHECK (direction IN ('inbound','outbound'))
);

CREATE INDEX idx_inquiry_messages_inquiry ON public.inquiry_messages(inquiry_id, created_at);

GRANT SELECT, INSERT ON public.inquiry_messages TO authenticated;
GRANT ALL ON public.inquiry_messages TO service_role;

ALTER TABLE public.inquiry_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read inquiry messages"
  ON public.inquiry_messages FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins insert inquiry messages"
  ON public.inquiry_messages FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
