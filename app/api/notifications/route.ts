import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export interface AppNotification {
  id: string
  title: string
  message: string
  category: 'appointment' | 'chat' | 'note' | 'system'
  timestamp: string
  read: boolean
  link: string
  metadata?: {
    clientName?: string
    serviceName?: string
    barberName?: string
    date?: string
    status?: string
    code?: string
  }
}

export async function GET() {
  const session = await getSession()
  if (!session || !session.businessId) {
    return NextResponse.json({ notifications: [] })
  }

  try {
    const businessId = session.businessId
    const isBarber = session.role === 'BARBER'

    // 0. Fetch business trial / subscription status to alert expiration
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        status: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
        plan: { select: { name: true } }
      }
    })

    // 1. Fetch recent appointments from the database
    const appointmentsWhere = isBarber && session.barberId
      ? { businessId, barberId: session.barberId }
      : { businessId }

    const appointments = await prisma.appointment.findMany({
      where: appointmentsWhere,
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { name: true, phone: true } },
        service: { select: { name: true, price: true } },
        barber: { select: { name: true } }
      }
    })

    // 2. Fetch recent notes from the database
    const notes = await prisma.note.findMany({
      where: { businessId },
      take: 4,
      orderBy: { createdAt: 'desc' }
    })

    const notifications: AppNotification[] = []

    // ── Alerta Automática de Vencimiento de Membresía / Prueba (7 días antes o vencida) ──
    if (business) {
      const isTrial = business.status === 'TRIAL'
      const targetDate = isTrial ? business.trialEndsAt : business.subscriptionEndsAt

      if (targetDate) {
        const now = new Date()
        const target = new Date(targetDate)
        const diffMs = target.getTime() - now.getTime()
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

        const formattedTarget = target.toLocaleDateString('es-CO', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })

        if (diffDays <= 7 && diffDays >= 0) {
          notifications.push({
            id: `system-trial-warning-${diffDays}d`,
            title: isTrial
              ? `⏳ Te quedan ${diffDays === 0 ? 'pocas horas' : `${diffDays} día${diffDays > 1 ? 's' : ''}`} de prueba gratis`
              : `⏳ Tu suscripción vence en ${diffDays === 0 ? 'pocas horas' : `${diffDays} día${diffDays > 1 ? 's' : ''}`}`,
            message: isTrial
              ? `Tu mes gratis a FULL vence el ${formattedTarget}. Activa tu plan para no perder el acceso a la plataforma.`
              : `Tu membresía en ${business.plan?.name || 'BarberOS'} finaliza el ${formattedTarget}. Renueva tu plan para continuar sin interrupciones.`,
            category: 'system',
            timestamp: now.toISOString(),
            read: false,
            link: '/subscription',
            metadata: {
              code: 'TRIAL_EXPIRING_7DAYS',
              status: `${diffDays} días restantes`,
              date: formattedTarget
            }
          })
        } else if (diffDays < 0) {
          notifications.push({
            id: `system-trial-expired`,
            title: isTrial ? '⚠️ Periodo de prueba finalizado' : '⚠️ Suscripción vencida',
            message: `Tu periodo venció el ${formattedTarget}. Elige y activa tu plan ahora para reactivar todas tus funciones.`,
            category: 'system',
            timestamp: now.toISOString(),
            read: false,
            link: '/subscription',
            metadata: {
              code: 'TRIAL_EXPIRED',
              status: 'Vencida',
              date: formattedTarget
            }
          })
        }
      }
    }

    // ── Alerta Informativa: Notificación de Actualización de Plan desde Super Admin ──
    try {
      const recentPlanChange = await prisma.auditLog.findFirst({
        where: {
          businessId,
          action: {
            in: [
              'PLAN_CHANGED',
              'PLAN_ACTIVATED',
              'INDEFINITE_SUBSCRIPTION_SET',
              'UNLIMITED_TEST_MODE_ASSIGNED'
            ]
          },
          createdAt: {
            gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      if (recentPlanChange) {
        let detailsObj: any = {}
        try {
          detailsObj = JSON.parse(String(recentPlanChange.details || '{}'))
        } catch {
          // ignore
        }

        const activePlanName =
          detailsObj.newPlanName ||
          detailsObj.topPlanName ||
          detailsObj.planName ||
          business?.plan?.name ||
          'Premium'

        const isTestMode = recentPlanChange.action === 'UNLIMITED_TEST_MODE_ASSIGNED'
        const isIndefinite = recentPlanChange.action === 'INDEFINITE_SUBSCRIPTION_SET'

        notifications.unshift({
          id: `plan-change-${recentPlanChange.id}`,
          title: isTestMode
            ? '🚀 ¡Modo Pruebas Ilimitado Activado!'
            : '🎉 ¡Tu plan ha sido actualizado!',
          message: isTestMode
            ? `Tu negocio ahora tiene activo el plan ${activePlanName} con barberos y sedes ilimitados sin restricciones.`
            : isIndefinite
            ? `Tu negocio ahora tiene activo el plan ${activePlanName} con Vigencia Indefinida sin vencimiento.`
            : `Tu negocio ahora tiene activo el plan ${activePlanName}. Ya puedes utilizar las funciones incluidas en tu nueva suscripción.`,
          category: 'system',
          timestamp: recentPlanChange.createdAt.toISOString(),
          read: false,
          link: '/subscription',
          metadata: {
            code: 'PLAN_UPDATED_CONFIRMED',
            status: activePlanName,
            date: recentPlanChange.createdAt.toISOString()
          }
        })
      }
    } catch (e) {
      // safe fallback
    }

    // Convert real appointments to notifications
    appointments.forEach((apt) => {
      const dateFormatted = new Date(apt.date).toLocaleString('es-CO', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })

      let title = 'Nueva Cita Agendada'
      if (apt.status === 'COMPLETED') title = 'Cita Completada'
      if (apt.status === 'CANCELLED') title = 'Cita Cancelada'
      if (apt.status === 'CONFIRMED') title = 'Cita Confirmada'

      notifications.push({
        id: `apt-${apt.id}`,
        title,
        message: `${apt.client?.name || 'Cliente'} reservó ${apt.service?.name || 'Servicio'} con ${apt.barber?.name || 'Barbero'} para el ${dateFormatted}.`,
        category: 'appointment',
        timestamp: apt.createdAt.toISOString(),
        read: false,
        link: isBarber ? '/barber/appointments' : '/appointments',
        metadata: {
          clientName: apt.client?.name || 'Cliente',
          serviceName: apt.service?.name,
          barberName: apt.barber?.name,
          date: dateFormatted,
          status: apt.status,
          code: apt.reservationCode
        }
      })
    })

    // Convert real notes to notifications
    notes.forEach((note) => {
      notifications.push({
        id: `note-${note.id}`,
        title: note.isPinned ? `📌 Nota Importante: ${note.title}` : `Nota: ${note.title}`,
        message: note.content.length > 80 ? note.content.substring(0, 80) + '...' : note.content,
        category: 'note',
        timestamp: note.createdAt.toISOString(),
        read: false,
        link: isBarber ? '/barber/notes' : '/notes'
      })
    })

    // 3. Convert WhatsApp human-agent / reschedule requests to notifications
    const waHumanRequests = await prisma.whatsAppConversation.findMany({
      where: {
        businessId,
        isHumanAgent: true
      },
      take: 5,
      orderBy: { lastActivityAt: 'desc' }
    })

    waHumanRequests.forEach((chat) => {
      notifications.push({
        id: `wa-human-${chat.id}`,
        title: '💬 Asesor / Reprogramación WhatsApp',
        message: `El cliente +${chat.customerPhone} solicitó atención manual. El bot se encuentra en pausa para tu respuesta.`,
        category: 'chat',
        timestamp: chat.lastActivityAt.toISOString(),
        read: false,
        link: '/settings',
        metadata: {
          clientName: `+${chat.customerPhone}`,
          status: 'HUMAN_AGENT'
        }
      })
    })

    // 4. Agregar notificaciones persistidas en base de datos (Web Push & Eventos de Servidor)
    try {
      const dbNotifs = await prisma.appNotification.findMany({
        where: { userId: session.userId },
        take: 30,
        orderBy: { createdAt: 'desc' },
      })

      dbNotifs.forEach((n) => {
        const meta = (n.metadata || {}) as any
        notifications.push({
          id: n.id,
          title: n.title,
          message: n.message,
          category: n.type.startsWith('APPOINTMENT') ? 'appointment' : 'system',
          timestamp: n.createdAt.toISOString(),
          read: n.read,
          link: meta.appUrl || (isBarber ? '/barber/appointments' : '/appointments'),
          metadata: {
            clientName: meta.clientName,
            serviceName: meta.serviceName,
            barberName: meta.barberName,
            date: meta.dateStr,
            status: n.type,
          },
        })
      })
    } catch {
      // safe fallback
    }

    // Sort by timestamp desc
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ notifications: [] })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession()
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { notificationId, read } = body

    if (!notificationId) {
      return NextResponse.json({ error: 'notificationId requerido' }, { status: 400 })
    }

    // Si es un id de base de datos UUID, actualizarlo en prisma
    if (notificationId.includes('-') && !notificationId.startsWith('apt-') && !notificationId.startsWith('note-') && !notificationId.startsWith('system-') && !notificationId.startsWith('plan-') && !notificationId.startsWith('wa-')) {
      await prisma.appNotification.updateMany({
        where: { id: notificationId, userId: session.userId },
        data: {
          read: read !== undefined ? Boolean(read) : true,
          readAt: (read !== false) ? new Date() : null,
        },
      })
    }

    return NextResponse.json({ success: true, notificationId, read: read ?? true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
