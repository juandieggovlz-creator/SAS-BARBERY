import { prisma } from '../prisma'
import { WhatsAppAvailabilityHelper } from './availability-helper'
import { WhatsAppService } from './whatsapp-service'
import { randomBytes } from 'crypto'

export interface IncomingMessageContext {
  from: string // Teléfono del cliente
  text: string
  businessId: string
  messageId?: string
  senderName?: string
}

function generateReservationCode(): string {
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
  const hex = randomBytes(3).toString('hex').toUpperCase()
  return `WAPP-${dateStr}-${hex}`
}

export class WhatsAppConversationEngine {
  /**
   * Procesa cualquier mensaje entrante de forma segura y guiada por estados
   */
  static async handleMessage(ctx: IncomingMessageContext): Promise<{ handled: boolean; replyText?: string }> {
    const { from, businessId, messageId } = ctx
    const cleanFrom = from.replace(/\D/g, '')
    const rawText = (ctx.text || '').trim()
    const lowerText = rawText.toLowerCase()

    // 1. Obtener la integración y verificar si la atención automática está activa
    const integration = await prisma.whatsAppIntegration.findUnique({
      where: { businessId },
      include: {
        business: {
          select: { id: true, name: true, slug: true, phone: true }
        }
      }
    })

    if (!integration || !integration.isEnabled || !integration.botEnabled) {
      return { handled: false }
    }

    // 2. Obtener o crear la sesión de conversación persistente
    let conv = await prisma.whatsAppConversation.findUnique({
      where: {
        businessId_customerPhone: {
          businessId,
          customerPhone: cleanFrom
        }
      }
    })

    if (!conv) {
      conv = await prisma.whatsAppConversation.create({
        data: {
          businessId,
          customerPhone: cleanFrom,
          state: 'IDLE',
          isBotActive: true,
          isHumanAgent: false,
          lastActivityAt: new Date()
        }
      })
    }

    // Deduplicación contra reintentos rápidos de webhooks
    if (messageId && conv.lastMessageId === messageId) {
      return { handled: true }
    }

    // Actualizar timestamp y messageId
    await prisma.whatsAppConversation.update({
      where: { id: conv.id },
      data: {
        lastMessageId: messageId || undefined,
        lastActivityAt: new Date()
      }
    })

    // 3. Control de "Choque": Si el bot está pausado para esta conversación (isBotActive === false) o asignado a humano
    if (!conv.isBotActive || conv.isHumanAgent) {
      // Si el cliente escribe explícitamente "reactivar bot", permitimos reanudar la automatización
      if (['reactivar bot', 'activar bot'].includes(lowerText)) {
        await prisma.whatsAppConversation.update({
          where: { id: conv.id },
          data: {
            isBotActive: true,
            isHumanAgent: false,
            state: 'MAIN_MENU'
          }
        })
        const reply = await this.renderMainMenu(integration.business.name, integration.bookingEnabled)
        await this.sendReply(businessId, cleanFrom, reply)
        return { handled: true, replyText: reply }
      }

      // Si isBotActive es false, el bot automatizado NO debe enviar ninguna respuesta automática a los nuevos mensajes
      return { handled: false }
    }

    // 4. Manejo de expiración de sesión (más de 30 minutos sin actividad)
    const minutesSinceLastActivity = (Date.now() - new Date(conv.lastActivityAt).getTime()) / (1000 * 60)
    if (minutesSinceLastActivity > 30 && conv.state !== 'IDLE') {
      conv = await prisma.whatsAppConversation.update({
        where: { id: conv.id },
        data: {
          state: 'MAIN_MENU',
          selectedServiceId: null,
          selectedBarberId: null,
          selectedDate: null,
          selectedTime: null,
          selectedAppointmentId: null,
          metadata: undefined
        }
      })
      const reply = `⏱️ *Tu sesión anterior ha expirado por inactividad.*\n\n` + await this.renderMainMenu(integration.business.name, integration.bookingEnabled)
      await this.sendReply(businessId, cleanFrom, reply)
      return { handled: true, replyText: reply }
    }

    // 5. Comandos universales de salida o reinicio
    if (['menu', 'menú', 'volver', 'inicio', 'reiniciar', 'salir'].includes(lowerText)) {
      await prisma.whatsAppConversation.update({
        where: { id: conv.id },
        data: {
          state: 'MAIN_MENU',
          selectedServiceId: null,
          selectedBarberId: null,
          selectedDate: null,
          selectedTime: null,
          selectedAppointmentId: null,
          metadata: undefined
        }
      })
      const reply = await this.renderMainMenu(integration.business.name, integration.bookingEnabled)
      await this.sendReply(businessId, cleanFrom, reply)
      return { handled: true, replyText: reply }
    }

    // 6. Máquina de Estados del Flujo
    switch (conv.state) {
      case 'IDLE':
      case 'MAIN_MENU': {
        // Opción 1: Reservar cita
        if (rawText === '1' || lowerText.includes('reservar') || lowerText.includes('agendar') || lowerText.includes('cita')) {
          if (!integration.bookingEnabled) {
            const reply = `ℹ️ En este momento las reservas directas por WhatsApp están en mantenimiento o deshabilitadas temporalmente.\n\nPuedes reservar a través de nuestra web oficial:\n${process.env.NEXT_PUBLIC_APP_URL || 'https://barberos.site'}/b/${integration.business.slug}\n\nO responde *3* para hablar con un asesor.`
            await this.sendReply(businessId, cleanFrom, reply)
            return { handled: true, replyText: reply }
          }

          // Cargar servicios activos reales
          const services = await prisma.service.findMany({
            where: { businessId, isActive: true },
            orderBy: { price: 'asc' }
          })

          if (services.length === 0) {
            const reply = `💈 No hay servicios disponibles en este momento. Por favor contacta a un asesor respondiendo *3*.`
            await this.sendReply(businessId, cleanFrom, reply)
            return { handled: true, replyText: reply }
          }

          const serviceMap: Record<string, string> = {}
          let menuText = `💇‍♂️ *Elige el servicio que deseas:* ✂️\n\n`
          services.forEach((s, idx) => {
            const num = (idx + 1).toString()
            serviceMap[num] = s.id
            const price = Number(s.price).toLocaleString('es-CO')
            menuText += `*${num}.* ${s.name} — *$${price}* (${s.duration} min)\n`
          })
          menuText += `\n*0.* Volver al menú principal\n\n_Escribe el número del servicio deseado:_`

          await prisma.whatsAppConversation.update({
            where: { id: conv.id },
            data: {
              state: 'SELECTING_SERVICE',
              metadata: { services: serviceMap }
            }
          })

          await this.sendReply(businessId, cleanFrom, menuText)
          return { handled: true, replyText: menuText }
        }

        // Opción 2: Mis Citas
        if (rawText === '2' || lowerText.includes('mis citas') || lowerText.includes('consultar')) {
          return await this.handleViewAppointments(businessId, cleanFrom, conv.id)
        }

        // Opción 3 o solicitud de Reprogramar / Hablar con un asesor
        if (rawText === '3' || lowerText.includes('asesor') || lowerText.includes('humano') || lowerText.includes('persona') || lowerText.includes('reprogramar')) {
          return await this.handleTransferToAdvisor(
            businessId,
            cleanFrom,
            conv.id,
            integration.advisorMessage,
            lowerText.includes('reprogramar') ? 'reprogramar' : 'asesor'
          )
        }

        // Si escribió un saludo general u otra cosa, mostrar el menú
        const welcome = await this.renderMainMenu(integration.business.name, integration.bookingEnabled)
        await this.sendReply(businessId, cleanFrom, welcome)
        return { handled: true, replyText: welcome }
      }

      case 'SELECTING_SERVICE': {
        if (rawText === '0') {
          return await this.returnToMainMenu(businessId, cleanFrom, conv.id, integration.business.name, integration.bookingEnabled)
        }

        const metadata = (conv.metadata as { services?: Record<string, string> }) || {}
        const serviceId = metadata.services?.[rawText]

        if (!serviceId) {
          const reply = `⚠️ Opción no válida. Por favor responde únicamente con el número del servicio que deseas, o *0* para volver.`
          await this.sendReply(businessId, cleanFrom, reply)
          return { handled: true, replyText: reply }
        }

        const service = await prisma.service.findUnique({ where: { id: serviceId } })
        if (!service || !service.isActive) {
          const reply = `⚠️ El servicio seleccionado ya no está disponible. Por favor elige otra opción.`
          await this.sendReply(businessId, cleanFrom, reply)
          return { handled: true, replyText: reply }
        }

        // Si la barbería permite selección de barbero
        if (integration.allowBarberSelection) {
          const barbers = await prisma.barber.findMany({
            where: { businessId, status: 'ACTIVE' },
            orderBy: { name: 'asc' }
          })

          if (barbers.length > 1) {
            const barberMap: Record<string, string> = { '0': 'ANY' }
            let barberText = `💈 *Selecciona tu Barbero preferido:*\n\n`
            barberText += `*0.* ⚡ Cualquiera disponible (Más rápido)\n`
            barbers.forEach((b, idx) => {
              const num = (idx + 1).toString()
              barberMap[num] = b.id
              barberText += `*${num}.* ${b.name}\n`
            })
            barberText += `\n_Responde con el número de tu preferencia:_`

            await prisma.whatsAppConversation.update({
              where: { id: conv.id },
              data: {
                state: 'SELECTING_BARBER',
                selectedServiceId: service.id,
                metadata: { barbers: barberMap }
              }
            })

            await this.sendReply(businessId, cleanFrom, barberText)
            return { handled: true, replyText: barberText }
          }
        }

        // Si no hay selección de barbero o solo hay 1, pasar directamente a fechas
        return await this.promptDateSelection(businessId, cleanFrom, conv.id, service.id, null)
      }

      case 'SELECTING_BARBER': {
        const metadata = (conv.metadata as { barbers?: Record<string, string> }) || {}
        const barberIdValue = metadata.barbers?.[rawText]

        if (barberIdValue === undefined) {
          const reply = `⚠️ Opción no válida. Por favor responde con el número del barbero o *0* para cualquiera disponible.`
          await this.sendReply(businessId, cleanFrom, reply)
          return { handled: true, replyText: reply }
        }

        const selectedBarberId = barberIdValue === 'ANY' ? null : barberIdValue
        return await this.promptDateSelection(businessId, cleanFrom, conv.id, conv.selectedServiceId!, selectedBarberId)
      }

      case 'SELECTING_DATE': {
        if (rawText === '0') {
          return await this.returnToMainMenu(businessId, cleanFrom, conv.id, integration.business.name, integration.bookingEnabled)
        }

        const metadata = (conv.metadata as { dates?: Record<string, string> }) || {}
        const chosenDate = metadata.dates?.[rawText]

        if (!chosenDate) {
          const reply = `⚠️ Opción no válida. Por favor selecciona el número de la fecha en la lista.`
          await this.sendReply(businessId, cleanFrom, reply)
          return { handled: true, replyText: reply }
        }

        // Consultar turnos disponibles reales en BarberOS
        const slots = await WhatsAppAvailabilityHelper.getAvailableSlots({
          businessId,
          serviceId: conv.selectedServiceId!,
          barberId: conv.selectedBarberId,
          dateStr: chosenDate
        })

        if (slots.length === 0) {
          const reply = `😔 No quedan turnos disponibles para esa fecha. Por favor responde *0* para elegir otra fecha u otro barbero.`
          await this.sendReply(businessId, cleanFrom, reply)
          return { handled: true, replyText: reply }
        }

        const slotMap: Record<string, { timeStr: string; barberId: string; displayTime: string }> = {}
        let slotText = `⏰ *Horarios disponibles para el ${chosenDate}:*\n\n`
        // Mostrar hasta 10 turnos
        slots.slice(0, 10).forEach((slot, idx) => {
          const num = (idx + 1).toString()
          slotMap[num] = {
            timeStr: slot.timeStr,
            barberId: slot.barberId,
            displayTime: slot.displayTime
          }
          slotText += `*${num}.* ${slot.displayTime}\n`
        })
        slotText += `\n*0.* Elegir otra fecha\n\n_Escribe el número de la hora deseada:_`

        await prisma.whatsAppConversation.update({
          where: { id: conv.id },
          data: {
            state: 'SELECTING_TIME',
            selectedDate: chosenDate,
            metadata: { slots: slotMap }
          }
        })

        await this.sendReply(businessId, cleanFrom, slotText)
        return { handled: true, replyText: slotText }
      }

      case 'SELECTING_TIME': {
        if (rawText === '0') {
          return await this.promptDateSelection(businessId, cleanFrom, conv.id, conv.selectedServiceId!, conv.selectedBarberId)
        }

        const metadata = (conv.metadata as { slots?: Record<string, { timeStr: string; barberId: string; displayTime: string }> }) || {}
        const chosenSlot = metadata.slots?.[rawText]

        if (!chosenSlot) {
          const reply = `⚠️ Opción no válida. Por favor responde con el número del horario deseado.`
          await this.sendReply(businessId, cleanFrom, reply)
          return { handled: true, replyText: reply }
        }

        const service = await prisma.service.findUnique({ where: { id: conv.selectedServiceId! } })
        const barber = chosenSlot.barberId ? await prisma.barber.findUnique({ where: { id: chosenSlot.barberId } }) : null

        const summary = `📋 *Resumen de tu Reserva:*
───────────────────
💈 *Barbería:* ${integration.business.name}
💇‍♂️ *Servicio:* ${service?.name}
✂️ *Barbero:* ${barber?.name || 'Asignado automáticamente'}
📅 *Fecha:* ${conv.selectedDate}
⏰ *Hora:* ${chosenSlot.displayTime}
💰 *Total:* $${Number(service?.price || 0).toLocaleString('es-CO')}
───────────────────
¿Deseas confirmar tu cita?
*1.* ✅ Sí, confirmar mi cita
*2.* 🔄 Cambiar horario
*0.* ❌ Cancelar y salir`

        await prisma.whatsAppConversation.update({
          where: { id: conv.id },
          data: {
            state: 'CONFIRMING_BOOKING',
            selectedTime: chosenSlot.timeStr,
            selectedBarberId: chosenSlot.barberId,
            metadata: { confirmedSlot: chosenSlot }
          }
        })

        await this.sendReply(businessId, cleanFrom, summary)
        return { handled: true, replyText: summary }
      }

      case 'CONFIRMING_BOOKING': {
        if (rawText === '0') {
          return await this.returnToMainMenu(businessId, cleanFrom, conv.id, integration.business.name, integration.bookingEnabled, '❌ Proceso de reserva cancelado.')
        }

        if (rawText === '2') {
          return await this.promptDateSelection(businessId, cleanFrom, conv.id, conv.selectedServiceId!, conv.selectedBarberId)
        }

        if (rawText === '1') {
          // ── Verificación atómica de disponibilidad antes de confirmar ──
          const [year, month, day] = conv.selectedDate!.split('-').map(Number)
          const [hour, min] = conv.selectedTime!.split(':').map(Number)
          const appointmentDate = new Date(year, month - 1, day, hour, min, 0)

          // 1. Servicio activo en la base de datos
          const service = await prisma.service.findUnique({ where: { id: conv.selectedServiceId! } })
          if (!service || !service.isActive || service.businessId !== businessId) {
            return await this.returnToMainMenu(
              businessId,
              cleanFrom,
              conv.id,
              integration.business.name,
              integration.bookingEnabled,
              '⚠️ El servicio seleccionado ya no se encuentra disponible. Por favor elige otro servicio.'
            )
          }

          // 2. Barbero activo en la base de datos
          const barber = await prisma.barber.findUnique({ where: { id: conv.selectedBarberId! } })
          if (!barber || barber.status !== 'ACTIVE' || barber.businessId !== businessId) {
            return await this.returnToMainMenu(
              businessId,
              cleanFrom,
              conv.id,
              integration.business.name,
              integration.bookingEnabled,
              '⚠️ El barbero seleccionado ya no se encuentra activo. Por favor elige otro barbero.'
            )
          }

          // 3. Horario laboral del barbero (BarberSchedule)
          const dayOfWeek = appointmentDate.getDay()
          const schedule = await prisma.barberSchedule.findFirst({
            where: { barberId: barber.id, dayOfWeek }
          })
          if (!schedule || !schedule.isWorking) {
            const reply = `⚠️ *Horario no disponible:* ${barber.name} no labora en este día. Por favor responde *1* para elegir otra fecha u otro barbero.`
            await prisma.whatsAppConversation.update({
              where: { id: conv.id },
              data: { state: 'MAIN_MENU' }
            })
            await this.sendReply(businessId, cleanFrom, reply)
            return { handled: true, replyText: reply }
          }

          const pad = (n: number) => n.toString().padStart(2, '0')
          const reqTimeStr = `${pad(appointmentDate.getHours())}:${pad(appointmentDate.getMinutes())}`
          const apptEnd = new Date(appointmentDate.getTime() + service.duration * 60 * 1000)
          const reqEndTimeStr = `${pad(apptEnd.getHours())}:${pad(apptEnd.getMinutes())}`

          if (reqTimeStr < schedule.startTime || reqEndTimeStr > schedule.endTime) {
            const reply = `⚠️ *Horario fuera de turno:* El horario laboral de ${barber.name} es de ${schedule.startTime} a ${schedule.endTime}. Por favor responde *1* para elegir otro horario.`
            await prisma.whatsAppConversation.update({
              where: { id: conv.id },
              data: { state: 'MAIN_MENU' }
            })
            await this.sendReply(businessId, cleanFrom, reply)
            return { handled: true, replyText: reply }
          }

          // 4. Pausas y bloqueos del barbero (BarberBlock)
          const startOfDay = new Date(year, month - 1, day, 0, 0, 0)
          const endOfDay = new Date(year, month - 1, day, 23, 59, 59)
          const blocks = await prisma.barberBlock.findMany({
            where: {
              barberId: barber.id,
              date: { gte: startOfDay, lte: endOfDay }
            }
          })
          const hasBlockOverlap = blocks.some(b => reqTimeStr < b.endTime && reqEndTimeStr > b.startTime)
          if (hasBlockOverlap) {
            const reply = `⚠️ *Horario bloqueado:* El barbero tiene una pausa programada en ese horario. Por favor responde *1* para elegir otro turno.`
            await prisma.whatsAppConversation.update({
              where: { id: conv.id },
              data: { state: 'MAIN_MENU' }
            })
            await this.sendReply(businessId, cleanFrom, reply)
            return { handled: true, replyText: reply }
          }

          // 5. Citas activas existentes (Evitar colisión / doble reserva)
          const existingAppts = await prisma.appointment.findMany({
            where: {
              barberId: barber.id,
              status: { in: ['PENDING', 'CONFIRMED'] },
              date: { gte: startOfDay, lte: endOfDay },
              ...(conv.selectedAppointmentId ? { NOT: { id: conv.selectedAppointmentId } } : {})
            },
            include: { service: true }
          })

          const hasConflict = existingAppts.some(appt => {
            const existingStart = new Date(appt.date)
            const existingEnd = new Date(existingStart.getTime() + (appt.service?.duration || 30) * 60 * 1000)
            return appointmentDate < existingEnd && apptEnd > existingStart
          })

          if (hasConflict) {
            const reply = `⚠️ *Lo sentimos:* Ese turno acaba de ser ocupado. Por favor responde *1* para elegir un horario alternativo.`
            await prisma.whatsAppConversation.update({
              where: { id: conv.id },
              data: { state: 'MAIN_MENU' }
            })
            await this.sendReply(businessId, cleanFrom, reply)
            return { handled: true, replyText: reply }
          }

          // Si es reprogramación, cancelar o marcar la cita previa
          if (conv.selectedAppointmentId) {
            await prisma.appointment.update({
              where: { id: conv.selectedAppointmentId },
              data: { status: 'CANCELLED' }
            }).catch(e => console.error('Error cancelando cita previa en reprogramación:', e))
          }

          // Buscar o crear cliente por teléfono dentro de la barbería
          let client = await prisma.client.findFirst({
            where: {
              businessId,
              phone: cleanFrom
            }
          })

          if (!client) {
            client = await prisma.client.create({
              data: {
                businessId,
                name: ctx.senderName || 'Cliente WhatsApp',
                phone: cleanFrom
              }
            })
          }

          // Crear la cita en BarberOS directamente en la BD
          const reservationCode = generateReservationCode()
          const newAppointment = await prisma.appointment.create({
            data: {
              businessId,
              clientId: client.id,
              barberId: barber.id,
              serviceId: service.id,
              date: appointmentDate,
              status: 'PENDING',
              reservationCode
            }
          })

          // Resetear conversación
          await prisma.whatsAppConversation.update({
            where: { id: conv.id },
            data: {
              state: 'IDLE',
              selectedServiceId: null,
              selectedBarberId: null,
              selectedDate: null,
              selectedTime: null,
              selectedAppointmentId: null,
              metadata: undefined
            }
          })

          // Enviar confirmación formal por WhatsApp
          await WhatsAppService.sendAppointmentConfirmation(newAppointment.id)

          return { handled: true, replyText: 'Cita confirmada' }
        }

        const reply = `Por favor responde con *1* para confirmar tu cita, *2* para cambiar de horario o *0* para cancelar.`
        await this.sendReply(businessId, cleanFrom, reply)
        return { handled: true, replyText: reply }
      }

      case 'VIEWING_APPOINTMENTS': {
        if (rawText === '0') {
          return await this.returnToMainMenu(businessId, cleanFrom, conv.id, integration.business.name, integration.bookingEnabled)
        }

        const metadata = (conv.metadata as { appointments?: Record<string, string> }) || {}
        const apptId = metadata.appointments?.[rawText]

        if (!apptId) {
          const reply = `⚠️ Opción no válida. Responde con el número de la cita que deseas gestionar, o *0* para volver.`
          await this.sendReply(businessId, cleanFrom, reply)
          return { handled: true, replyText: reply }
        }

        const appt = await prisma.appointment.findUnique({
          where: { id: apptId },
          include: { service: true, barber: true }
        })

        if (!appt) {
          return await this.returnToMainMenu(businessId, cleanFrom, conv.id, integration.business.name, integration.bookingEnabled, 'Cita no encontrada.')
        }

        const { formattedDate, formattedTime } = WhatsAppService.formatDateTime(new Date(appt.date))

        const details = `📋 *Detalle de tu Cita:*
• Servicio: *${appt.service.name}*
• Barbero: *${appt.barber.name}*
• Fecha: *${formattedDate}*
• Hora: *${formattedTime}*
• Código: *${appt.reservationCode}*

¿Qué deseas hacer con esta cita?
*1.* 🔄 Reprogramar fecha u hora
*2.* ❌ Cancelar cita
*0.* Volver al menú`

        await prisma.whatsAppConversation.update({
          where: { id: conv.id },
          data: {
            state: 'CONFIRMING_CANCEL',
            selectedAppointmentId: appt.id
          }
        })

        await this.sendReply(businessId, cleanFrom, details)
        return { handled: true, replyText: details }
      }

      case 'CONFIRMING_CANCEL': {
        if (rawText === '0') {
          return await this.returnToMainMenu(businessId, cleanFrom, conv.id, integration.business.name, integration.bookingEnabled)
        }

        if (rawText === '2') {
          // Cancelar la cita de forma segura
          await prisma.appointment.update({
            where: { id: conv.selectedAppointmentId! },
            data: { status: 'CANCELLED' }
          })

          await prisma.whatsAppConversation.update({
            where: { id: conv.id },
            data: { state: 'IDLE', selectedAppointmentId: null }
          })

          const reply = `✅ *Tu cita ha sido cancelada exitosamente.*\n\nSi deseas agendar en otra oportunidad, simplemente escribe *hola* o *menu*. ¡Te esperamos pronto!`
          await this.sendReply(businessId, cleanFrom, reply)
          return { handled: true, replyText: reply }
        }

        if (rawText === '1') {
          // Reprogramar: Obtener el servicio y barbero de la cita actual
          const currentAppt = await prisma.appointment.findUnique({
            where: { id: conv.selectedAppointmentId! }
          })

          if (!currentAppt) {
            return await this.returnToMainMenu(businessId, cleanFrom, conv.id, integration.business.name, integration.bookingEnabled)
          }

          return await this.promptDateSelection(businessId, cleanFrom, conv.id, currentAppt.serviceId, currentAppt.barberId)
        }

        const reply = `Por favor responde con *1* para reprogramar, *2* para cancelar la cita, o *0* para volver.`
        await this.sendReply(businessId, cleanFrom, reply)
        return { handled: true, replyText: reply }
      }

      default:
        return await this.returnToMainMenu(businessId, cleanFrom, conv.id, integration.business.name, integration.bookingEnabled)
    }
  }

