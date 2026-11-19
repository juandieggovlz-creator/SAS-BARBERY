import { getPublicPageUrl } from '@/lib/url'
import { prisma } from '../prisma'
import { MetaCloudProvider } from './meta-provider'
import { WhatsAppSendResult } from './types'
import { resolveAppointmentFinancials } from '@/lib/booking/booking-metadata'
import { safeDecryptToken } from '@/lib/crypto'
import {
  formatPaymentMethodsSummary,
  parseBusinessDepositConfig,
} from '@/lib/booking/deposit-config'

export const DEFAULT_CONFIRM_TEMPLATE = `👋 ¡Hola *{clientName}*!
Tu reserva en *{businessName}* ha sido confirmada con éxito 💈✂️

📅 *Fecha:* {date}
⏰ *Hora:* {time}
💈 *Barbero:* {barberName}
💇‍♂️ *Servicio:* {serviceName} ({price})
🔖 *Código de cita:* {reservationCode}

📍 Te esperamos a tiempo en la barbería. Si necesitas reprogramar o gestionar tu cita:
{bookingLink}

_Gracias por confiar en {businessName}._`

export const DEFAULT_BUSINESS_ALERT_TEMPLATE = `🔔 *Nueva Cita Agendada en tu Barbería* 💈

Se ha recibido una nueva reserva:
👤 *Cliente:* {clientName} ({clientPhone})
📅 *Fecha:* {date}
⏰ *Hora:* {time}
💈 *Barbero:* {barberName}
✂️ *Servicio:* {serviceName} ({price})
🔖 *Código:* {reservationCode}

_Gestiona tus citas en tu panel de BarberOS._`

export const DEFAULT_REMINDER_TEMPLATE = `🔔 *Recordatorio de tu Cita* 💈

Hola *{clientName}*, te recordamos que tienes una cita programada en *{businessName}* en aproximadamente {hoursBefore} horas.

⏰ *Hora:* {time}
🗓️ *Fecha:* {date}
💈 *Barbero:* {barberName}
✂️ *Servicio:* {serviceName}
🔖 *Código:* {reservationCode}

Por favor confirma tu asistencia respondiendo a este mensaje o gestiona tu cita aquí:
{bookingLink}

¡Nos vemos pronto!`

export const DEFAULT_CANCELLATION_TEMPLATE = `❌ *Tu cita en {businessName} ha sido cancelada* 💈

Hola *{clientName}*, te informamos que tu cita con *{barberName}* programada para el *{date}* a las *{time}* ha sido cancelada.

Si deseas agendar un nuevo horario en nuestra barbería, puedes hacerlo directamente aquí:
{bookingLink}

_Lamentamos los inconvenientes ocasionados._`

export const DEFAULT_RESCHEDULE_TEMPLATE = `🔄 *Tu cita en {businessName} ha sido reprogramada* 💈

Hola *{clientName}*, tu cita con *{barberName}* ha sido actualizada a un nuevo horario:

📅 *Nueva Fecha:* {date}
⏰ *Nueva Hora:* {time}
💇‍♂️ *Servicio:* {serviceName}
🔖 *Código de cita:* {reservationCode}

Puedes revisar los detalles de tu cita aquí:
{bookingLink}

¡Te esperamos puntualmente!`

export const DEFAULT_THANKYOU_TEMPLATE = `✨ *¡Gracias por visitarnos en {businessName}!* 💈✂️

Hola *{clientName}*, fue un placer atenderte hoy. Esperamos que hayas disfrutado de tu servicio de *{serviceName}* con *{barberName}*.

Si te gustó tu atención, te esperamos pronto para tu próximo corte o perfilado. ¡Que tengas un excelente día!`

export const DEFAULT_WELCOME_BOT_MESSAGE = `💈 ¡Hola! Bienvenido a *{businessName}* 💈

¿En qué te podemos ayudar hoy?
1️⃣ 📅 Reservar cita
2️⃣ 📋 Consultar o reprogramar mis citas
3️⃣ 👤 Hablar con un asesor del equipo

📲 También puedes agendar en línea en nuestra web:
{bookingLink}

_Responde con el número de la opción deseada para comenzar._`

