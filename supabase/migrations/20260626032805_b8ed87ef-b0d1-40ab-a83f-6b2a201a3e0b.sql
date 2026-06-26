ALTER TABLE public.attendee_documents
  ADD COLUMN IF NOT EXISTS source_venture_document_id uuid
    REFERENCES public.venture_documents(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS attendee_documents_source_venture_document_id_idx
  ON public.attendee_documents(source_venture_document_id);