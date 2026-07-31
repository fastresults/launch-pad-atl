import { supabase } from "@/integrations/supabase/client";
import { invokeEdge } from "@/lib/edge-invoke";

interface EnqueueParams {
  templateName: string
  recipientEmail: string
  idempotencyKey: string
  templateData?: Record<string, any>
  replyTo?: string
}

/**
 * Enqueues an app email by calling the trusted backend email function.
 * All protected email work happens server-side so browser RLS cannot block sends.
 */
export async function enqueueTransactionalEmail(
  params: EnqueueParams,
): Promise<{ queued: boolean; reason?: string }> {
  const { data, error } = await invokeEdge('send-transactional-email', {
    body: {
      templateName: params.templateName,
      recipientEmail: params.recipientEmail,
      idempotencyKey: params.idempotencyKey,
      templateData: params.templateData ?? {},
      replyTo: params.replyTo,
    },
  })

  if (error) {
    console.error('[email] backend enqueue failed', error)
    return { queued: false, reason: error.message || 'function_failed' }
  }

  return {
    queued: Boolean(data?.queued || data?.success),
    reason: data?.reason,
  }
}
