import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'Atlanta Startup Sprint'
const DASHBOARD_URL = 'https://startuplabs.online/dashboard'

interface Props {
  firstName?: string | null
  approvedVia?: 'admin' | 'payment'
}

const Email = ({ firstName, approvedVia }: Props) => {
  const greeting = firstName ? `You're in, ${firstName}.` : "You're in."
  const lead =
    approvedVia === 'payment'
      ? `Your workshop registration is confirmed and your ${SITE_NAME} dashboard is unlocked.`
      : `Your ${SITE_NAME} membership has been approved and your dashboard is now unlocked.`
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your dashboard is unlocked.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar} />
          <Heading style={h1}>{greeting}</Heading>
          <Text style={leadStyle}>{lead}</Text>
          <Section style={{ margin: '24px 0' }}>
            <Button href={DASHBOARD_URL} style={btn}>Open your dashboard</Button>
          </Section>
          <Text style={text}>If the button doesn't work, paste this into your browser: {DASHBOARD_URL}</Text>
          <Text style={signoff}>— The {SITE_NAME} team</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: "You're approved — your dashboard is unlocked",
  displayName: 'Member approved',
  previewData: { firstName: 'Jordan', approvedVia: 'admin' },
} satisfies TemplateEntry

const BRAND = '#3b82f6'
const TEXT = '#1f2937'
const MUTED = '#6b7280'
const main: React.CSSProperties = { backgroundColor: '#ffffff', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", margin: 0, padding: 0 }
const container: React.CSSProperties = { maxWidth: '560px', margin: '0 auto', padding: '32px 24px 40px' }
const brandBar: React.CSSProperties = { height: '4px', width: '48px', backgroundColor: BRAND, borderRadius: '2px', margin: '0 0 24px' }
const h1: React.CSSProperties = { fontSize: '24px', fontWeight: 700, color: TEXT, margin: '0 0 16px', lineHeight: 1.25 }
const leadStyle: React.CSSProperties = { fontSize: '16px', color: TEXT, lineHeight: 1.55, margin: '0 0 8px' }
const text: React.CSSProperties = { fontSize: '13px', color: MUTED, lineHeight: 1.6, margin: '12px 0 0' }
const signoff: React.CSSProperties = { fontSize: '15px', color: MUTED, margin: '24px 0 0' }
const btn: React.CSSProperties = { backgroundColor: BRAND, color: '#ffffff', padding: '12px 20px', borderRadius: '8px', fontSize: '15px', fontWeight: 600, textDecoration: 'none' }