  /**
   * Genera el menú principal
   */
  private static async renderMainMenu(businessName: string, bookingEnabled: boolean): Promise<string> {
    return `💈 ¡Hola! Bienvenido a *${businessName}* 💈

¿En qué te podemos ayudar hoy?
1️⃣ 📅 Reservar cita ${bookingEnabled ? '' : '(En mantenimiento)'}
2️⃣ 📋 Mis citas (Consultar / Reprogramar / Cancelar)
3️⃣ 👤 Hablar con un asesor

_Responde con el número de tu opción (1, 2 o 3)_`
  }

  /**
   * Muestra las fechas disponibles para seleccionar
   */
  private static async promptDateSelection(
    businessId: string,
    customerPhone: string,
    convId: string,
    serviceId: string,
    barberId: string | null
  ) {
    const dates = WhatsAppAvailabilityHelper.getNextDates(5)
    const dateMap: Record<string, string> = {}

    let dateText = `📅 *Selecciona la fecha para tu cita:*\n\n`
    dates.forEach((d, idx) => {
      const num = (idx + 1).toString()
      dateMap[num] = d.dateStr
      dateText += `*${num}.* ${d.displayDate}\n`
    })
    dateText += `\n*0.* Volver al menú\n\n_Escribe el número del día:_`

    await prisma.whatsAppConversation.update({
      where: { id: convId },
      data: {
        state: 'SELECTING_DATE',
        selectedServiceId: serviceId,
        selectedBarberId: barberId,
        metadata: { dates: dateMap }
      }
    })

    await this.sendReply(businessId, customerPhone, dateText)
    return { handled: true, replyText: dateText }
  }

