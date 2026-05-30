import type { ComponentType } from 'react'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 *
 * Example:
 *   import { template as welcomeTemplate } from './welcome'
 *   // then add to TEMPLATES: 'welcome': welcomeTemplate
 */
import { template as applicationReceived } from './application-received'
import { template as inquiryReceived } from './inquiry-received'
import { template as inquiryAdminNotification } from './inquiry-admin-notification'
import { template as inquiryReply } from './inquiry-reply'
import { template as memberIntakeReceived } from './member-intake-received'
import { template as memberIntakeAdminNotification } from './member-intake-admin-notification'
import { template as memberApproved } from './member-approved'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'application-received': applicationReceived,
  'inquiry-received': inquiryReceived,
  'inquiry-admin-notification': inquiryAdminNotification,
  'inquiry-reply': inquiryReply,
  'member-intake-received': memberIntakeReceived,
  'member-intake-admin-notification': memberIntakeAdminNotification,
  'member-approved': memberApproved,
}
