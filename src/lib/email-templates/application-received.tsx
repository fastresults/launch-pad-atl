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
const SITE_URL = (process.env.SITE_URL || 'https://startuplabs.online').replace(/\/+$/, '')
const CONTACT_URL = `${SITE_URL}/contact`

interface ApplicationReceivedProps {
  firstName?: string
  fullName?: string
}

const ApplicationReceivedEmail = ({ firstName, fullName }: ApplicationReceivedProps) => {
  const displayName =
    (firstName && firstName.trim()) ||
    (fullName && fullName.trim().split(/\s+/)[0]) ||
    ''
  const greeting = displayName ? `Thanks, ${displayName}!` : 'Thanks for applying!'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>We received your {SITE_NAME} application — here's what happens next.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar} />
          <Heading style={h1}>{greeting}</Heading>
          <Text style={lead}>
            Your application for the {SITE_NAME} selection cohort is in. A real human on
            the selection team will read it — no autoresponders past this one.
          </Text>

          <Heading as="h2" style={h2}>What happens next</Heading>

          <Section style={stepRow}>
            <Text style={stepNum}>1</Text>
            <Text style={stepBody}>
              <strong style={stepTitle}>Review</strong>
              <br />
              Our selection team reviews every application within roughly 5 business days.
              We're looking for founders who are clearly committed to launching — not
              just exploring.
            </Text>
          </Section>

          <Section style={stepRow}>
            <Text style={stepNum}>2</Text>
            <Text style={stepBody}>
              <strong style={stepTitle}>Decision email</strong>
              <br />
              You'll get a direct email with one of: <em>selected</em>,
              {' '}<em>waitlisted</em>, or <em>not this cohort</em>. No guessing, no
              ghosting.
            </Text>
          </Section>

          <Section style={stepRow}>
            <Text style={stepNum}>3</Text>
            <Text style={stepBody}>
              <strong style={stepTitle}>If selected</strong>
              <br />
              You'll get instructions to confirm your seat plus a calendar invite for
              the cohort day. Seats are limited and given out first-come once you
              confirm.
            </Text>
          </Section>

          <Text style={text}>
            In the meantime, keep building. If something material about your startup
            changes — a new co-founder, first customer, a pivot — just reply to this
            email and we'll add it to your file.
          </Text>

          <Text style={text}>
            Have a question in the meantime?{' '}
            <Link href={CONTACT_URL} style={inlineLink}>
              Get in touch
            </Link>
            {' '}and a real person will reply within 1 business day.
          </Text>

          <Text style={signoff}>
            — The {SITE_NAME} team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: ApplicationReceivedEmail,
  subject: 'We got your Atlanta Startup Sprint application',
  displayName: 'Application received',
  previewData: { firstName: 'Jordan', fullName: 'Jordan Rivera' },
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
const h2: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 600,
  color: MUTED,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  margin: '32px 0 16px',
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
const stepRow: React.CSSProperties = {
  display: 'flex',
  gap: '14px',
  alignItems: 'flex-start',
  margin: '0 0 14px',
}
const stepNum: React.CSSProperties = {
  display: 'inline-block',
  width: '28px',
  height: '28px',
  flexShrink: 0,
  borderRadius: '14px',
  backgroundColor: BRAND,
  color: '#ffffff',
  textAlign: 'center',
  lineHeight: '28px',
  fontSize: '14px',
  fontWeight: 700,
  margin: 0,
}
const stepBody: React.CSSProperties = {
  fontSize: '15px',
  color: TEXT,
  lineHeight: 1.55,
  margin: 0,
}
const stepTitle: React.CSSProperties = {
  color: TEXT,
  fontWeight: 600,
}
const inlineLink: React.CSSProperties = {
  color: BRAND,
  textDecoration: 'underline',
}