  /**
   * Consulta las citas activas del cliente
   */
  private static async handleViewAppointments(businessId: string, customerPhone: string, convId: string) {
    const now = new Date()
    const appointments = await prisma.appointment.findMany({
      where: {
        businessId,
        client: { phone: customerPhone },
        status: { in: ['PENDING', 'CONFIRMED'] },
        date: { gte: now }
      },
      include: { service: true, barber: true },
      orderBy: { date: 'asc' }
    })

    if (appointments.length === 0) {
      const reply = `📋 No tienes citas activas programadas en este momento.\n\n¿Deseas agendar una nueva cita? Responde *1* para comenzar o *menu* para volver.`
      await this.sendReply(businessId, customerPhone, reply)
      return { handled: true, replyText: reply }
    }

    const apptMap: Record<string, string> = {}
    let listText = `📋 *Tus Citas Programadas:*\n\n`
    appointments.forEach((appt, idx) => {
      const num = (idx + 1).toString()
      apptMap[num] = appt.id
      const { formattedDate, formattedTime } = WhatsAppService.formatDateTime(new Date(appt.date))
      listText += `*${num}.* ${appt.service.name} con ${appt.barber.name}\n   🗓️ ${formattedDate} — ⏰ ${formattedTime}\n   🔖 Código: ${appt.reservationCode}\n\n`
    })
    listText += `*0.* Volver al menú\n\n_Escribe el número de la cita que deseas gestionar:_`

    await prisma.whatsAppConversation.update({
      where: { id: convId },
      data: {
        state: 'VIEWING_APPOINTMENTS',
        metadata: { appointments: apptMap }
      }
    })

    await this.sendReply(businessId, customerPhone, listText)
    return { handled: true, replyText: listText }
  }

