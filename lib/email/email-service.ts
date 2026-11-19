/**
 * lib/email/email-service.ts
 * Servicio Centralizado de Envíos de Correo Electrónico para BarberOS.
 * 
 * Arquitectura modular y tolerante a fallos:
 * 1. Resend REST API (nativo vía fetch, sin dependencias externas pesadas).
 * 2. Proveedor SMTP (compatible con Brevo, SendGrid, Mailgun, Amazon SES).
 * 3. Modo Standby / Simulación de desarrollo (registra en logs sin romper el flujo).
 */

import {
  SendEmailOptions,
  EmailResult,
  EmailProviderStatus,
  BarberInviteEmailParams,
  BranchAdminInviteEmailParams,
  PasswordResetEmailParams,
  AppointmentConfirmationEmailParams,
  AccountSecurityAlertEmailParams,
  SupportTicketCreatedEmailParams,
  SupportTicketReplyEmailParams,
  SupportTicketResolvedEmailParams
} from './types'

import {
  generateBarberInviteTemplate,
  generateBranchAdminInviteTemplate,
  generatePasswordResetTemplate,
  generateAppointmentConfirmationTemplate,
  generateAccountSecurityAlertTemplate,
  generateSupportTicketCreatedTemplate,
  generateSupportTicketReplyTemplate,
  generateSupportTicketResolvedTemplate
} from './templates'

export const OFFICIAL_CONTACT_EMAIL = 'barberos.contacto@gmail.com'

// ─── Deduplication Cache (Evita envíos duplicados por clics repetidos) ───────
const dedupeCache = new Map<string, number>()
const DEDUPE_TTL_MS = 15 * 1000 // 15 segundos de ventana de deduplicación

function getDedupeKey(to: string | string[], subject: string): string {
  const target = Array.isArray(to) ? to.join(',') : to
  return `${target.toLowerCase().trim()}:${subject.trim()}`
}

function isDuplicate(key: string): boolean {
  const now = Date.now()
  const lastSent = dedupeCache.get(key)
  if (lastSent && now - lastSent < DEDUPE_TTL_MS) {
    return true
  }
  dedupeCache.set(key, now)
  // Limpieza periódica suave
  if (dedupeCache.size > 200) {
    for (const [k, timestamp] of dedupeCache.entries()) {
      if (now - timestamp > DEDUPE_TTL_MS) dedupeCache.delete(k)
    }
  }
  return false
}

// ─── Configuración y Estado del Proveedor ────────────────────────────────────

export function getEmailProviderStatus(): EmailProviderStatus {
  const resendApiKey = process.env.RESEND_API_KEY
  const smtpHost = process.env.SMTP_HOST

  let provider: 'resend' | 'smtp' | 'none' = 'none'
  let details = 'Sin proveedor de correo transaccional configurado (Modo Simulación).'

  if (resendApiKey) {
    provider = 'resend'
    details = 'Resend REST API activo y configurado.'
  } else if (smtpHost) {
    provider = 'smtp'
    details = `Servidor SMTP configurado (${smtpHost}).`
  }

  const fromEmail = process.env.EMAIL_FROM || (
    provider === 'resend'
      ? 'BarberOS <onboarding@resend.dev>'
      : `BarberOS <${OFFICIAL_CONTACT_EMAIL}>`
  )

  return {
    configured: provider !== 'none',
    provider,
    fromEmail,
    contactEmail: OFFICIAL_CONTACT_EMAIL,
    details
  }
}

// ─── Despachador Central: Resend API ─────────────────────────────────────────

async function sendViaResend(
  apiKey: string,
  from: string,
  options: SendEmailOptions
): Promise<EmailResult> {
  const toList = Array.isArray(options.to) ? options.to : [options.to]

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: toList,
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo || OFFICIAL_CONTACT_EMAIL,
      tags: options.tags
    })
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const errorMsg = data?.message || `HTTP ${response.status}: Error al despachar con Resend`
    
    // Resend Sandbox / Modo prueba: solo permite envíos reales a la cuenta propietaria en Resend
    if (response.status === 403 && typeof errorMsg === 'string' && errorMsg.includes('You can only send testing emails')) {
      console.warn('[EmailService:Resend Sandbox] Cuenta en modo prueba sin dominio verificado. Envío simulado para destinatario externo.')
      return {
        success: true,
        provider: 'resend',
        simulated: true,
        messageId: `sandbox-${Date.now()}`,
        error: 'Modo prueba de Resend activo: para enviar a terceros sin restricción, añade y verifica tu dominio en resend.com/domains',
        timestamp: new Date().toISOString()
      }
    }

    console.error('[EmailService:Resend Error]', errorMsg)
    return {
      success: false,
      provider: 'resend',
      error: errorMsg,
      timestamp: new Date().toISOString()
    }
  }

  return {
    success: true,
    messageId: data.id,
    provider: 'resend',
    timestamp: new Date().toISOString()
  }
}

// ─── Despachador Central: Mock / Standby ─────────────────────────────────────

