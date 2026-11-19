import { getPublicPageUrl } from '@/lib/url'
import { prisma } from '../prisma'
import { WhatsAppAvailabilityHelper } from './availability-helper'
import { WhatsAppService } from './whatsapp-service'
import { randomBytes } from 'crypto'
import {
  BookingEngineError,
  createCentralizedBooking,
  normalizeCustomerPhone,
  rescheduleCentralizedBooking,
} from '@/lib/booking/booking-engine'
import {
  calculateDepositAmount,
  formatPaymentMethodsSummary,
  parseBusinessDepositConfig,
} from '@/lib/booking/deposit-config'
import { resolveAppointmentFinancials } from '@/lib/booking/booking-metadata'

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
          select: {
            id: true,
            name: true,
            slug: true,
            phone: true,
            address: true,
            companyId: true,
            depositEnabled: true,
            depositType: true,
            depositPercentage: true,
            depositFixedAmount: true,
            depositInstructions: true,
            company: {
              include: {
                branches: {
                  where: { status: 'ACTIVE' },
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    phone: true,
                    address: true,
                    isMainBranch: true,
                    depositEnabled: true,
                    depositType: true,
                    depositPercentage: true,
                    depositFixedAmount: true,
                    depositInstructions: true,
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!integration || !integration.isEnabled || !integration.botEnabled) {
      return { handled: false }
    }

    // Determinar qué sedes atiende este número (Soporte completo Modalidades A, B y C):
    // Sedes de la misma empresa que NO tengan una integración propia activa con otro número
    const otherIntegrations = integration.business.companyId
      ? await prisma.whatsAppIntegration.findMany({
          where: {
            business: { companyId: integration.business.companyId },
            isEnabled: true,
            id: { not: integration.id }
          },
          select: { businessId: true, metaPhoneNumberId: true }
        })
      : []

    const exclusiveOtherBranchIds = new Set(
      otherIntegrations
        .filter(o => o.metaPhoneNumberId && o.metaPhoneNumberId !== integration.metaPhoneNumberId)
        .map(o => o.businessId)
    )

    const companyBranches = integration.business.company?.branches || [integration.business]
    const servedBranches = companyBranches.filter(
      b => b.id === integration.businessId || !exclusiveOtherBranchIds.has(b.id)
    )
    const hasMultipleBranches = servedBranches.length > 1

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

    // Metadata y contexto de sede seleccionada
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentMeta = (conv.metadata as Record<string, any>) || {}
    let selectedBranchId: string | null = (currentMeta.selectedBranchId as string) || (!hasMultipleBranches ? servedBranches[0]?.id : null)
    let selectedBranch = servedBranches.find(b => b.id === selectedBranchId) || (servedBranches.length === 1 ? servedBranches[0] : null)
    const targetBusinessId = selectedBranchId || businessId
    const targetBranch = selectedBranch || integration.business

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

    // ── GESTIÓN DE SELECCIÓN DE SEDE PENDIENTE (Modalidad A y C) ──
    if (currentMeta.branchSelectionPending && currentMeta.branchMap) {
      if (rawText === '0') {
        await prisma.whatsAppConversation.update({
          where: { id: conv.id },
          data: {
            metadata: {
              ...currentMeta,
              branchSelectionPending: false
            }
          }
        })
        const reply = await this.renderMainMenu(
          integration.business.company?.name || integration.business.name,
          integration.bookingEnabled,
          selectedBranch?.name,
          hasMultipleBranches
        )
        await this.sendReply(businessId, cleanFrom, reply)
        return { handled: true, replyText: reply }
      }

      const chosenBranchId = currentMeta.branchMap[rawText]
      if (chosenBranchId) {
        const chosen = servedBranches.find(b => b.id === chosenBranchId)
        selectedBranchId = chosenBranchId
        selectedBranch = chosen || null

        await prisma.whatsAppConversation.update({
          where: { id: conv.id },
          data: {
            state: 'MAIN_MENU',
            metadata: {
              ...currentMeta,
              branchSelectionPending: false,
              selectedBranchId: chosenBranchId,
              branchName: chosen?.name
            }
          }
        })

        const reply = `✅ Has seleccionado la *Sede ${chosen?.name}* 📍\n\n` +
          await this.renderMainMenu(
            integration.business.company?.name || integration.business.name,
            integration.bookingEnabled,
            chosen?.name,
            hasMultipleBranches
          )
        await this.sendReply(businessId, cleanFrom, reply)
        return { handled: true, replyText: reply }
      } else {
        const reply = `⚠️ Opción de sede no válida. Por favor responde con el número de una de las sedes listadas o *0* para volver.`
        await this.sendReply(businessId, cleanFrom, reply)
        return { handled: true, replyText: reply }
      }
    }

    // ── CAMBIO EXPLÍCITO DE SEDE (Modalidad A y C) ──
    if (
      hasMultipleBranches &&
      (lowerText === '4' ||
       lowerText.includes('cambiar sede') ||
       lowerText.includes('cambiar sucursal') ||
       lowerText === 'sedes' ||
       lowerText === 'sede')
    ) {
      const branchMap: Record<string, string> = {}
      let branchMenu = `🏢 *${integration.business.company?.name || integration.business.name}*\n`
      branchMenu += `¿En cuál de nuestras sedes deseas gestionar tu cita?\n\n`
      servedBranches.forEach((b, idx) => {
        const num = (idx + 1).toString()
        branchMap[num] = b.id
        const addr = b.address ? ` — _${b.address}_` : ''
        branchMenu += `*${num}.* ${b.name}${addr}\n`
      })
      branchMenu += `\n*0.* Cancelar y volver al menú\n\n_Escribe el número de la sede:_`

      await prisma.whatsAppConversation.update({
        where: { id: conv.id },
        data: {
          state: 'MAIN_MENU',
          selectedServiceId: null,
          selectedBarberId: null,
          selectedDate: null,
          selectedTime: null,
          metadata: {
            ...currentMeta,
            branchSelectionPending: true,
            branchMap
          }
        }
      })

      await this.sendReply(businessId, cleanFrom, branchMenu)
      return { handled: true, replyText: branchMenu }
    }

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
      const reply = await this.renderMainMenu(
        integration.business.company?.name || integration.business.name,
        integration.bookingEnabled,
        selectedBranch?.name,
        hasMultipleBranches
      )
      await this.sendReply(businessId, cleanFrom, reply)
      return { handled: true, replyText: reply }
    }

    // 6. Máquina de Estados del Flujo
    switch (conv.state) {
      case 'IDLE':
      case 'MAIN_MENU': {
        // Opción 1: Reservar cita
        if (rawText === '1' || lowerText.includes('reservar') || lowerText.includes('agendar') || lowerText.includes('cita')) {
          // Si hay múltiples sedes y el usuario aún no ha elegido sede, preguntar primero por la sede
          if (hasMultipleBranches && !selectedBranchId) {
            const branchMap: Record<string, string> = {}
            let branchMenu = `👋 ¡Hola! Bienvenido a *${integration.business.company?.name || integration.business.name}* 💈\n\n`
            branchMenu += `Contamos con varias sedes para tu atención. ¿En cuál de ellas deseas reservar?\n\n`
            servedBranches.forEach((b, idx) => {
              const num = (idx + 1).toString()
              branchMap[num] = b.id
              const addr = b.address ? ` — _${b.address}_` : ''
              branchMenu += `*${num}.* ${b.name}${addr}\n`
            })
            branchMenu += `\n_Responde con el número de la sede deseada:_`

            await prisma.whatsAppConversation.update({
              where: { id: conv.id },
              data: {
                state: 'MAIN_MENU',
                metadata: {
                  ...currentMeta,
                  branchSelectionPending: true,
                  branchMap
                }
              }
            })

            await this.sendReply(businessId, cleanFrom, branchMenu)
            return { handled: true, replyText: branchMenu }
          }

          if (!integration.bookingEnabled) {
            const reply = `ℹ️ En este momento las reservas directas por WhatsApp están en mantenimiento o deshabilitadas temporalmente.\n\nPuedes reservar a través de nuestra web oficial:\n${getPublicPageUrl(targetBranch.slug)}\n\nO responde *3* para hablar con un asesor.`
            await this.sendReply(businessId, cleanFrom, reply)
            return { handled: true, replyText: reply }
          }

          // Cargar servicios activos reales de la sede seleccionada
          const services = await prisma.service.findMany({
            where: { businessId: targetBusinessId, isActive: true },
            orderBy: { price: 'asc' }
          })

          if (services.length === 0) {
            const reply = `💈 No hay servicios disponibles en este momento en ${targetBranch.name}. Por favor contacta a un asesor respondiendo *3*.`
            await this.sendReply(businessId, cleanFrom, reply)
            return { handled: true, replyText: reply }
          }

          const serviceMap: Record<string, string> = {}
          let menuText = `💇‍♂️ *Servicios disponibles en ${targetBranch.name}:* ✂️\n\n`
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
              metadata: {
                ...currentMeta,
                services: serviceMap,
                selectedBranchId: targetBusinessId,
                branchName: targetBranch.name
              }
            }
          })

          await this.sendReply(businessId, cleanFrom, menuText)
          return { handled: true, replyText: menuText }
        }

        // Opción 2: Mis Citas (consulta citas en todas las sedes asociadas a la empresa)
        if (rawText === '2' || lowerText.includes('mis citas') || lowerText.includes('consultar')) {
          return await this.handleViewAppointments(
            businessId,
            cleanFrom,
            conv.id,
            servedBranches.map(b => b.id)
          )
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

        // Si escribió un saludo general u otra cosa, mostrar el menú con la sede actual si existe
        const welcome = await this.renderMainMenu(
          integration.business.company?.name || integration.business.name,
          integration.bookingEnabled,
          selectedBranch?.name,
          hasMultipleBranches
        )
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
            where: { businessId: targetBusinessId, status: 'ACTIVE' },
            orderBy: { name: 'asc' }
          })

          if (barbers.length > 1) {
            const barberMap: Record<string, string> = { '0': 'ANY' }
            let barberText = `💈 *Selecciona tu Barbero preferido en ${targetBranch.name}:*\n\n`
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
                metadata: {
                  ...currentMeta,
                  barbers: barberMap,
                  selectedBranchId: targetBusinessId,
                  branchName: targetBranch.name
                }
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
          return await this.returnToMainMenu(
            businessId,
            cleanFrom,
            conv.id,
            integration.business.company?.name || integration.business.name,
            integration.bookingEnabled,
            undefined,
            selectedBranch?.name,
            hasMultipleBranches
          )
        }

        const metadata = (conv.metadata as { dates?: Record<string, string> }) || {}
        const chosenDate = metadata.dates?.[rawText]

        if (!chosenDate) {
          const reply = `⚠️ Opción no válida. Por favor selecciona el número de la fecha en la lista.`
          await this.sendReply(businessId, cleanFrom, reply)
          return { handled: true, replyText: reply }
        }

        // Consultar turnos disponibles reales en BarberOS para la sede objetivo
        const slots = await WhatsAppAvailabilityHelper.getAvailableSlots({
          businessId: targetBusinessId,
          serviceId: conv.selectedServiceId!,
          barberId: conv.selectedBarberId,
          dateStr: chosenDate
        })

        if (slots.length === 0) {
          const reply = `😔 No quedan turnos disponibles para esa fecha en ${targetBranch.name}. Por favor responde *0* para elegir otra fecha u otro barbero.`
          await this.sendReply(businessId, cleanFrom, reply)
          return { handled: true, replyText: reply }
        }

        const slotMap: Record<string, { timeStr: string; barberId: string; displayTime: string }> = {}
        let slotText = `⏰ *Horarios disponibles en ${targetBranch.name} (${chosenDate}):*\n\n`
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
            metadata: {
              ...currentMeta,
              slots: slotMap,
              selectedBranchId: targetBusinessId,
              branchName: targetBranch.name
            }
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
        const servicePriceNum = Number(service?.price || 0)
        const depositCfg = parseBusinessDepositConfig(targetBranch)
        const { depositRequired, remainingBalance } = calculateDepositAmount(servicePriceNum, depositCfg)
        const methodsSummary = depositCfg.depositEnabled && depositRequired > 0
          ? formatPaymentMethodsSummary(depositCfg)
          : ''

        let depositBlock = ''
        if (depositCfg.depositEnabled && depositRequired > 0) {
          depositBlock = `\n💳 *Anticipo requerido:* $${depositRequired.toLocaleString('es-CO')}\n💵 *Saldo en barbería:* $${remainingBalance.toLocaleString('es-CO')}${
            methodsSummary ? `\n\n📌 *Datos de pago para anticipo:*\n${methodsSummary}` : ''
          }`
        }

        const summary = `📋 *Resumen de tu Reserva:*
───────────────────
💈 *Sede:* ${targetBranch.name}${targetBranch.address ? ` (${targetBranch.address})` : ''}
💇‍♂️ *Servicio:* ${service?.name}
✂️ *Barbero:* ${barber?.name || 'Asignado automáticamente'}
📅 *Fecha:* ${conv.selectedDate}
⏰ *Hora:* ${chosenSlot.displayTime}
💰 *Total:* $${servicePriceNum.toLocaleString('es-CO')}${depositBlock}
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
            metadata: {
              ...currentMeta,
              confirmedSlot: chosenSlot,
              selectedBranchId: targetBusinessId,
              branchName: targetBranch.name
            }
          }
        })

        await this.sendReply(businessId, cleanFrom, summary)
        return { handled: true, replyText: summary }
      }

      case 'CONFIRMING_BOOKING': {
        if (rawText === '0') {
          return await this.returnToMainMenu(
            businessId,
            cleanFrom,
            conv.id,
            integration.business.company?.name || integration.business.name,
            integration.bookingEnabled,
            '❌ Proceso de reserva cancelado.',
            selectedBranch?.name,
            hasMultipleBranches
          )
        }

        if (rawText === '2') {
          return await this.promptDateSelection(businessId, cleanFrom, conv.id, conv.selectedServiceId!, conv.selectedBarberId)
        }

        if (rawText === '1') {
          const [year, month, day] = conv.selectedDate!.split('-').map(Number)
          const [hour, min] = conv.selectedTime!.split(':').map(Number)
          const appointmentDate = new Date(year, month - 1, day, hour, min, 0)

          try {
            if (conv.selectedAppointmentId) {
              // Reprogramación en el mismo registro preservando historial y anticipo
              const rescheduled = await rescheduleCentralizedBooking({
                appointmentId: conv.selectedAppointmentId,
                businessId: targetBusinessId,
                newDate: appointmentDate,
                newBarberId: conv.selectedBarberId,
                newServiceId: conv.selectedServiceId,
              })

              await prisma.whatsAppConversation.update({
                where: { id: conv.id },
                data: {
                  state: 'IDLE',
                  selectedServiceId: null,
                  selectedBarberId: null,
                  selectedDate: null,
                  selectedTime: null,
                  selectedAppointmentId: null,
                  metadata: {
                    selectedBranchId: targetBusinessId,
                    branchName: targetBranch.name,
                  },
                },
              })

              await WhatsAppService.sendAppointmentRescheduled(
                rescheduled.id,
                appointmentDate
              )

              return { handled: true, replyText: 'Cita reprogramada' }
            }

            // Nueva reserva usando el motor centralizado (con control transaccional y anticipos)
            const { appointment: newAppointment } = await createCentralizedBooking({
              businessId: targetBusinessId,
              serviceId: conv.selectedServiceId!,
              barberId: conv.selectedBarberId,
              date: appointmentDate,
              clientName: ctx.senderName || 'Cliente WhatsApp',
              clientPhone: cleanFrom,
              source: 'WHATSAPP',
            })

            // Resetear conversación conservando la sede seleccionada
            await prisma.whatsAppConversation.update({
              where: { id: conv.id },
              data: {
                state: 'IDLE',
                selectedServiceId: null,
                selectedBarberId: null,
                selectedDate: null,
                selectedTime: null,
                selectedAppointmentId: null,
                metadata: {
                  selectedBranchId: targetBusinessId,
                  branchName: targetBranch.name,
                },
              },
            })

            // Enviar confirmación formal por WhatsApp (incluye instrucciones de anticipo si aplica)
            await WhatsAppService.sendAppointmentConfirmation(newAppointment.id)

            return { handled: true, replyText: 'Cita confirmada' }
          } catch (err: unknown) {
            const errMsg =
              err instanceof BookingEngineError
                ? err.message
                : 'Ese turno acaba de ser ocupado o no se encuentra disponible.'
            const reply = `⚠️ *No se pudo completar la reserva:* ${errMsg}\n\nPor favor responde *1* para elegir otro horario.`
            await prisma.whatsAppConversation.update({
              where: { id: conv.id },
              data: { state: 'MAIN_MENU' },
            })
            await this.sendReply(businessId, cleanFrom, reply)
            return { handled: true, replyText: reply }
          }
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
   * Genera el menú principal con soporte para contexto de sede (Modalidad A, B y C)
   */
  private static async renderMainMenu(
    businessName: string,
    bookingEnabled: boolean,
    branchName?: string,
    hasMultipleBranches?: boolean
  ): Promise<string> {
    const branchLine = branchName ? ` · Sede ${branchName}` : ''
    let text = `💈 ¡Hola! Bienvenido a *${businessName}${branchLine}* 💈\n\n¿En qué te podemos ayudar hoy?\n1️⃣ 📅 Reservar cita ${bookingEnabled ? '' : '(En mantenimiento)'}\n2️⃣ 📋 Mis citas (Consultar / Reprogramar / Cancelar)\n3️⃣ 👤 Hablar con un asesor`
    if (hasMultipleBranches) {
      text += `\n4️⃣ 🏢 Cambiar de Sede`
    }
    text += `\n\n_Responde con el número de tu opción (1, 2, 3${hasMultipleBranches ? ' o 4' : ''})_`
    return text
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

    const convRecord = await prisma.whatsAppConversation.findUnique({
      where: { id: convId },
      select: { metadata: true }
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingMeta = (convRecord?.metadata as Record<string, any>) || {}

    await prisma.whatsAppConversation.update({
      where: { id: convId },
      data: {
        state: 'SELECTING_DATE',
        selectedServiceId: serviceId,
        selectedBarberId: barberId,
        metadata: {
          ...existingMeta,
          dates: dateMap
        }
      }
    })

    await this.sendReply(businessId, customerPhone, dateText)
    return { handled: true, replyText: dateText }
  }

  /**
   * Consulta las citas activas del cliente en las sedes correspondientes
   */
  private static async handleViewAppointments(
    businessId: string,
    customerPhone: string,
    convId: string,
    branchIds: string[] = [businessId]
  ) {
    const now = new Date()
    const { cleanPhone, last10Digits } = normalizeCustomerPhone(customerPhone)
    const appointments = await prisma.appointment.findMany({
      where: {
        businessId: { in: branchIds },
        client: {
          OR: [
            { phone: cleanPhone },
            { phone: customerPhone },
            ...(last10Digits.length === 10
              ? [{ phone: { endsWith: last10Digits } }]
              : []),
          ],
        },
        status: { in: ['PENDING', 'CONFIRMED'] },
        date: { gte: now }
      },
      include: {
        service: true,
        barber: true,
        payment: true,
        business: { select: { id: true, name: true, slug: true, address: true } }
      },
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
      const fin = resolveAppointmentFinancials(appt)
      const branchNotice = branchIds.length > 1 ? `\n   📍 Sede: *${appt.business.name}*` : ''
      const depositNotice =
        fin.depositRequired > 0
          ? fin.isDepositApproved
            ? `\n   ✅ Anticipo verificado · Saldo: $${fin.remainingBalance.toLocaleString('es-CO')}`
            : fin.depositStatus === 'PROOF_SUBMITTED'
            ? `\n   ⏳ Comprobante en verificación`
            : `\n   💳 Anticipo pendiente: $${fin.depositRequired.toLocaleString('es-CO')}`
          : ''
      listText += `*${num}.* ${fin.serviceNamesJoined || appt.service.name} con ${appt.barber.name}${branchNotice}\n   🗓️ ${formattedDate} — ⏰ ${formattedTime}\n   🔖 Código: ${appt.reservationCode}${depositNotice}\n\n`
    })
    listText += `*0.* Volver al menú\n\n_Escribe el número de la cita que deseas gestionar:_`

    const convRecord = await prisma.whatsAppConversation.findUnique({
      where: { id: convId },
      select: { metadata: true }
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingMeta = (convRecord?.metadata as Record<string, any>) || {}

    await prisma.whatsAppConversation.update({
      where: { id: convId },
      data: {
        state: 'VIEWING_APPOINTMENTS',
        metadata: {
          ...existingMeta,
          appointments: apptMap
        }
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
   * Resetea la conversación al menú principal preservando el contexto de sede
   */
  private static async returnToMainMenu(
    businessId: string,
    customerPhone: string,
    convId: string,
    businessName: string,
    bookingEnabled: boolean,
    prefixMsg?: string,
    branchName?: string,
    hasMultipleBranches?: boolean
  ) {
    const convRecord = await prisma.whatsAppConversation.findUnique({
      where: { id: convId },
      select: { metadata: true }
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingMeta = (convRecord?.metadata as Record<string, any>) || {}

    await prisma.whatsAppConversation.update({
      where: { id: convId },
      data: {
        state: 'MAIN_MENU',
        selectedServiceId: null,
        selectedBarberId: null,
        selectedDate: null,
        selectedTime: null,
        selectedAppointmentId: null,
        metadata: existingMeta.selectedBranchId ? {
          selectedBranchId: existingMeta.selectedBranchId,
          branchName: existingMeta.branchName
        } : undefined
      }
    })

    const menu = await this.renderMainMenu(
      businessName,
      bookingEnabled,
      branchName || existingMeta.branchName,
      hasMultipleBranches
    )
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
