ALTER TYPE public.venture_document_status ADD VALUE IF NOT EXISTS 'not_applicable';
ALTER TABLE public.venture_documents ADD COLUMN IF NOT EXISTS intake_source text;