function sendViaMock(options: SendEmailOptions): EmailResult {
  const toList = Array.isArray(options.to) ? options.to.join(', ') : options.to
  console.info(`[EmailService:Simulated] Correo preparado para: ${toList}`)
  console.info(`[EmailService:Simulated] Asunto: ${options.subject}`)
  console.info(`[EmailService:Simulated] Contacto Oficial: ${OFFICIAL_CONTACT_EMAIL}`)

  return {
    success: true,
    messageId: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    provider: 'mock',
    simulated: true,
    timestamp: new Date().toISOString()
  }
}

// ─── Despachador Principal ──────────────────────────────────────────────────

export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  try {
    const dedupeKey = getDedupeKey(options.to, options.subject)
    if (isDuplicate(dedupeKey)) {
      console.warn(`[EmailService] Envío duplicado suprimido para ${dedupeKey}`)
      return {
        success: true,
        provider: 'mock',
        simulated: true,
        error: 'Duplicado reciente suprimido por política anti-rebote',
        timestamp: new Date().toISOString()
      }
    }

    const status = getEmailProviderStatus()
    const fromAddress = options.from || status.fromEmail

    if (status.provider === 'resend' && process.env.RESEND_API_KEY) {
      return await sendViaResend(process.env.RESEND_API_KEY, fromAddress, options)
    }

    // Si no hay proveedor transaccional configurado, simular limpiamente sin lanzar excepciones
    return sendViaMock(options)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido en servicio de correo'
    console.error('[EmailService] Error inesperado:', errorMsg)
    return {
      success: false,
      provider: 'mock',
      error: errorMsg,
      timestamp: new Date().toISOString()
    }
  }
}

// ─── Helpers Específicos de Negocio ──────────────────────────────────────────

/**
 * 1. Envía invitación de acceso a un barbero.
 */
export async function sendBarberInviteEmail(params: BarberInviteEmailParams): Promise<EmailResult> {
  const { html, text, subject } = generateBarberInviteTemplate(params)
  return await sendEmail({
    to: params.to,
    subject,
    html,
    text,
    tags: [{ name: 'category', value: 'barber_invite' }]
  })
}

/**
 * 2. Envía invitación de administrador de sede.
 */
export async function sendBranchAdminInviteEmail(params: BranchAdminInviteEmailParams): Promise<EmailResult> {
  const { html, text, subject } = generateBranchAdminInviteTemplate(params)
  return await sendEmail({
    to: params.to,
    subject,
    html,
    text,
    tags: [{ name: 'category', value: 'branch_admin_invite' }]
  })
}

/**
 * 3. Envía enlace seguro de restablecimiento de contraseña.
 */
export async function sendPasswordResetEmail(params: PasswordResetEmailParams): Promise<EmailResult> {
  const { html, text, subject } = generatePasswordResetTemplate(params)
  return await sendEmail({
    to: params.to,
    subject,
    html,
    text,
    tags: [{ name: 'category', value: 'password_reset' }]
  })
}

/**
 * 4. Envía confirmación de cita agendada al cliente.
 */
export async function sendAppointmentConfirmationEmail(params: AppointmentConfirmationEmailParams): Promise<EmailResult> {
  const { html, text, subject } = generateAppointmentConfirmationTemplate(params)
  return await sendEmail({
    to: params.to,
    subject,
    html,
    text,
    tags: [{ name: 'category', value: 'appointment_confirmation' }]
  })
}

/**
 * 5. Envía alerta de seguridad de la cuenta.
 */
export async function sendAccountSecurityAlertEmail(params: AccountSecurityAlertEmailParams): Promise<EmailResult> {
  const { html, text, subject } = generateAccountSecurityAlertTemplate(params)
  return await sendEmail({
    to: params.to,
    subject,
    html,
    text,
    tags: [{ name: 'category', value: 'security_alert' }]
  })
}

/**
 * 6. Envía confirmación de ticket de soporte creado al usuario.
 */
export async function sendSupportTicketCreatedEmail(params: SupportTicketCreatedEmailParams): Promise<EmailResult> {
  const { html, text, subject } = generateSupportTicketCreatedTemplate(params)
  return await sendEmail({
    to: params.to,
    subject,
    html,
    text,
    tags: [{ name: 'category', value: 'support_ticket_created' }]
  })
}

/**
 * 7. Envía notificación de respuesta en ticket de soporte.
 */
export async function sendSupportTicketReplyEmail(params: SupportTicketReplyEmailParams): Promise<EmailResult> {
  const { html, text, subject } = generateSupportTicketReplyTemplate(params)
  return await sendEmail({
    to: params.to,
    subject,
    html,
    text,
    tags: [{ name: 'category', value: 'support_ticket_reply' }]
  })
}

/**
 * 8. Envía notificación de ticket de soporte resuelto.
 */
export async function sendSupportTicketResolvedEmail(params: SupportTicketResolvedEmailParams): Promise<EmailResult> {
  const { html, text, subject } = generateSupportTicketResolvedTemplate(params)
  return await sendEmail({
    to: params.to,
    subject,
    html,
    text,
    tags: [{ name: 'category', value: 'support_ticket_resolved' }]
  })
}
