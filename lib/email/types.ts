/**
 * lib/email/types.ts
 * Tipos e interfaces para el servicio centralizado de correos de BarberOS.
 */

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
  tags?: Array<{ name: string; value: string }>
}

export interface EmailResult {
  success: boolean
  messageId?: string
  provider: 'resend' | 'smtp' | 'mock'
  error?: string
  simulated?: boolean
  timestamp: string
}

export interface EmailProviderStatus {
  configured: boolean
  provider: 'resend' | 'smtp' | 'none'
  fromEmail: string
  contactEmail: string
  details: string
}

// ─── Template Payload Types ──────────────────────────────────────────────────

export interface BarberInviteEmailParams {
  to: string
  barberName: string
  businessName: string
  inviteLink: string
  expiresHours?: number
}

export interface BranchAdminInviteEmailParams {
  to: string
  branchName: string
  companyName: string
  inviteLink: string
  expiresHours?: number
}

export interface PasswordResetEmailParams {
  to: string
  userName: string
  resetLink: string
  expiresMinutes?: number
}

export interface AppointmentConfirmationEmailParams {
  to: string
  clientName: string
  businessName: string
  barberName: string
  serviceName: string
  price: string | number
  date: string
  time: string
  reservationCode: string
  manageLink?: string
}

export interface AccountSecurityAlertEmailParams {
  to: string
  userName: string
  title: string
  description: string
  details?: Record<string, string>
  actionLink?: string
  actionLabel?: string
}

export interface SupportTicketCreatedEmailParams {
  to: string
  userName: string
  businessName: string
  ticketCode: string
  subject: string
  priority: string
  description: string
  ticketLink: string
}

export interface SupportTicketReplyEmailParams {
  to: string
  userName: string
  businessName: string
  ticketCode: string
  subject: string
  senderName: string
  replySnippet: string
  ticketLink: string
}

export interface SupportTicketResolvedEmailParams {
  to: string
  userName: string
  businessName: string
  ticketCode: string
  subject: string
  ticketLink: string
}
