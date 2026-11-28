import { prisma } from './prisma'
import webpush from './web-push'
import { WhatsAppService } from './whatsapp/whatsapp-service'

export type NotificationEventType =
  | 'APPOINTMENT_CREATED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_RESCHEDULED'
  | 'APPOINTMENT_STATUS_CHANGED'
  | 'SYSTEM'

export interface DispatchAppointmentNotificationParams {
  eventType: NotificationEventType
  appointmentId: string
  businessId?: string
  barberId?: string | null
  clientName?: string
  serviceName?: string
  dateStr?: string
  notes?: string
  customTitle?: string
  customMessage?: string
  rescheduledTo?: Date
}

export interface DispatchResult {
  success: boolean
  dispatchedInternal: number
  dispatchedPush: number
  prunedSubscriptions: number
  errors: string[]
}

/**
 * Dispatches internal in-app notifications and Web Push notifications to the
 * authorized owners and assigned barbers for a given appointment event.
 *
 * Guaranteed non-blocking and tenant-isolated.
 */
export async function dispatchAppointmentNotification(
  params: DispatchAppointmentNotificationParams
): Promise<DispatchResult> {
  const result: DispatchResult = {
    success: true,
    dispatchedInternal: 0,
    dispatchedPush: 0,
    prunedSubscriptions: 0,
    errors: [],
  }

  try {
    // 1. Fetch appointment details if needed
    const appointment = await prisma.appointment.findUnique({
      where: { id: params.appointmentId },
      include: {
        business: {
          select: { id: true, name: true, slug: true, status: true },
        },
        barber: {
          select: { id: true, name: true, phone: true },
        },
        client: {
          select: { id: true, name: true, phone: true },
        },
        service: {
          select: { id: true, name: true, price: true, duration: true },
        },
      },
    })

    if (!appointment) {
      result.errors.push(`Appointment ${params.appointmentId} not found`)
      result.success = false
      return result
    }

    const businessId = appointment.businessId
    const businessName = appointment.business.name
    const clientName = params.clientName || appointment.client.name
    const serviceName = params.serviceName || appointment.service.name
    const barberName = appointment.barber?.name || 'Barbero de guardia'
    const dateFormatted = params.dateStr || new Date(appointment.date).toLocaleString('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })

    // 2. Build Titles and Messages
    let title = 'BarberOS Notificación'
    let message = ''

    switch (params.eventType) {
      case 'APPOINTMENT_CREATED':
        title = `✂️ Nueva Reserva: ${clientName}`
        message = `${clientName} reservó ${serviceName} para el ${dateFormatted}.`
        break
      case 'APPOINTMENT_CANCELLED':
        title = `❌ Cita Cancelada: ${clientName}`
        message = `La cita de ${clientName} (${serviceName}) programada para ${dateFormatted} fue cancelada.`
        break
      case 'APPOINTMENT_RESCHEDULED':
        title = `🗓️ Cita Reprogramada: ${clientName}`
        message = `La cita de ${clientName} (${serviceName}) fue reprogramada para ${dateFormatted}.`
        break
      case 'APPOINTMENT_STATUS_CHANGED':
        title = `⚡ Estado Actualizado: ${clientName}`
        message = `La cita de ${clientName} (${serviceName}) cambió a estado ${appointment.status}.`
        break
      default:
        title = params.customTitle || `Actualización en ${businessName}`
        message = params.customMessage || `Hay una novedad con la reserva de ${clientName}.`
    }

    if (params.customTitle) title = params.customTitle
    if (params.customMessage) message = params.customMessage

    // 3. Resolve Target Recipients with Multi-tenant & Role Isolation
    // - Owners and Branch Admins of this business
    // - Assigned Barber (only the user mapped to appointment.barberId)
    const targetUsers = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          // Business Owners & Branch Admins
          {
            businessId: businessId,
            role: { in: ['OWNER', 'BRANCH_ADMIN'] },
          },
          // Assigned Barber
          ...(appointment.barberId
            ? [
                {
                  barberId: appointment.barberId,
                  role: 'BARBER' as const,
                },
              ]
            : []),
        ],
      },
      include: {
        notificationPreference: true,
        pushSubscriptions: true,
      },
    })

    // 4. Process each target recipient
    for (const user of targetUsers) {
      const prefs = user.notificationPreference

      // Check event preference filter
      if (prefs) {
        if (params.eventType === 'APPOINTMENT_CREATED' && prefs.notifyNewAppointment === false) continue
        if (params.eventType === 'APPOINTMENT_CANCELLED' && prefs.notifyCancelled === false) continue
        if (params.eventType === 'APPOINTMENT_RESCHEDULED' && prefs.notifyRescheduled === false) continue
        if (params.eventType === 'APPOINTMENT_STATUS_CHANGED' && prefs.notifyStatusChange === false) continue
      }

      // Role-specific navigation URL
      const appUrl = user.role === 'BARBER' ? '/barber/appointments' : '/appointments'

      // A. Create Internal AppNotification (Notification Center)
      try {
        await prisma.appNotification.create({
          data: {
            userId: user.id,
            businessId: businessId,
            appointmentId: appointment.id,
            title,
            message,
            type: params.eventType,
            metadata: {
              clientName,
              serviceName,
              barberName,
              dateStr: dateFormatted,
              appUrl,
            },
          },
        })
        result.dispatchedInternal++
      } catch (err: any) {
        result.errors.push(`Failed to create AppNotification for user ${user.id}: ${err.message}`)
      }

      // B. Dispatch Web Push if user has push enabled and active subscriptions
      const isPushEnabled = prefs ? prefs.pushEnabled !== false : true
      if (isPushEnabled && user.pushSubscriptions && user.pushSubscriptions.length > 0) {
        const payload = JSON.stringify({
          title,
          body: message,
          icon: '/icon.png',
          badge: '/favicon.png',
          tag: `barberos-${appointment.id}-${params.eventType.toLowerCase()}`,
          data: {
            url: appUrl,
            appointmentId: appointment.id,
            businessId: businessId,
            eventType: params.eventType,
          },
          actions: [
            { action: 'open', title: 'Ver Cita' },
          ],
        })

        for (const sub of user.pushSubscriptions) {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.p256dh,
                  auth: sub.auth,
                },
              },
              payload
            )
            result.dispatchedPush++
          } catch (pushErr: any) {
            // Prune expired or unregistered endpoints automatically (404 Not Found / 410 Gone)
            if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
              await prisma.pushSubscription.delete({
                where: { id: sub.id },
              }).catch(() => {})
              result.prunedSubscriptions++
            } else {
              result.errors.push(`Push failed for sub ${sub.id}: ${pushErr.message}`)
            }
          }
        }
      }
    }

    // 5. WhatsApp Fallback Integration (Graceful & Non-blocking)
    try {
      if (params.eventType === 'APPOINTMENT_CREATED') {
        await WhatsAppService.sendAppointmentConfirmation(appointment.id)
      } else if (params.eventType === 'APPOINTMENT_CANCELLED') {
        await WhatsAppService.sendAppointmentCancellation(appointment.id)
      } else if (params.eventType === 'APPOINTMENT_RESCHEDULED') {
        await WhatsAppService.sendAppointmentRescheduled(
          appointment.id,
          params.rescheduledTo || new Date(appointment.date)
        )
      }
    } catch (waErr: any) {
      // WhatsApp failures MUST NOT fail push or booking
      console.warn('[PushDispatcher] WhatsApp auto-dispatch skipped or failed:', waErr.message)
    }

    return result
  } catch (globalErr: any) {
    result.success = false
    result.errors.push(`Global dispatch error: ${globalErr.message}`)
    return result
  }
}
