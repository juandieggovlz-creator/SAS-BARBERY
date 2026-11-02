import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// Timezone Bogota (UTC-5)
function getTodayRangeBogota() {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  const [{ value: year }, , { value: month }, , { value: day }] = formatter.formatToParts(now)
  
  const todayStart = new Date(`${year}-${month}-${day}T00:00:00-05:00`)
  const todayEnd   = new Date(`${year}-${month}-${day}T23:59:59-05:00`)
  
  return { todayStart, todayEnd, localDateStr: `${year}-${month}-${day}` }
}

function getMonthRangeBogota() {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  const [{ value: year }, , { value: month }] = formatter.formatToParts(now)
  
  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
  const monthStart = new Date(`${year}-${month}-01T00:00:00-05:00`)
  const monthEnd   = new Date(`${year}-${month}-${String(lastDay).padStart(2, '0')}T23:59:59-05:00`)
  const monthName  = new Date(monthStart).toLocaleString('es-CO', { timeZone: 'America/Bogota', month: 'long' })
  
  return { monthStart, monthEnd, monthName }
}

export async function GET() {
  let session = await getSession('BARBER')
  if (!session) {
    session = await getSession('OWNER')
  }
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    let targetBarberId = session.barberId

    // If owner/superadmin visits directly, load their business's first active barber
    if (!targetBarberId && session.businessId) {
      const firstBarber = await prisma.barber.findFirst({
        where: { businessId: session.businessId, status: 'ACTIVE' },
        orderBy: { createdAt: 'asc' }
      }) || await prisma.barber.findFirst({
        where: { businessId: session.businessId },
        orderBy: { createdAt: 'asc' }
      })
      targetBarberId = firstBarber?.id || null
    }

    if (!targetBarberId) {
      return NextResponse.json({ error: 'No se encontró un barbero asignado a esta cuenta' }, { status: 404 })
    }

    const barber = await prisma.barber.findUnique({
      where: { id: targetBarberId },
      include: { 
        business: { select: { id: true, name: true, phone: true } },
        user: { select: { email: true } }
      }
    })

    if (!barber) {
      return NextResponse.json({ error: 'Barbero no encontrado' }, { status: 404 })
    }

    const { todayStart, todayEnd, localDateStr } = getTodayRangeBogota()
    const { monthStart, monthEnd, monthName } = getMonthRangeBogota()

    // 1. Citas de HOY para este barbero (Multi-tenant estricto)
    const appointmentsToday = await prisma.appointment.findMany({
      where: {
        barberId: barber.id,
        businessId: barber.businessId,
        date: { gte: todayStart, lte: todayEnd }
      },
      include: {
        client: { select: { id: true, name: true, phone: true, email: true, internalNotes: true } },
        service: { select: { id: true, name: true, price: true, duration: true, category: true } },
        payment: { select: { id: true, status: true, method: true, paidAt: true, paymentCode: true, amount: true } }
      },
      orderBy: { date: 'asc' }
    })

    // 2. Citas del MES para métricas de rendimiento real
    const appointmentsMonth = await prisma.appointment.findMany({
      where: {
        barberId: barber.id,
        businessId: barber.businessId,
        date: { gte: monthStart, lte: monthEnd }
      },
      include: {
        service: { select: { price: true } },
        payment: { select: { status: true, amount: true } }
      }
    })

    // Métricas del día
    const total = appointmentsToday.length
    const pending = appointmentsToday.filter(a => a.status === 'PENDING').length
    const confirmed = appointmentsToday.filter(a => a.status === 'CONFIRMED').length
    const inProgress = appointmentsToday.filter(a => a.status === 'IN_PROGRESS').length
    const completed = appointmentsToday.filter(a => a.status === 'COMPLETED').length
    const cancelled = appointmentsToday.filter(a => a.status === 'CANCELLED').length
    const noShow = appointmentsToday.filter(a => a.status === 'NO_SHOW').length

    const commissionPercent = barber.commission ?? 0
    const commissionRate = commissionPercent / 100

    // PAID = payment.status is 'PAID' or 'COMPLETED' (both mean service was actually paid)
    const isPaid = (status?: string | null) => status === 'PAID' || status === 'COMPLETED'

    // REGLAS FINANCIERAS OBLIGATORIAS:
    // A) COMISIÓN ESTIMADA: Potencial de citas programadas/activas hoy (PENDING, CONFIRMED, IN_PROGRESS)
    const commissionEstimatedToday = appointmentsToday
      .filter(a => a.status === 'PENDING' || a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS')
      .reduce((sum, a) => sum + (Number(a.service?.price ?? 0) * commissionRate), 0)

    // B) COMISIÓN GENERADA: Basada en servicios COMPLETADOS
    const commissionEarnedToday = appointmentsToday
      .filter(a => a.status === 'COMPLETED')
      .reduce((sum, a) => sum + (Number(a.service?.price ?? 0) * commissionRate), 0)

    // C) COMISIÓN COBRADA: Basada en servicios COMPLETADOS con pago confirmado (PAID o COMPLETED)
    const commissionPaidToday = appointmentsToday
      .filter(a => a.status === 'COMPLETED' && isPaid(a.payment?.status))
      .reduce((sum, a) => sum + (Number(a.service?.price ?? 0) * commissionRate), 0)

    // D) INGRESOS REALES (Pagos confirmados)
    const revenueRealToday = appointmentsToday
      .filter(a => isPaid(a.payment?.status))
      .reduce((sum, a) => sum + Number(a.payment?.amount ?? 0), 0)

    // 3. PRÓXIMA CITA:
    // Prioridad 1: Cita en servicio actualmente (IN_PROGRESS)
    // Prioridad 2: Cita confirmada (CONFIRMED) o pendiente (PENDING) más próxima
    const inProgressAppt = appointmentsToday.find(a => a.status === 'IN_PROGRESS')
    const nextUpcomingAppt = inProgressAppt || appointmentsToday.find(a => 
      a.status === 'CONFIRMED' || a.status === 'PENDING'
    ) || null

    // 4. Clientes únicos de hoy con historial
    const clientMap = new Map<string, {
      id: string
      name: string
      phone: string
      email?: string | null
      time: string
      serviceName: string
      servicePrice: number
      status: string
      totalVisits: number
      internalNotes?: string | null
    }>()

    for (const a of appointmentsToday) {
      if (a.client && !clientMap.has(a.clientId)) {
        const pastVisits = await prisma.appointment.count({
          where: {
            barberId: barber.id,
            businessId: barber.businessId,
            clientId: a.clientId,
            status: 'COMPLETED'
          }
        })

        clientMap.set(a.clientId, {
          id: a.client.id,
          name: a.client.name,
          phone: a.client.phone,
          email: a.client.email,
          time: new Date(a.date).toLocaleTimeString('es-CO', {
            timeZone: 'America/Bogota',
            hour: '2-digit',
            minute: '2-digit'
          }),
          serviceName: a.service?.name ?? 'Servicio',
          servicePrice: Number(a.service?.price ?? 0),
          status: a.status,
          totalVisits: pastVisits,
          internalNotes: a.client.internalNotes
        })
      }
    }

    const todayClientsList = Array.from(clientMap.values())

    // 5. Métricas del Mes (Rendimiento Real)
    const monthCompletedAppts = appointmentsMonth.filter(a => a.status === 'COMPLETED')
    const monthCompletedCount = monthCompletedAppts.length
    const monthUniqueClients = new Set(monthCompletedAppts.map(a => a.clientId)).size
    const monthCommissionGenerated = monthCompletedAppts.reduce((sum, a) => sum + (Number(a.service?.price ?? 0) * commissionRate), 0)
    const monthCommissionPaid = appointmentsMonth
      .filter(a => a.status === 'COMPLETED' && isPaid(a.payment?.status))
      .reduce((sum, a) => sum + (Number(a.service?.price ?? 0) * commissionRate), 0)
    const monthRevenueReal = appointmentsMonth
      .filter(a => isPaid(a.payment?.status))
      .reduce((sum, a) => sum + Number(a.payment?.amount ?? 0), 0)

    // 6. Notificaciones recientes para este barbero
    const recentAppointments = await prisma.appointment.findMany({
      where: {
        barberId: barber.id,
        businessId: barber.businessId
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { name: true } },
        service: { select: { name: true } }
      }
    })

    const notifications = recentAppointments.map(a => ({
      id: `apt-${a.id}`,
      title: a.status === 'COMPLETED' ? 'Cita Completada' :
             a.status === 'CANCELLED' ? 'Cita Cancelada' :
             a.status === 'CONFIRMED' ? 'Llegada de Cliente' : 'Nueva Reserva',
      message: `${a.client?.name || 'Cliente'} - ${a.service?.name || 'Servicio'} (${new Date(a.date).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit' })})`,
      timestamp: a.createdAt.toISOString(),
      status: a.status,
      reservationCode: a.reservationCode
    }))

    // Formatear citas del día
    const formattedTodayAppts = appointmentsToday.map(a => {
      const price = Number(a.service?.price ?? 0)
      const barberCommission = price * commissionRate

      return {
        id: a.id,
        reservationCode: a.reservationCode,
        date: a.date.toISOString(),
        time: new Date(a.date).toLocaleTimeString('es-CO', {
          timeZone: 'America/Bogota',
          hour: '2-digit',
          minute: '2-digit'
        }),
        clientName: a.client?.name ?? 'Cliente',
        clientPhone: a.client?.phone ?? '',
        clientEmail: a.client?.email ?? '',
        clientId: a.client?.id ?? '',
        serviceName: a.service?.name ?? 'Servicio',
        serviceId: a.service?.id ?? '',
        price,
        barberCommission,
        duration: a.service?.duration ?? 30,
        status: a.status,
        payment: a.payment ? {
          id: a.payment.id,
          status: a.payment.status,
          method: a.payment.method,
          amount: Number(a.payment.amount),
          paymentCode: a.payment.paymentCode,
          paidAt: a.payment.paidAt?.toISOString() ?? null
        } : null,
        notes: a.notes,
        clientNotes: a.client?.internalNotes ?? null
      }
    })

    return NextResponse.json({
      barber: {
        id: barber.id,
        name: barber.name,
        specialty: barber.specialty ?? 'Barbero Profesional',
        avatar: barber.avatar ?? null,
        status: barber.status,
        commissionRate: barber.commission ?? 0,
        phone: barber.phone ?? '',
        email: barber.user?.email ?? '',
        businessName: barber.business?.name ?? 'BarberOS'
      },
      todayDateInfo: {
        dateStr: localDateStr,
        formattedDate: new Date(todayStart).toLocaleDateString('es-CO', {
          timeZone: 'America/Bogota',
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        currentTime: new Date().toLocaleTimeString('es-CO', {
          timeZone: 'America/Bogota',
          hour: '2-digit',
          minute: '2-digit'
        })
      },
      todayStats: {
        total,
        pending,
        confirmed,
        inProgress,
        completed,
        cancelled,
        noShow,
        clientsAttendedToday: completed,
        commissionEstimatedToday,
        commissionEarnedToday,
        commissionPaidToday,
        revenueRealToday
      },
      nextAppt: nextUpcomingAppt ? {
        id: nextUpcomingAppt.id,
        reservationCode: nextUpcomingAppt.reservationCode,
        date: nextUpcomingAppt.date.toISOString(),
        time: new Date(nextUpcomingAppt.date).toLocaleTimeString('es-CO', {
          timeZone: 'America/Bogota',
          hour: '2-digit',
          minute: '2-digit'
        }),
        clientName: nextUpcomingAppt.client?.name ?? 'Cliente',
        clientPhone: nextUpcomingAppt.client?.phone ?? '',
        clientId: nextUpcomingAppt.client?.id ?? '',
        serviceName: nextUpcomingAppt.service?.name ?? 'Servicio',
        price: Number(nextUpcomingAppt.service?.price ?? 0),
        barberCommission: Number(nextUpcomingAppt.service?.price ?? 0) * commissionRate,
        duration: nextUpcomingAppt.service?.duration ?? 30,
        status: nextUpcomingAppt.status,
        notes: nextUpcomingAppt.notes
      } : null,
      todayAppointments: formattedTodayAppts,
      todayClients: todayClientsList,
      monthPerformance: {
        monthName,
        completedCount: monthCompletedCount,
        uniqueClients: monthUniqueClients,
        commissionGenerated: monthCommissionGenerated,
        commissionPaid: monthCommissionPaid,
        revenueReal: monthRevenueReal
      },
      notifications
    })

  } catch (error) {
    console.error('Barber Dashboard API Error:', error)
    return NextResponse.json({ error: 'Error al cargar dashboard del barbero' }, { status: 500 })
  }
}
