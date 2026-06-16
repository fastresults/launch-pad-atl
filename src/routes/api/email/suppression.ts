import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'

// Suppression event payload sent by the Go API when Mailgun reports
// a bounce, complaint, or unsubscribe.
interface SuppressionPayload {
  email: string
  reason: 'bounce' | 'complaint' | 'unsubscribe'
  message_id?: string
  metadata?: Record<string, unknown>
  is_retry: boolean
  retry_count: number
}

function parseSuppressionPayload(body: string): SuppressionPayload {
  const parsed = JSON.parse(body)
  if (!parsed.data) {
    throw new Error('Missing data field in payload')
  }
  const data = parsed.data as SuppressionPayload
  if (!data.email || !data.reason) {
    throw new Error('Missing required fields: email, reason')
  }
  return data
}

function mapReasonToStatus(
  reason: string,
): 'bounced' | 'complained' | 'suppressed' {
  switch (reason) {
    case 'bounce':
      return 'bounced'
    case 'complaint':
      return 'complained'
    default:
      return 'suppressed'
  }
}

function mapReasonToMessage(reason: string): string {
  switch (reason) {
    case 'bounce':
      return 'Permanent bounce — email address is invalid or rejected'
    case 'complaint':
      return 'Spam complaint — recipient marked email as spam'
    case 'unsubscribe':
      return 'Recipient unsubscribed'
    default:
      return 'Email suppressed'
  }
}


async function verifyWebhook(request: Request, secret: string): Promise<{ body: string; payload: SuppressionPayload }> {
  const signature = request.headers.get('X-Signature-256') ?? request.headers.get('X-Hub-Signature-256') ?? ''
  const timestamp = request.headers.get('X-Timestamp') ?? ''
  const body = await request.text()

  if (!signature || !timestamp) {
    throw Object.assign(new Error('Missing signature headers'), { code: 'invalid_signature' })
  }

  const age = Math.abs(Date.now() - Number(timestamp) * 1000)
  if (age > 5 * 60 * 1000) {
    throw Object.assign(new Error('Stale timestamp'), { code: 'stale_timestamp' })
  }

  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(timestamp + '.' + body))
  const computed = 'sha256=' + Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')

  if (computed !== signature) {
    throw Object.assign(new Error('Invalid signature'), { code: 'invalid_signature' })
  }

  let payload: SuppressionPayload
  try {
    payload = parseSuppressionPayload(body)
  } catch {
    throw Object.assign(new Error('Invalid payload'), { code: 'invalid_payload' })
  }

  return { body, payload }
}

export const Route = createFileRoute("/api/email/suppression")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.WEBHOOK_SECRET
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!apiKey || !supabaseUrl || !supabaseServiceKey) {
          console.error('Missing required environment variables')
          return Response.json({ error: 'Server configuration error' }, { status: 500 })
        }

        // Verify HMAC signature using WEBHOOK_SECRET
        let payload: SuppressionPayload
        try {
          const verified = await verifyWebhook(request, apiKey)
          payload = verified.payload
        } catch (error: any) {
          const code = error?.code ?? 'unknown'
          if (code === 'stale_timestamp') {
            console.error('Stale webhook timestamp')
            return Response.json({ error: 'Stale timestamp' }, { status: 401 })
          }
          if (code === 'invalid_payload') {
            console.error('Invalid payload')
            return Response.json({ error: 'Invalid payload' }, { status: 400 })
          }
          console.error('Webhook verification failed', { code, message: error?.message })
          return Response.json({ error: 'Invalid signature' }, { status: 401 })
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const normalizedEmail = payload.email.toLowerCase()

        // 1. Upsert to suppressed_emails (idempotent — safe for retries)
        const { error: suppressError } = await supabase
          .from('suppressed_emails')
          .upsert(
            {
              email: normalizedEmail,
              reason: payload.reason,
              metadata: payload.metadata ?? null,
            },
            { onConflict: 'email' },
          )

        if (suppressError) {
          console.error('Failed to upsert suppressed email', {
            error: suppressError,
            email_redacted: normalizedEmail[0] + '***@' + normalizedEmail.split('@')[1],
          })
          return Response.json({ error: 'Failed to write suppression' }, { status: 500 })
        }

        // 2. Append a new log entry for the suppression event (never update existing rows)
        const sendLogStatus = mapReasonToStatus(payload.reason)
        const sendLogMessage = mapReasonToMessage(payload.reason)

        const { error: insertError } = await supabase
          .from('email_send_log')
          .insert({
            message_id: payload.message_id ?? null,
            template_name: 'system',
            recipient_email: normalizedEmail,
            status: sendLogStatus,
            error_message: sendLogMessage,
            metadata: payload.metadata ?? null,
          })

        if (insertError) {
          // Non-fatal — log and continue. The suppression was already recorded.
          console.warn('Failed to insert email_send_log', {
            error: insertError,
          })
        }

        console.log('Suppression processed', {
          email_redacted: normalizedEmail[0] + '***@' + normalizedEmail.split('@')[1],
          reason: payload.reason,
          is_retry: payload.is_retry,
          retry_count: payload.retry_count,
          has_message_id: !!payload.message_id,
        })

        return Response.json({ success: true })
      },
    },
  },
})
