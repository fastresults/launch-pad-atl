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

interface Props {
  firstName?: string | null
  startupName?: string | null
}

const Email = ({ firstName, startupName }: Props) => {
  const greeting = firstName ? `Thanks, ${firstName}!` : 'Thanks for reaching out!'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>We got your startup intake — someone will reach out to schedule a workshop.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar} />
          <Heading style={h1}>{greeting}</Heading>
          <Text style={lead}>
            We received your startup intake{startupName ? ` for ${startupName}` : ''} and a member
            of the {SITE_NAME} team will reach out within 1 business day to arrange your workshop.
          </Text>
          <Text style={text}>
            In the meantime, keep an eye on your inbox. If you can't wait, you can always
            register for an upcoming workshop directly and skip the queue.
          </Text>
          <Text style={signoff}>— The {SITE_NAME} team</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: "We got your startup intake",
  displayName: 'Member intake received',
  previewData: { firstName: 'Jordan', startupName: 'Acme' },
} satisfies TemplateEntry

const BRAND = '#3b82f6'
const TEXT = '#1f2937'
const MUTED = '#6b7280'
const main: React.CSSProperties = { backgroundColor: '#ffffff', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", margin: 0, padding: 0 }
const container: React.CSSProperties = { maxWidth: '560px', margin: '0 auto', padding: '32px 24px 40px' }
const brandBar: React.CSSProperties = { height: '4px', width: '48px', backgroundColor: BRAND, borderRadius: '2px', margin: '0 0 24px' }
const h1: React.CSSProperties = { fontSize: '24px', fontWeight: 700, color: TEXT, margin: '0 0 16px', lineHeight: 1.25 }
const lead: React.CSSProperties = { fontSize: '16px', color: TEXT, lineHeight: 1.55, margin: '0 0 8px' }
const text: React.CSSProperties = { fontSize: '15px', color: TEXT, lineHeight: 1.6, margin: '24px 0 0' }
const signoff: React.CSSProperties = { fontSize: '15px', color: MUTED, margin: '24px 0 0' }
