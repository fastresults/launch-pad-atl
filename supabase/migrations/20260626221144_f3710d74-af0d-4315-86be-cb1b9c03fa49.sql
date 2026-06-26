ALTER TABLE public.attendee_documents
  ADD COLUMN IF NOT EXISTS extracted_text text,
  ADD COLUMN IF NOT EXISTS extracted_at timestamptz,
  ADD COLUMN IF NOT EXISTS extraction_error text,
  ADD COLUMN IF NOT EXISTS used_in_brief boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS attendee_documents_user_snapshot_idx
  ON public.attendee_documents (user_id, snapshot_id);