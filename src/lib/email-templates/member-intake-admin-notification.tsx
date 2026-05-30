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

interface Props {
  memberName?: string
  memberEmail?: string
  startupType?: string
  startupName?: string | null
  oneLineIdea?: string
  supportingInfo?: string | null
}

const Email = (props: Props) => {
  const memberName = props.memberName ?? 'New member'
  const memberEmail = props.memberEmail ?? ''
  const startupType = props.startupType ?? '—'
  const { startupName, oneLineIdea, supportingInfo } = props
  return (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`New member intake from ${memberName}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar} />
        <Heading style={h1}>New member intake</Heading>
        <Text style={lead}>
          <strong>{memberName}</strong> ({memberEmail}) submitted a startup intake.
        </Text>
        <Section style={box}>
          <Row label="Startup type" value={startupType} />
          {startupName ? <Row label="Startup name" value={startupName} /> : null}
          <Row label="Idea" value={oneLineIdea ?? '—'} />
          {supportingInfo ? <Row label="Supporting info" value={supportingInfo} /> : null}
        </Section>
        <Text style={text}>Review and approve them in the admin members queue.</Text>
      </Container>
    </Body>
  </Html>
  )
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <>
    <Text style={rowLabel}>{label}</Text>
    <Text style={rowValue}>{value}</Text>
  </>
)

export const template = {
  component: Email,
  subject: (d) => `New member intake: ${d.memberName ?? 'New member'}`,
  displayName: 'Member intake (admin notification)',
  previewData: {
    memberName: 'Jordan Lee',
    memberEmail: 'jordan@example.com',
    startupType: 'tech-product',
    startupName: 'Acme',
    oneLineIdea: 'AI-driven invoicing for small contractors.',
    supportingInfo: 'Pre-revenue, talked to ~20 contractors.',
  },
} satisfies TemplateEntry

const BRAND = '#3b82f6'
const TEXT = '#1f2937'
const MUTED = '#6b7280'
const main: React.CSSProperties = { backgroundColor: '#ffffff', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", margin: 0, padding: 0 }
const container: React.CSSProperties = { maxWidth: '560px', margin: '0 auto', padding: '32px 24px 40px' }
const brandBar: React.CSSProperties = { height: '4px', width: '48px', backgroundColor: BRAND, borderRadius: '2px', margin: '0 0 24px' }
const h1: React.CSSProperties = { fontSize: '22px', fontWeight: 700, color: TEXT, margin: '0 0 16px', lineHeight: 1.25 }
const lead: React.CSSProperties = { fontSize: '15px', color: TEXT, lineHeight: 1.55, margin: '0 0 12px' }
const text: React.CSSProperties = { fontSize: '14px', color: TEXT, lineHeight: 1.6, margin: '20px 0 0' }
const box: React.CSSProperties = { border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 16px', margin: '12px 0' }
const rowLabel: React.CSSProperties = { fontSize: '11px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '8px 0 0' }
const rowValue: React.CSSProperties = { fontSize: '14px', color: TEXT, margin: '2px 0 8px', whiteSpace: 'pre-wrap' as const }
