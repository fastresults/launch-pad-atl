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

interface InquiryReceivedProps {
  firstName?: string
  subject?: string
}

const InquiryReceivedEmail = ({ firstName, subject }: InquiryReceivedProps) => {
  const greeting = firstName ? `Thanks, ${firstName}!` : 'Thanks for reaching out!'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>We got your message — a real human will reply within 1 business day.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar} />
          <Heading style={h1}>{greeting}</Heading>
          <Text style={lead}>
            We received your message to the {SITE_NAME} team and a real person will
            get back to you within 1 business day.
          </Text>
          {subject ? (
            <Section style={quoteBox}>
              <Text style={quoteLabel}>Your message</Text>
              <Text style={quoteSubject}>{subject}</Text>
            </Section>
          ) : null}
          <Text style={text}>
            No need to reply to this confirmation — we'll be in touch shortly.
          </Text>
          <Text style={signoff}>— The {SITE_NAME} team</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: InquiryReceivedEmail,
  subject: 'We got your message',
  displayName: 'Inquiry received (confirmation)',
  previewData: { firstName: 'Jordan', subject: 'Question about the cohort' },
} satisfies TemplateEntry

const BRAND = '#3b82f6'
const TEXT = '#1f2937'
const MUTED = '#6b7280'

const main: React.CSSProperties = {
  backgroundColor: '#ffffff',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
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
  fontSize: '24px',
  fontWeight: 700,
  color: TEXT,
  margin: '0 0 16px',
  lineHeight: 1.25,
}
const lead: React.CSSProperties = {
  fontSize: '16px',
  color: TEXT,
  lineHeight: 1.55,
  margin: '0 0 8px',
}
const text: React.CSSProperties = {
  fontSize: '15px',
  color: TEXT,
  lineHeight: 1.6,
  margin: '24px 0 0',
}
const signoff: React.CSSProperties = {
  fontSize: '15px',
  color: MUTED,
  margin: '24px 0 0',
}
const quoteBox: React.CSSProperties = {
  borderLeft: `3px solid ${BRAND}`,
  padding: '8px 14px',
  margin: '20px 0 0',
  backgroundColor: '#f9fafb',
}
const quoteLabel: React.CSSProperties = {
  fontSize: '11px',
  color: MUTED,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  margin: 0,
}
const quoteSubject: React.CSSProperties = {
  fontSize: '15px',
  color: TEXT,
  fontWeight: 600,
  margin: '4px 0 0',
}
