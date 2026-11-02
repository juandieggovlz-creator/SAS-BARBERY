import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// Get start and end of a month in Bogota timezone
function getMonthRangeBogota(offsetMonths = 0) {
  const now = new Date()
  
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit'
  })
  const parts = formatter.formatToParts(now)
  const year = parseInt(parts.find(p => p.type === 'year')!.value)
  const month = parseInt(parts.find(p => p.type === 'month')!.value) + offsetMonths

  const targetYear = month <= 0 ? year - 1 : month > 12 ? year + 1 : year
  const targetMonth = month <= 0 ? 12 + month : month > 12 ? month - 12 : month

  const start = new Date(`${targetYear}-${String(targetMonth).padStart(2, '0')}-01T00:00:00-05:00`)
  const end = new Date(start)
  end.setMonth(end.getMonth() + 1)
  end.setMilliseconds(-1)

  return { start, end }
}

export async function GET(request: Request) {
  const session = await getSession('BARBER')
  if (!session || session.role !== 'BARBER' || !session.barberId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const barber = await prisma.barber.findUnique({
      where: { id: session.barberId as string }
    })

    if (!barber) {
      return NextResponse.json({ error: 'Barbero no encontrado' }, { status: 404 })
    }

    const commissionRate = (barber.commission ?? 0) / 100
    const { start: monthStart, end: monthEnd } = getMonthRangeBogota(0)
    const { start: prevMonthStart, end: prevMonthEnd } = getMonthRangeBogota(-1)

    // Both PAID and COMPLETED statuses mean the service was actually paid
    const isPaid = (status?: string | null) => status === 'PAID' || status === 'COMPLETED'

    // Current month appointments (COMPLETED only = service was actually done)
    const thisMonthCompleted = await prisma.appointment.findMany({
      where: {
        barberId: barber.id,
        businessId: barber.businessId,
        status: 'COMPLETED',
        date: { gte: monthStart, lte: monthEnd }
      },
      include: {
        service: { select: { id: true, name: true, price: true } },
        client: { select: { id: true } },
        payment: { select: { status: true, amount: true } }
      }
    })

    // Previous month for comparison
    const prevMonthCompleted = await prisma.appointment.findMany({
      where: {
        barberId: barber.id,
        businessId: barber.businessId,
        status: 'COMPLETED',
        date: { gte: prevMonthStart, lte: prevMonthEnd }
      },
      include: {
        service: { select: { id: true, name: true, price: true } },
        payment: { select: { status: true, amount: true } }
      }
    })

    // Commission calculations current month
    // ESTIMADA = all COMPLETED this month (PAID or not)
    const commissionEstimatedMonth = thisMonthCompleted.reduce(
      (sum, a) => sum + Number(a.service?.price ?? 0) * commissionRate, 0
    )
    // GENERADA = only COMPLETED with confirmed payment (PAID or COMPLETED status)
    const commissionEarnedMonth = thisMonthCompleted
      .filter(a => isPaid(a.payment?.status))
      .reduce((sum, a) => sum + Number(a.service?.price ?? 0) * commissionRate, 0)

    // Revenue from confirmed payments this month
    const revenueMonth = thisMonthCompleted
      .filter(a => isPaid(a.payment?.status))
      .reduce((sum, a) => sum + Number(a.payment?.amount ?? 0), 0)

    const revenueMonthEstimated = thisMonthCompleted
      .reduce((sum, a) => sum + Number(a.service?.price ?? 0), 0)

    // Recurring clients: clients with more than 1 appointment with this barber
    const allBarberClients = await prisma.appointment.groupBy({
      by: ['clientId'],
      where: {
        barberId: barber.id,
        businessId: barber.businessId,
        status: 'COMPLETED'
      },
      _count: { clientId: true }
    })
    const totalUniqueClients = allBarberClients.length
    const recurringClients = allBarberClients.filter(c => c._count.clientId > 1).length
    const recurringRate = totalUniqueClients > 0
      ? Math.round((recurringClients / totalUniqueClients) * 100)
      : 0

    // Most performed services this month
    const serviceCountMap: Record<string, { name: string; count: number }> = {}
    for (const appt of thisMonthCompleted) {
      if (!appt.service) continue
      const sid = appt.service.id
      if (!serviceCountMap[sid]) {
        serviceCountMap[sid] = { name: appt.service.name, count: 0 }
      }
      serviceCountMap[sid].count++
    }
    const topServices = Object.values(serviceCountMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Cancellations and no-shows this month
    const cancelledThisMonth = await prisma.appointment.count({
      where: {
        barberId: barber.id,
        businessId: barber.businessId,
        status: { in: ['CANCELLED', 'NO_SHOW'] },
        date: { gte: monthStart, lte: monthEnd }
      }
    })
    const totalThisMonth = thisMonthCompleted.length + cancelledThisMonth
    const cancellationRate = totalThisMonth > 0
      ? Math.round((cancelledThisMonth / totalThisMonth) * 100)
      : 0

    // Average ticket (from COMPLETED services)
    const avgTicket = thisMonthCompleted.length > 0
      ? revenueMonthEstimated / thisMonthCompleted.length
      : 0

    // Clients attended this month
    const clientsThisMonth = new Set(thisMonthCompleted.map(a => a.client?.id)).size

    // Previous month comparison
    const prevCommission = prevMonthCompleted
      .reduce((sum, a) => sum + Number(a.service?.price ?? 0) * commissionRate, 0)
    const prevRevenue = prevMonthCompleted
      .reduce((sum, a) => sum + Number(a.service?.price ?? 0), 0)

    return NextResponse.json({
      period: 'current_month',
      periodLabel: monthStart.toLocaleDateString('es-CO', {
        timeZone: 'America/Bogota',
        month: 'long',
        year: 'numeric'
      }),
      commissionRate: barber.commission ?? 0,
      thisMonth: {
        servicesCompleted: thisMonthCompleted.length,
        clientsAttended: clientsThisMonth,
        revenueEstimated: revenueMonthEstimated,   // All COMPLETED services value
        revenueReal: revenueMonth,                  // Only PAID payments
        commissionEstimated: commissionEstimatedMonth,
        commissionEarned: commissionEarnedMonth,
        avgTicket,
        cancellationRate,
        recurringClientsRate: recurringRate,
        topServices
      },
      prevMonth: {
        servicesCompleted: prevMonthCompleted.length,
        revenueEstimated: prevRevenue,
        commissionEstimated: prevCommission
      }
    })

  } catch (error) {
    console.error('Barber Performance API Error:', error)
    return NextResponse.json({ error: 'Error al cargar rendimiento' }, { status: 500 })
  }
}