  /**
   * Transfiere la conversación a un asesor humano y detiene el bot
   */
  private static async handleTransferToAdvisor(
    businessId: string,
    customerPhone: string,
    convId: string,
    customAdvisorMessage?: string | null,
    reason?: 'reprogramar' | 'asesor'
  ) {
    await prisma.whatsAppConversation.update({
      where: { id: convId },
      data: {
        isBotActive: false,
        isHumanAgent: true,
        state: 'HUMAN_AGENT',
        lastActivityAt: new Date()
      }
    })

    const reply = customAdvisorMessage || (
      reason === 'reprogramar'
        ? `🔄 *Solicitud de Reprogramación Recibida.*\n\nHemos pausado las respuestas automáticas. Un miembro del equipo te contactará directamente por aquí para ayudarte a reprogramar tu cita a la fecha y hora que prefieras.\n\n_Escribe *menu* para volver al asistente automático cuando desees._`
        : `👤 *Has sido transferido a un asesor de nuestro equipo.*

Hemos pausado las respuestas automáticas para esta conversación. Un miembro de la barbería te responderá directamente en breve.

_Si deseas reactivar el asistente automático en cualquier momento, solo escribe *menu* o *bot*._`
    )

    await this.sendReply(businessId, customerPhone, reply)
    return { handled: true, replyText: reply }
  }

  /**
   * Resetea la conversación al menú principal
   */
  private static async returnToMainMenu(
    businessId: string,
    customerPhone: string,
    convId: string,
    businessName: string,
    bookingEnabled: boolean,
    prefixMsg?: string
  ) {
    await prisma.whatsAppConversation.update({
      where: { id: convId },
      data: {
        state: 'MAIN_MENU',
        selectedServiceId: null,
        selectedBarberId: null,
        selectedDate: null,
        selectedTime: null,
        selectedAppointmentId: null,
        metadata: undefined
      }
    })

    const menu = await this.renderMainMenu(businessName, bookingEnabled)
    const reply = prefixMsg ? `${prefixMsg}\n\n${menu}` : menu
    await this.sendReply(businessId, customerPhone, reply)
    return { handled: true, replyText: reply }
  }

  /**
   * Envia la respuesta al cliente usando WhatsAppService
   */
  private static async sendReply(businessId: string, to: string, text: string) {
    await WhatsAppService.sendDirectMessage({
      businessId,
      to,
      text
    })
  }
}
