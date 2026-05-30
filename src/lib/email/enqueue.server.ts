import * as React from 'react'
import { render } from '@react-email/components'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { TEMPLATES } from '@/lib/email-templates/registry'

const SITE_NAME = 'Atlanta Startup Sprint'
const SENDER_DOMAIN = 'notify.startuplabs.online'
const FROM_DOMAIN = 'notify.startuplabs.online'

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

interface EnqueueParams {
  templateName: string
  recipientEmail: string
  idempotencyKey: string
  templateData?: Record<string, any>
  replyTo?: string
}

/**
 * Server-only: enqueue a transactional email without requiring a user JWT.
 * Use from public/unauthenticated server functions (e.g. founder applications).
 *
 * Does suppression check, unsubscribe token mgmt, template render, and pgmq enqueue.
 * Never throws — failures are logged so the calling action still completes.
 */
export async function enqueueTransactionalEmail(
  params: EnqueueParams,
): Promise<{ queued: boolean; reason?: string }> {
  const { templateName, recipientEmail, idempotencyKey } = params
  const templateData = params.templateData ?? {}
  const messageId = crypto.randomUUID()
  const normalized = recipientEmail.trim().toLowerCase()

  const template = TEMPLATES[templateName]
  if (!template) {
    console.error('[email] template not found', { templateName })
    return { queued: false, reason: 'template_not_found' }
  }

  // Suppression check
  const { data: suppressed } = await supabaseAdmin
    .from('suppressed_emails')
    .select('id')
    .eq('email', normalized)
    .maybeSingle()
  if (suppressed) {
    await supabaseAdmin.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: recipientEmail,
      status: 'suppressed',
    })
    return { queued: false, reason: 'suppressed' }
  }

  // Unsubscribe token (one per address)
  let unsubscribeToken: string
  const { data: existing } = await supabaseAdmin
    .from('email_unsubscribe_tokens')
    .select('token, used_at')
    .eq('email', normalized)
    .maybeSingle()

  if (existing?.token && !existing.used_at) {
    unsubscribeToken = existing.token
  } else if (!existing) {
    unsubscribeToken = generateToken()
    await supabaseAdmin
      .from('email_unsubscribe_tokens')
      .upsert(
        { token: unsubscribeToken, email: normalized },
        { onConflict: 'email', ignoreDuplicates: true },
      )
    const { data: stored } = await supabaseAdmin
      .from('email_unsubscribe_tokens')
      .select('token')
      .eq('email', normalized)
      .maybeSingle()
    if (!stored?.token) {
      console.error('[email] could not store unsubscribe token')
      return { queued: false, reason: 'token_failed' }
    }
    unsubscribeToken = stored.token
  } else {
    // already used → treat as suppressed
    return { queued: false, reason: 'already_unsubscribed' }
  }

  // Render
  let html: string
  let plainText: string
  try {
    const element = React.createElement(template.component, templateData)
    html = await render(element)
    plainText = await render(element, { plainText: true })
  } catch (err) {
    console.error('[email] render failed', { templateName, err })
    return { queued: false, reason: 'render_failed' }
  }

  const subject =
    typeof template.subject === 'function'
      ? template.subject(templateData)
      : template.subject

  await supabaseAdmin.from('email_send_log').insert({
    message_id: messageId,
    template_name: templateName,
    recipient_email: recipientEmail,
    status: 'pending',
  })

  const { error: enqueueError } = await supabaseAdmin.rpc('enqueue_email', {
    queue_name: 'transactional_emails',
    payload: {
      message_id: messageId,
      to: recipientEmail,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject,
      html,
      text: plainText,
      purpose: 'transactional',
      label: templateName,
      idempotency_key: idempotencyKey,
      unsubscribe_token: unsubscribeToken,
      reply_to: params.replyTo,
      queued_at: new Date().toISOString(),
    },
  })

  if (enqueueError) {
    console.error('[email] enqueue failed', enqueueError)
    await supabaseAdmin.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: recipientEmail,
      status: 'failed',
      error_message: 'Enqueue RPC failed',
    })
    return { queued: false, reason: 'enqueue_failed' }
  }

  return { queued: true }
}
