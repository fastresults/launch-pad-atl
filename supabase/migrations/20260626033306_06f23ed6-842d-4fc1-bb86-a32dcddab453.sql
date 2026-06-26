-- Backfill attendee_documents.source_venture_document_id by matching
-- original_name -> venture_documents.document_type for the same user.
WITH normalized AS (
  SELECT
    ad.id AS doc_id,
    ad.user_id,
    ad.created_at,
    lower(
      regexp_replace(
        regexp_replace(ad.original_name, '\.docx$', '', 'i'),
        '\s*\(v\d+\)\s*$', '', 'i'
      )
    ) AS norm_label
  FROM public.attendee_documents ad
  WHERE ad.kind = 'deliverable'
    AND ad.source_venture_document_id IS NULL
), candidates AS (
  SELECT
    n.doc_id,
    vd.id AS venture_doc_id,
    vd.created_at AS vd_created_at,
    n.created_at AS ad_created_at,
    ROW_NUMBER() OVER (
      PARTITION BY n.doc_id
      ORDER BY ABS(EXTRACT(EPOCH FROM (vd.created_at - n.created_at))) ASC
    ) AS rn
  FROM normalized n
  JOIN public.venture_snapshots vs ON vs.user_id = n.user_id
  JOIN public.venture_documents vd
    ON vd.snapshot_id = vs.id
   AND replace(lower(vd.document_type), '_', ' ') = n.norm_label
)
UPDATE public.attendee_documents ad
   SET source_venture_document_id = c.venture_doc_id
  FROM candidates c
 WHERE c.rn = 1
   AND ad.id = c.doc_id;