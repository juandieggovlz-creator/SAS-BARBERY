/**
 * lib/email/index.ts
 * Exportaciones públicas del módulo de correo de BarberOS.
 */

export * from './types'
export {
  OFFICIAL_CONTACT_EMAIL,
  sendEmail,
  getEmailProviderStatus,
  sendBarberInviteEmail,
  sendBranchAdminInviteEmail,
  sendPasswordResetEmail,
  sendAppointmentConfirmationEmail,
  sendAccountSecurityAlertEmail,
  sendSupportTicketCreatedEmail,
  sendSupportTicketReplyEmail,
  sendSupportTicketResolvedEmail
} from './email-service'
export { renderMasterEmailLayout } from './templates/layout'
export * from './templates'
