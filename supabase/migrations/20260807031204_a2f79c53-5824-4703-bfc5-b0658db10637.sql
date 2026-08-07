UPDATE public.brand_logo_directions
SET status = 'needs_review',
    current_stage = 'render_concept',
    retry_at = NULL,
    lease_token = NULL,
    lease_expires_at = NULL,
    last_error = NULL,
    error_class = NULL,
    updated_at = now()
WHERE status IN ('queued','vectorizing','retry_wait')
  AND render_status = 'ready'
  AND render_path IS NOT NULL;