import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'Atlanta Startup Sprint'

interface InquiryAdminNotificationProps {
  fromName?: string
  fromEmail?: string
  fromPhone?: string
  subject?: string
  message?: string
  inquiryUrl?: string
}

const InquiryAdminNotificationEmail = ({
  fromName,
  fromEmail,
  fromPhone,
  subject,
  message,
  inquiryUrl,
}: InquiryAdminNotificationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New inquiry from {fromName || 'someone'} — {subject || 'no subject'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar} />
        <Heading style={h1}>New inquiry</Heading>
        <Text style={lead}>Someone just submitted the contact form on {SITE_NAME}.</Text>

        <Section style={metaBox}>
          <Text style={metaRow}><strong>From:</strong> {fromName || '—'}</Text>
          <Text style={metaRow}><strong>Email:</strong> {fromEmail || '—'}</Text>
          {fromPhone ? <Text style={metaRow}><strong>Phone:</strong> {fromPhone}</Text> : null}
          <Text style={metaRow}><strong>Subject:</strong> {subject || '—'}</Text>
        </Section>

        <Heading as="h2" style={h2}>Message</Heading>
        <Text style={messageText}>{message || ''}</Text>

        {inquiryUrl ? (
          <Text style={text}>
            <Link href={inquiryUrl} style={btn}>Open in admin →</Link>
          </Text>
        ) : null}
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: InquiryAdminNotificationEmail,
  subject: (d: Record<string, any>) =>
    `New inquiry: ${d?.subject || 'no subject'}${d?.fromName ? ` — ${d.fromName}` : ''}`,
  displayName: 'Inquiry admin notification',
  previewData: {
    fromName: 'Jordan Lee',
    fromEmail: 'jordan@example.com',
    fromPhone: '+1 555 123 4567',
    subject: 'Question about the cohort',
    message: 'Hi — I wanted to ask about the next selection cohort dates and how to apply.',
    inquiryUrl: 'https://startuplabs.online/admin/inquiries/00000000-0000-0000-0000-000000000000',
  },
} satisfies TemplateEntry

const BRAND = '#3b82f6'
const TEXT = '#1f2937'
const MUTED = '#6b7280'

const main: React.CSSProperties = {
  backgroundColor: '#ffffff',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  margin: 0,
  padding: 0,
}
const container: React.CSSProperties = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '32px 24px 40px',
}
const brandBar: React.CSSProperties = {
  height: '4px',
  width: '48px',
  backgroundColor: BRAND,
  borderRadius: '2px',
  margin: '0 0 24px',
}
const h1: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 700,
  color: TEXT,
  margin: '0 0 12px',
}
const h2: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: MUTED,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  margin: '24px 0 8px',
}
const lead: React.CSSProperties = {
  fontSize: '15px',
  color: MUTED,
  lineHeight: 1.55,
  margin: '0 0 16px',
}
const metaBox: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '12px 16px',
  margin: '0 0 8px',
}
const metaRow: React.CSSProperties = {
  fontSize: '14px',
  color: TEXT,
  margin: '4px 0',
  lineHeight: 1.5,
}
const messageText: React.CSSProperties = {
  fontSize: '15px',
  color: TEXT,
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
  margin: 0,
}
const text: React.CSSProperties = {
  fontSize: '15px',
  color: TEXT,
  lineHeight: 1.6,
  margin: '24px 0 0',
}
const btn: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: BRAND,
  color: '#ffffff',
  padding: '10px 18px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: '14px',
}
