import { prisma } from '../prisma'
import { MetaCloudProvider } from './meta-provider'
import { BaileysProvider } from './baileys-provider'
import { WhatsAppSendResult } from './types'

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
   * Formatea fecha y hora en español
   */
  static formatDateTime(date: Date) {
    const formattedDate = new Intl.DateTimeFormat('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Bogota'
    }).format(date)

    const formattedTime = new Intl.DateTimeFormat('es-CO', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Bogota'
    }).format(date)

    return {
      formattedDate: formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1),
      formattedTime
    }
  }

  /**
   * Envía un mensaje usando el proveedor activo de la barbería
   */
  static async sendDirectMessage({
    businessId,
    to,
    text,
    appointmentId
  }: {
    businessId: string
    to: string
    text: string
    appointmentId?: string
  }): Promise<WhatsAppSendResult> {
    try {
      const integration = await prisma.whatsAppIntegration.findUnique({
        where: { businessId }
      })

      if (!integration || !integration.isEnabled || integration.provider === 'NONE') {
        return { success: false, error: 'La integración de WhatsApp no está activada en este negocio' }
      }

      let result: WhatsAppSendResult = { success: false, error: 'Proveedor no configurado' }

      if (integration.provider === 'META') {
        if (!integration.metaPhoneNumberId || !integration.metaAccessToken) {
          return { success: false, error: 'Faltan credenciales de Meta Cloud API (Phone Number ID o Access Token)' }
        }

        result = await MetaCloudProvider.sendTextMessage({
          phoneNumberId: integration.metaPhoneNumberId,
          accessToken: integration.metaAccessToken,
          to,
          text
        })
      } else if (integration.provider === 'BAILEYS') {
        result = await BaileysProvider.sendTextMessage({
          endpoint: integration.baileysEndpoint,
          sessionId: integration.baileysSessionId || `session_${businessId}`,
          to,
          text
        })
      }

      // Registrar log de auditoría
      await prisma.whatsAppMessageLog.create({
        data: {
          businessId,
          integrationId: integration.id,
          appointmentId: appointmentId || null,
          direction: 'OUTBOUND',
          status: result.success ? 'SENT' : 'FAILED',
          provider: integration.provider,
          from: integration.phoneNumber || 'BARBEROS',
          to,
          messageBody: text,
          errorDetails: result.error || null,
          sentAt: result.success ? new Date() : null,
          rawPayload: result.rawResponse ? JSON.parse(JSON.stringify(result.rawResponse)) : undefined
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
   * Envía confirmación automática de cita cuando se genera una reserva
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
      if (!integration || !integration.isEnabled || !integration.notifyBusinessOnBooking) {
        // La barbería no tiene WhatsApp activado o el flujo de confirmación está desactivado
        return { success: false, error: 'Confirmación de citas por WhatsApp desactivada' }
      }

      if (!appt.client?.phone) {
        return { success: false, error: 'El cliente no tiene número de teléfono registrado' }
      }

      const { formattedDate, formattedTime } = this.formatDateTime(new Date(appt.date))
      const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://barberos.site'
      const reservationUrl = `${appBaseUrl}/b/${appt.business.slug}`

      const templateToUse = integration.confirmTemplate || DEFAULT_CONFIRM_TEMPLATE

      const renderedBody = this.renderTemplate(templateToUse, {
        clientName: appt.client.name,
        cliente: appt.client.name,
        businessName: appt.business.name,
        barberia: appt.business.name,
        barberName: appt.barber?.name || 'Cualquier barbero disponible',
        barbero: appt.barber?.name || 'Cualquier barbero disponible',
        serviceName: appt.service.name,
        servicio: appt.service.name,
        price: `$${Number(appt.service.price).toLocaleString('es-CO')}`,
        precio: `$${Number(appt.service.price).toLocaleString('es-CO')}`,
        date: formattedDate,
        fecha: formattedDate,
        time: formattedTime,
        hora: formattedTime,
        dateTime: `${formattedDate} a las ${formattedTime}`,
        fecha_hora: `${formattedDate} a las ${formattedTime}`,
        reservationCode: appt.reservationCode,
        codigo: appt.reservationCode,
        bookingLink: reservationUrl,
        enlace_agenda: reservationUrl
      })

      return await this.sendDirectMessage({
        businessId: appt.businessId,
        to: appt.client.phone,
        text: renderedBody,
        appointmentId: appt.id
      })
    } catch (err: unknown) {
      console.error('Error en sendAppointmentConfirmation:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' }
    }
  }

  /**
   * Envía recordatorio automático de cita (ej. 2 horas antes)
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

      const integration = appt?.business?.whatsAppIntegration
      if (!appt || !integration?.isEnabled || (integration.reminderHoursBefore || 0) <= 0 || !appt.client?.phone) {
        return { success: false, error: 'No aplicable para recordatorio o flujo desactivado' }
      }

      const { formattedDate, formattedTime } = this.formatDateTime(new Date(appt.date))
      const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://barberos.site'
      const reservationUrl = `${appBaseUrl}/b/${appt.business.slug}`

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
        to: appt.client.phone,
        text: renderedBody,
        appointmentId: appt.id
      })
    } catch (err: unknown) {
      console.error('Error en sendAppointmentReminder:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Error en recordatorio' }
    }
  }

  /**
   * Procesa un mensaje entrante (ej. desde el Webhook) y responde con el bot de bienvenida
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
      // Buscar la integración por businessId o por metaPhoneNumberId / phoneNumber
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
      const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://barberos.site'
      const reservationUrl = `${appBaseUrl}/b/${business.slug}`

      // Registrar mensaje entrante en logs
      await prisma.whatsAppMessageLog.create({
        data: {
          businessId: business.id,
          integrationId: integration.id,
          direction: 'INBOUND',
          status: 'DELIVERED',
          provider: integration.provider,
          from,
          to: integration.phoneNumber || 'BARBEROS',
          messageBody: text
        }
      })

      // Generar respuesta del bot
      let responseBody = integration.welcomeMessage || DEFAULT_WELCOME_BOT_MESSAGE
      responseBody = this.renderTemplate(responseBody, {
        barberia: business.name,
        enlace_agenda: reservationUrl
      })

      // Si el cliente pide servicios o menú
      const lowerText = text.toLowerCase()
      if (lowerText.includes('1') || lowerText.includes('servicio') || lowerText.includes('precio')) {
        const servicesList = business.services
          .map(s => `• *${s.name}*: $${Number(s.price).toLocaleString('es-CO')} (${s.duration} min)`)
          .join('\n')

        responseBody = `✂️ *Nuestros Servicios en ${business.name}:*\n\n${servicesList || 'Consulta nuestros servicios en línea.'}\n\n👉 *Agenda tu cita aquí:* ${reservationUrl}`
      }

      // Enviar respuesta automática
      await this.sendDirectMessage({
        businessId: business.id,
        to: from,
        text: responseBody
      })

      return { replied: true }
    } catch (err: unknown) {
      console.error('Error en handleIncomingMessage:', err)
      return { replied: false, reason: err instanceof Error ? err.message : 'Error procesando mensaje' }
    }
  }
}
