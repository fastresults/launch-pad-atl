ALTER TABLE public.attendee_documents
  ADD COLUMN IF NOT EXISTS snapshot_id uuid NULL REFERENCES public.venture_snapshots(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS attendee_documents_user_snapshot_idx
  ON public.attendee_documents(user_id, snapshot_id);

UPDATE public.attendee_documents ad
   SET snapshot_id = vd.snapshot_id
  FROM public.venture_documents vd
 WHERE ad.source_venture_document_id = vd.id
   AND ad.snapshot_id IS NULL;