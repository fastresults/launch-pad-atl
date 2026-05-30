import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'Atlanta Startup Sprint'

interface InquiryReplyProps {
  firstName?: string
  subject?: string
  body?: string
  agentName?: string
}

const InquiryReplyEmail = ({ firstName, subject, body, agentName }: InquiryReplyProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{subject ? `Re: ${subject}` : `A reply from ${SITE_NAME}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar} />
        <Heading style={h1}>{firstName ? `Hi ${firstName},` : 'Hi,'}</Heading>
        <Text style={messageText}>{body || ''}</Text>
        <Text style={signoff}>
          — {agentName || `The ${SITE_NAME} team`}
        </Text>
        <Text style={hint}>
          You can reply directly to this email to continue the conversation.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: InquiryReplyEmail,
  subject: (d: Record<string, any>) =>
    d?.subject ? `Re: ${d.subject}` : `A reply from ${SITE_NAME}`,
  displayName: 'Inquiry reply',
  previewData: {
    firstName: 'Jordan',
    subject: 'Question about the cohort',
    body: 'Thanks for reaching out! The next selection cohort opens July 15. Here are the details…',
    agentName: 'Alex',
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
  fontSize: '20px',
  fontWeight: 600,
  color: TEXT,
  margin: '0 0 16px',
}
const messageText: React.CSSProperties = {
  fontSize: '15px',
  color: TEXT,
  lineHeight: 1.65,
  whiteSpace: 'pre-wrap',
  margin: 0,
}
const signoff: React.CSSProperties = {
  fontSize: '15px',
  color: TEXT,
  margin: '24px 0 0',
}
const hint: React.CSSProperties = {
  fontSize: '12px',
  color: MUTED,
  margin: '32px 0 0',
  borderTop: '1px solid #e5e7eb',
  paddingTop: '12px',
}