export class WhatsAppService {
  /**
   * Reemplaza variables en una plantilla
   */
  static renderTemplate(template: string, vars: Record<string, string>): string {
    let result = template
    for (const [key, value] of Object.entries(vars)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g')
      result = result.replace(regex, value || '')
    }
    return result
  }

  /**
   * Formatea fecha y hora en español utilizando la zona horaria de Colombia
   */
  static formatDateTime(date: Date, timeZone = 'America/Bogota') {
    const formattedDate = new Intl.DateTimeFormat('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone
    }).format(date)

    const formattedTime = new Intl.DateTimeFormat('es-CO', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone
    }).format(date)

    return {
      formattedDate: formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1),
      formattedTime
    }
  }

  /**
   * Valida y normaliza un número de teléfono para envío
   */
  static normalizePhoneNumber(phone: string | null | undefined): string | null {
    if (!phone) return null
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length < 8) return null
    if (cleaned.length === 10 && cleaned.startsWith('3')) {
      return `57${cleaned}`
    }
    return cleaned
  }

  /**
   * Envía un mensaje usando exclusivamente Meta Cloud API
   */
  static async sendDirectMessage({
    businessId,
    to,
    text,
    appointmentId,
    tag
  }: {
    businessId: string
    to: string
    text: string
    appointmentId?: string
    tag?: string
  }): Promise<WhatsAppSendResult> {
    try {
      const normalizedTo = this.normalizePhoneNumber(to)
      if (!normalizedTo) {
        return { success: false, error: 'Número de teléfono de destinatario inválido' }
      }

      let integration = await prisma.whatsAppIntegration.findUnique({
        where: { businessId }
      })

      // Fallback multisede: Si la sede no tiene integración propia, heredar la de la sede principal de la empresa
      if (!integration || !integration.isEnabled) {
        const branch = await prisma.business.findUnique({
          where: { id: businessId },
          select: { companyId: true }
        })
        if (branch?.companyId) {
          integration = await prisma.whatsAppIntegration.findFirst({
            where: {
              business: { companyId: branch.companyId, isMainBranch: true },
              isEnabled: true
            }
          })
        }
      }

      if (!integration || !integration.isEnabled) {
        return { success: false, error: 'La integración de WhatsApp no está activada en este negocio' }
      }

      if (integration.provider !== 'META') {
        return { success: false, error: 'El proveedor configurado debe ser META' }
      }

      if (!integration.metaPhoneNumberId || !integration.metaAccessToken) {
        return { success: false, error: 'Faltan credenciales de Meta Cloud API (Phone Number ID o Access Token)' }
      }

      const decryptedAccessToken = safeDecryptToken(integration.metaAccessToken)
      if (!decryptedAccessToken) {
        return { success: false, error: 'No se pudo descifrar el Access Token de Meta' }
      }

      const result = await MetaCloudProvider.sendTextMessage({
        phoneNumberId: integration.metaPhoneNumberId,
        accessToken: decryptedAccessToken,
        to: normalizedTo,
        text
      })

      // Registrar log de auditoría con tag para deduplicación estricta
      await prisma.whatsAppMessageLog.create({
        data: {
          businessId,
          integrationId: integration.id,
          appointmentId: appointmentId || null,
          direction: 'OUTBOUND',
          status: result.success ? 'SENT' : 'FAILED',
          provider: 'META',
          from: integration.phoneNumber || 'BARBEROS',
          to: normalizedTo,
          messageBody: text,
          errorDetails: result.error || null,
          sentAt: result.success ? new Date() : null,
          rawPayload: {
            tag: tag || 'DIRECT_MESSAGE',
            metaMessageId: result.messageId || null,
            ...(result.rawResponse ? { raw: result.rawResponse } : {})
          }
        }
      })

      return result
    } catch (err: unknown) {
      console.error('Error en sendDirectMessage:', err)
      const error = err instanceof Error ? err.message : 'Error al enviar mensaje'
      return { success: false, error }
    }
  }

  /**
   * Envía confirmación automática de cita al cliente y alerta opcional a la barbería
   */
  static async sendAppointmentConfirmation(appointmentId: string): Promise<WhatsAppSendResult> {
    try {
      const appt = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          client: true,
          barber: true,
          service: true,
          business: {
            include: {
              whatsAppIntegration: true
            }
          }
        }
      })

      if (!appt) {
        return { success: false, error: 'Cita no encontrada' }
      }

      const integration = appt.business.whatsAppIntegration
      if (!integration || !integration.isEnabled || integration.provider !== 'META') {
        return { success: false, error: 'Integración Meta WhatsApp inactiva o no configurada' }
      }

      const financials = resolveAppointmentFinancials(appt)
      const depositConfig = parseBusinessDepositConfig(appt.business)
      const requiresDeposit = financials.depositRequired > 0
      const isDepositApproved = financials.isDepositApproved

      const confirmationTag =
        requiresDeposit && !isDepositApproved
          ? 'CONFIRMATION_HOLD'
          : 'CONFIRMATION_APPROVED'

      // Deduplicación por etapa (reserva temporal vs confirmación definitiva)
      const existingSentLog = await prisma.whatsAppMessageLog.findFirst({
        where: {
          appointmentId: appt.id,
          direction: 'OUTBOUND',
          status: 'SENT',
          rawPayload: {
            path: ['tag'],
            equals: confirmationTag,
          },
        },
      })

      if (existingSentLog) {
        return { success: true, messageId: 'already_confirmed_deduplicated' }
      }

      const clientPhone = this.normalizePhoneNumber(appt.client?.phone)
      if (!clientPhone) {
        return { success: false, error: 'El cliente no tiene un teléfono válido registrado' }
      }

      const { formattedDate, formattedTime } = this.formatDateTime(new Date(appt.date))
      const reservationUrl = getPublicPageUrl(appt.business.slug)
      const serviceDisplay = financials.serviceNamesJoined || appt.service.name
      const totalPriceDisplay = `$${Number(financials.totalPrice).toLocaleString('es-CO')}`

      let renderedBody = ''
      if (requiresDeposit && !isDepositApproved) {
        const methodsText = formatPaymentMethodsSummary(depositConfig)
        renderedBody = `👋 ¡Hola *${appt.client.name}*!
Hemos creado tu *reserva temporal* en *${appt.business.name}* 💈✂️

📅 *Fecha:* ${formattedDate}
⏰ *Hora:* ${formattedTime}
💈 *Barbero:* ${appt.barber?.name || 'Asignado'}
💇‍♂️ *Servicio:* ${serviceDisplay}
💰 *Total:* ${totalPriceDisplay}
💳 *Anticipo requerido:* $${Number(financials.depositRequired).toLocaleString('es-CO')}
💵 *Saldo restante en barbería:* $${Number(financials.remainingBalance).toLocaleString('es-CO')}
🔖 *Código de reserva:* ${appt.reservationCode}

${methodsText ? `📌 *Medios de pago autorizados:*\n${methodsText}\n\n` : ''}⏳ *Importante:* Tu horario está protegido por *${depositConfig.paymentMethods.holdMinutes || 30} minutos*. Envía tu comprobante por este chat o adjúntalo en:
${reservationUrl}`
      } else {
        const templateToUse = integration.confirmTemplate || DEFAULT_CONFIRM_TEMPLATE
        renderedBody = this.renderTemplate(templateToUse, {
          clientName: appt.client.name,
          cliente: appt.client.name,
          businessName: appt.business.name,
          barberia: appt.business.name,
          barberName: appt.barber?.name || 'Cualquier barbero disponible',
          barbero: appt.barber?.name || 'Cualquier barbero disponible',
          serviceName: serviceDisplay,
          servicio: serviceDisplay,
          price: totalPriceDisplay,
          precio: totalPriceDisplay,
          date: formattedDate,
          fecha: formattedDate,
          time: formattedTime,
          hora: formattedTime,
          dateTime: `${formattedDate} a las ${formattedTime}`,
          fecha_hora: `${formattedDate} a las ${formattedTime}`,
          reservationCode: appt.reservationCode,
          codigo: appt.reservationCode,
          bookingLink: reservationUrl,
          enlace_agenda: reservationUrl,
        })

        if (requiresDeposit && isDepositApproved) {
          renderedBody += `\n\n✅ *Anticipo verificado:* $${Number(financials.depositPaidAmount).toLocaleString('es-CO')}\n💵 *Saldo pendiente en barbería:* $${Number(financials.remainingBalance).toLocaleString('es-CO')}`
        }
      }

      // 1. Envío al cliente
      const clientResult = await this.sendDirectMessage({
        businessId: appt.businessId,
        to: clientPhone,
        text: renderedBody,
        appointmentId: appt.id,
        tag: confirmationTag,
      })

      // 2. Notificación interna opcional al teléfono del negocio
      if (integration.notifyBusinessOnBooking) {
        const businessPhone = this.normalizePhoneNumber(integration.phoneNumber || appt.business.phone)
        if (businessPhone && businessPhone !== clientPhone) {
          const businessAlertBody = this.renderTemplate(DEFAULT_BUSINESS_ALERT_TEMPLATE, {
            clientName: appt.client.name,
            clientPhone: appt.client.phone,
            date: formattedDate,
            time: formattedTime,
            barberName: appt.barber?.name || 'Cualquier barbero',
            serviceName: appt.service.name,
            price: `$${Number(appt.service.price).toLocaleString('es-CO')}`,
            reservationCode: appt.reservationCode
          })

          this.sendDirectMessage({
            businessId: appt.businessId,
            to: businessPhone,
            text: businessAlertBody,
            appointmentId: appt.id,
            tag: 'BUSINESS_NEW_BOOKING_ALERT'
          }).catch((err) => console.error('Error notificando nueva cita al negocio:', err))
        }
      }

      return clientResult
    } catch (err: unknown) {
      console.error('Error en sendAppointmentConfirmation:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' }
    }
  }

  /**
   * Envía recordatorio automático de cita programada
   */
  static async sendAppointmentReminder(appointmentId: string): Promise<WhatsAppSendResult> {
    try {
      const appt = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          client: true,
          barber: true,
          service: true,
          business: {
            include: {
              whatsAppIntegration: true
            }
          }
        }
      })

      if (!appt) {
        return { success: false, error: 'Cita no encontrada' }
      }

      // Regla de oro: NO enviar recordatorios si la cita fue cancelada
      if (appt.status === 'CANCELLED' || appt.status === 'COMPLETED') {
        return { success: false, error: `No se envía recordatorio para citas con estado ${appt.status}` }
      }

      const integration = appt.business.whatsAppIntegration
      if (!integration || !integration.isEnabled || integration.provider !== 'META' || (integration.reminderHoursBefore || 0) <= 0) {
        return { success: false, error: 'Flujo de recordatorios desactivado o no configurado' }
      }

      const clientPhone = this.normalizePhoneNumber(appt.client?.phone)
      if (!clientPhone) {
        return { success: false, error: 'El cliente no tiene un teléfono válido' }
      }

      // Deduplicación estricta de recordatorios
      const existingReminder = await prisma.whatsAppMessageLog.findFirst({
        where: {
          appointmentId: appt.id,
          direction: 'OUTBOUND',
          status: 'SENT',
          messageBody: { contains: 'Recordatorio' }
        }
      })

      if (existingReminder) {
        return { success: true, messageId: 'already_reminded_deduplicated' }
      }

      const { formattedDate, formattedTime } = this.formatDateTime(new Date(appt.date))
      const reservationUrl = getPublicPageUrl(appt.business.slug)
      const templateToUse = integration.reminderTemplate || DEFAULT_REMINDER_TEMPLATE

      const renderedBody = this.renderTemplate(templateToUse, {
        clientName: appt.client.name,
        cliente: appt.client.name,
        businessName: appt.business.name,
        barberia: appt.business.name,
        barberName: appt.barber?.name || 'Tu barbero',
        barbero: appt.barber?.name || 'Tu barbero',
        serviceName: appt.service.name,
        servicio: appt.service.name,
        date: formattedDate,
        fecha: formattedDate,
        time: formattedTime,
        hora: formattedTime,
        dateTime: `${formattedDate} a las ${formattedTime}`,
        fecha_hora: `${formattedDate} a las ${formattedTime}`,
        reservationCode: appt.reservationCode,
        codigo: appt.reservationCode,
        bookingLink: reservationUrl,
        enlace_agenda: reservationUrl,
        hoursBefore: String(integration.reminderHoursBefore || 2),
        horas_antes: String(integration.reminderHoursBefore || 2)
      })

      return await this.sendDirectMessage({
        businessId: appt.businessId,
        to: clientPhone,
        text: renderedBody,
        appointmentId: appt.id,
        tag: 'REMINDER'
      })
    } catch (err: unknown) {
      console.error('Error en sendAppointmentReminder:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Error en recordatorio' }
    }
  }

  /**
   * Envía notificación de cancelación de cita al cliente
   */
  static async sendAppointmentCancellation(appointmentId: string): Promise<WhatsAppSendResult> {
    try {
      const appt = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          client: true,
          barber: true,
          service: true,
          business: {
            include: {
              whatsAppIntegration: true
            }
          }
        }
      })

      if (!appt || !appt.business.whatsAppIntegration?.isEnabled) {
        return { success: false, error: 'Cita no encontrada o WhatsApp desactivado' }
      }

      const clientPhone = this.normalizePhoneNumber(appt.client?.phone)
      if (!clientPhone) return { success: false, error: 'Cliente sin teléfono válido' }

      // Deduplicación: no enviar cancelación duplicada
      const existingCancelLog = await prisma.whatsAppMessageLog.findFirst({
        where: {
          appointmentId: appt.id,
          direction: 'OUTBOUND',
          status: 'SENT',
          messageBody: { contains: 'cancelada' }
        }
      })
      if (existingCancelLog) {
        return { success: true, messageId: 'already_cancelled_deduplicated' }
      }

      const { formattedDate, formattedTime } = this.formatDateTime(new Date(appt.date))
      const reservationUrl = getPublicPageUrl(appt.business.slug)

      const renderedBody = this.renderTemplate(DEFAULT_CANCELLATION_TEMPLATE, {
        clientName: appt.client.name,
        businessName: appt.business.name,
        barberName: appt.barber?.name || 'tu barbero',
        serviceName: appt.service.name,
        date: formattedDate,
        time: formattedTime,
        bookingLink: reservationUrl
      })

      return await this.sendDirectMessage({
        businessId: appt.businessId,
        to: clientPhone,
        text: renderedBody,
        appointmentId: appt.id,
        tag: 'CANCELLATION'
      })
    } catch (err) {
      console.error('Error en sendAppointmentCancellation:', err)
      return { success: false, error: 'Error al enviar cancelación' }
    }
  }

  /**
   * Envía notificación de reprogramación de cita al cliente con el nuevo horario
   */
  static async sendAppointmentRescheduled(appointmentId: string, newDate: Date): Promise<WhatsAppSendResult> {
    try {
      const appt = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          client: true,
          barber: true,
          service: true,
          business: {
            include: {
              whatsAppIntegration: true
            }
          }
        }
      })

      if (!appt || !appt.business.whatsAppIntegration?.isEnabled) {
        return { success: false, error: 'Cita no encontrada o WhatsApp desactivado' }
      }

      const clientPhone = this.normalizePhoneNumber(appt.client?.phone)
      if (!clientPhone) return { success: false, error: 'Cliente sin teléfono' }

      const { formattedDate, formattedTime } = this.formatDateTime(new Date(newDate))
      const reservationUrl = getPublicPageUrl(appt.business.slug)

      const renderedBody = this.renderTemplate(DEFAULT_RESCHEDULE_TEMPLATE, {
        clientName: appt.client.name,
        businessName: appt.business.name,
        barberName: appt.barber?.name || 'tu barbero',
        serviceName: appt.service.name,
        date: formattedDate,
        time: formattedTime,
        reservationCode: appt.reservationCode,
        bookingLink: reservationUrl
      })

      return await this.sendDirectMessage({
        businessId: appt.businessId,
        to: clientPhone,
        text: renderedBody,
        appointmentId: appt.id,
        tag: 'RESCHEDULE'
      })
    } catch (err) {
      console.error('Error en sendAppointmentRescheduled:', err)
      return { success: false, error: 'Error al enviar reprogramación' }
    }
  }

  /**
   * Envía mensaje de agradecimiento y fidelización tras completar la atención
   */
  static async sendPostServiceThankYou(appointmentId: string): Promise<WhatsAppSendResult> {
    try {
      const appt = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          client: true,
          barber: true,
          service: true,
          business: {
            include: {
              whatsAppIntegration: true
            }
          }
        }
      })

      if (!appt || !appt.business.whatsAppIntegration?.isEnabled) {
        return { success: false, error: 'WhatsApp desactivado' }
      }

      const clientPhone = this.normalizePhoneNumber(appt.client?.phone)
      if (!clientPhone) return { success: false, error: 'Cliente sin teléfono' }

      // Deduplicación de agradecimiento
      const existingThankYou = await prisma.whatsAppMessageLog.findFirst({
        where: {
          appointmentId: appt.id,
          direction: 'OUTBOUND',
          status: 'SENT',
          messageBody: { contains: 'Gracias por visitarnos' }
        }
      })
      if (existingThankYou) {
        return { success: true, messageId: 'already_thanked_deduplicated' }
      }

      const renderedBody = this.renderTemplate(DEFAULT_THANKYOU_TEMPLATE, {
        clientName: appt.client.name,
        businessName: appt.business.name,
        barberName: appt.barber?.name || 'tu barbero',
        serviceName: appt.service.name
      })

      return await this.sendDirectMessage({
        businessId: appt.businessId,
        to: clientPhone,
        text: renderedBody,
        appointmentId: appt.id,
        tag: 'POST_SERVICE_THANK_YOU'
      })
    } catch (err) {
      console.error('Error en sendPostServiceThankYou:', err)
      return { success: false, error: 'Error en mensaje post-servicio' }
    }
  }

  /**
   * Procesa un mensaje entrante desde el Webhook de Meta y responde con el bot de bienvenida
   */
  static async handleIncomingMessage({
    from,
    text,
    businessId,
    phoneNumberId
  }: {
    from: string
    text: string
    businessId?: string
    phoneNumberId?: string
  }): Promise<{ replied: boolean; reason?: string }> {
    try {
      let integration = null

      if (businessId) {
        integration = await prisma.whatsAppIntegration.findUnique({
          where: { businessId },
          include: { business: { include: { services: { where: { isActive: true }, take: 5 } } } }
        })
      } else if (phoneNumberId) {
        integration = await prisma.whatsAppIntegration.findFirst({
          where: { metaPhoneNumberId: phoneNumberId },
          include: { business: { include: { services: { where: { isActive: true }, take: 5 } } } }
        })
      }

      if (!integration || !integration.isEnabled || !integration.botEnabled) {
        return { replied: false, reason: 'Bot no habilitado o integración inactiva' }
      }

      const business = integration.business
      const reservationUrl = getPublicPageUrl(business.slug)

      // Registrar mensaje entrante en logs
      await prisma.whatsAppMessageLog.create({
        data: {
          businessId: business.id,
          integrationId: integration.id,
          direction: 'INBOUND',
          status: 'DELIVERED',
          provider: 'META',
          from,
          to: integration.phoneNumber || 'BARBEROS',
          messageBody: text
        }
      })

      // Generar respuesta del bot
      let responseBody = integration.welcomeMessage || DEFAULT_WELCOME_BOT_MESSAGE
      responseBody = this.renderTemplate(responseBody, {
        businessName: business.name,
        barberia: business.name,
        bookingLink: reservationUrl,
        enlace_agenda: reservationUrl
      })

      // Si el cliente pide servicios o menú
      const lowerText = text.toLowerCase()
      if (lowerText.includes('1') || lowerText.includes('servicio') || lowerText.includes('precio')) {
        const servicesList = business.services
          .map((s) => `• *${s.name}*: $${Number(s.price).toLocaleString('es-CO')} (${s.duration} min)`)
          .join('\n')

        responseBody = `✂️ *Nuestros Servicios en ${business.name}:*\n\n${servicesList || 'Consulta nuestros servicios en línea.'}\n\n👉 *Agenda tu cita aquí:* ${reservationUrl}`
      }

      await this.sendDirectMessage({
        businessId: business.id,
        to: from,
        text: responseBody,
        tag: 'BOT_AUTO_REPLY'
      })

      return { replied: true }
    } catch (err: unknown) {
      console.error('Error en handleIncomingMessage:', err)
      return { replied: false, reason: err instanceof Error ? err.message : 'Error procesando mensaje' }
    }
  }
}
