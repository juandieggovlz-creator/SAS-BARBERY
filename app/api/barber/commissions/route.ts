import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// Get today range in Bogota timezone
function getTodayRange() {
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
  return { todayStart, todayEnd }
}

// Get week boundaries in Bogota timezone
function getWeekRange(weeksOffset = 0) {
  const now = new Date()
  const nowBogota = new Date(now.toLocaleString('en-US', { timeZone: 'America/Bogota' }))
  
  const dayOfWeek = nowBogota.getDay() // 0 = Sunday
  const monday = new Date(nowBogota)
  monday.setDate(nowBogota.getDate() - ((dayOfWeek + 6) % 7) + (weeksOffset * 7))
  monday.setHours(0, 0, 0, 0)
  
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  
  // Convert back to UTC offsets for DB queries
  const start = new Date(monday.toISOString().replace('Z', '-05:00').slice(0, -6) + '-05:00')
  const end = new Date(sunday.toISOString().replace('Z', '-05:00').slice(0, -6) + '-05:00')
  
  return { start, end }
}

function getMonthRange(monthOffset = 0) {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit'
  })
  const parts = formatter.formatToParts(now)
  const year = parseInt(parts.find(p => p.type === 'year')!.value)
  const month = parseInt(parts.find(p => p.type === 'month')!.value) + monthOffset

  const targetYear = month <= 0 ? year - 1 : month > 12 ? year + 1 : year
  const targetMonth = month <= 0 ? 12 + month : month > 12 ? month - 12 : month

  const start = new Date(`${targetYear}-${String(targetMonth).padStart(2, '0')}-01T00:00:00-05:00`)
  const end = new Date(start)
  end.setMonth(end.getMonth() + 1)
  end.setMilliseconds(-1)
  
  return { start, end, label: `${String(targetMonth).padStart(2, '0')}/${targetYear}` }
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
    const { start: monthStart, end: monthEnd } = getMonthRange(0)

    // Fetch all COMPLETED appointments for this barber this month (with payment)
    const completedThisMonth = await prisma.appointment.findMany({
      where: {
        barberId: barber.id,
        businessId: barber.businessId,
        status: 'COMPLETED',
        date: { gte: monthStart, lte: monthEnd }
      },
      include: {
        client: { select: { name: true, phone: true } },
        service: { select: { name: true, price: true } },
        payment: { select: { status: true, method: true, amount: true, paymentCode: true, paidAt: true } }
      },
      orderBy: { date: 'desc' }
    })

    // PAID = payment.status is 'PAID' or 'COMPLETED' (both mean service was paid)
    const isPaid = (status?: string | null) => status === 'PAID' || status === 'COMPLETED'

    // --- COMISIÓN ESTIMADA: ALL completed (payment pending or not)
    const commissionEstimated = completedThisMonth
      .reduce((sum, a) => sum + Number(a.service?.price ?? 0) * commissionRate, 0)

    // --- COMISIÓN PENDIENTE: completed but payment NOT yet confirmed paid
    const commissionPending = completedThisMonth
      .filter(a => !a.payment || !isPaid(a.payment.status))
      .reduce((sum, a) => sum + Number(a.service?.price ?? 0) * commissionRate, 0)

    // --- COMISIÓN GENERADA (PAGADA): completed WITH payment confirmed (PAID or COMPLETED)
    const commissionPaid = completedThisMonth
      .filter(a => isPaid(a.payment?.status))
      .reduce((sum, a) => sum + Number(a.service?.price ?? 0) * commissionRate, 0)

    // Revenue generated (all completed services)
    const revenueEstimated = completedThisMonth
      .reduce((sum, a) => sum + Number(a.service?.price ?? 0), 0)

    // Revenue real (only confirmed paid)
    const revenueReal = completedThisMonth
      .filter(a => isPaid(a.payment?.status))
      .reduce((sum, a) => sum + Number(a.payment?.amount ?? 0), 0)

    // Pending cuentas por cobrar (completed but not confirmed paid)
    const pendingRevenue = completedThisMonth
      .filter(a => !a.payment || !isPaid(a.payment.status))
      .reduce((sum, a) => sum + Number(a.service?.price ?? 0), 0)

    // Weekly history (last 4 weeks)
    const weeklyHistory = []
    for (let i = 0; i >= -3; i--) {
      const { start, end } = getWeekRange(i)
      const weekCompleted = await prisma.appointment.findMany({
        where: {
          barberId: barber.id,
          businessId: barber.businessId,
          status: 'COMPLETED',
          date: { gte: start, lte: end }
        },
        include: {
          service: { select: { price: true } },
          payment: { select: { status: true } }
        }
      })

      const weekRevEstimated = weekCompleted.reduce((s, a) => s + Number(a.service?.price ?? 0), 0)
      const weekCommEstimated = weekRevEstimated * commissionRate
      const weekCommPaid = weekCompleted
        .filter(a => a.payment?.status === 'PAID' || a.payment?.status === 'COMPLETED')
        .reduce((s, a) => s + Number(a.service?.price ?? 0) * commissionRate, 0)
      
      const hasPaidAll = weekCompleted.length > 0 && weekCompleted.every(a => a.payment?.status === 'PAID' || a.payment?.status === 'COMPLETED')
      const isPastWeek = i < 0

      weeklyHistory.push({
        weekOffset: i,
        start: start.toISOString(),
        end: end.toISOString(),
        label: i === 0 ? 'Semana Actual' : `Semana del ${start.toLocaleDateString('es-CO', { timeZone: 'America/Bogota', day: 'numeric', month: 'short' })}`,
        servicesCompleted: weekCompleted.length,
        revenueEstimated: weekRevEstimated,
        commissionEstimated: weekCommEstimated,
        commissionPaid: weekCommPaid,
        status: !isPastWeek ? 'IN_PROGRESS' : hasPaidAll ? 'PAID' : 'PENDING'
      })
    }

    // Appointment detail list (current month)
    const appointmentHistory = completedThisMonth.map(a => ({
      id: a.id,
      date: a.date.toISOString(),
      clientName: a.client?.name ?? 'Cliente',
      clientPhone: a.client?.phone ?? '',
      serviceName: a.service?.name ?? 'Servicio',
      serviceValue: Number(a.service?.price ?? 0),
      commission: Number(a.service?.price ?? 0) * commissionRate,
      paymentStatus: (a.payment?.status === 'COMPLETED' || a.payment?.status === 'PAID') ? 'PAID' : (a.payment?.status ?? 'PENDING'),
      paymentMethod: a.payment?.method ?? null,
      paymentCode: a.payment?.paymentCode ?? null,
      paidAt: a.payment?.paidAt?.toISOString() ?? null
    }))

    const { searchParams } = new URL(request.url)
    const filterDateParam = searchParams.get('date')

    const { todayStart, todayEnd } = getTodayRange()
    const filterDateStr = filterDateParam && /^\d{4}-\d{2}-\d{2}$/.test(filterDateParam) ? filterDateParam : null

    let filterStart = todayStart
    let filterEnd = todayEnd
    let filterDateFormatted = new Date(todayStart).toLocaleDateString('es-CO', {
      timeZone: 'America/Bogota',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    if (filterDateStr) {
      filterStart = new Date(`${filterDateStr}T00:00:00-05:00`)
      filterEnd   = new Date(`${filterDateStr}T23:59:59-05:00`)
      filterDateFormatted = new Date(filterStart).toLocaleDateString('es-CO', {
        timeZone: 'America/Bogota',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    }

    const completedFilteredDate = await prisma.appointment.findMany({
      where: {
        barberId: barber.id,
        businessId: barber.businessId,
        status: 'COMPLETED',
        date: { gte: filterStart, lte: filterEnd }
      },
      include: {
        client: { select: { name: true, phone: true } },
        service: { select: { name: true, price: true } },
        payment: { select: { status: true, method: true, amount: true, paidAt: true } }
      },
      orderBy: { date: 'desc' }
    })

    const filteredServicesCompleted = completedFilteredDate.length
    const filteredRevenueEstimated = completedFilteredDate.reduce((sum, a) => sum + Number(a.service?.price ?? 0), 0)
    const filteredCommissionEarned = filteredRevenueEstimated * commissionRate
    const filteredCommissionPaid = completedFilteredDate
      .filter(a => isPaid(a.payment?.status))
      .reduce((sum, a) => sum + (Number(a.service?.price ?? 0) * commissionRate), 0)

    const completedToday = completedThisMonth.filter(a => {
      const d = new Date(a.date)
      return d >= todayStart && d <= todayEnd
    })

    const todayServicesCompleted = completedToday.length
    const todayRevenueEstimated = completedToday.reduce((sum, a) => sum + Number(a.service?.price ?? 0), 0)
    const todayCommissionEarned = todayRevenueEstimated * commissionRate
    const todayCommissionPaid = completedToday
      .filter(a => isPaid(a.payment?.status))
      .reduce((sum, a) => sum + (Number(a.service?.price ?? 0) * commissionRate), 0)

    return NextResponse.json({
      commissionRate: barber.commission ?? 0,
      today: {
        servicesCompleted: todayServicesCompleted,
        revenueEstimated: todayRevenueEstimated,
        commissionEarned: todayCommissionEarned,
        commissionPaid: todayCommissionPaid
      },
      selectedDayStats: {
        dateStr: filterDateStr || new Date().toISOString().split('T')[0],
        formattedDate: filterDateFormatted,
        servicesCompleted: filteredServicesCompleted,
        revenueEstimated: filteredRevenueEstimated,
        commissionEarned: filteredCommissionEarned,
        commissionPaid: filteredCommissionPaid,
        appointments: completedFilteredDate.map(a => ({
          id: a.id,
          date: a.date.toISOString(),
          clientName: a.client?.name ?? 'Cliente',
          clientPhone: a.client?.phone ?? '',
          serviceName: a.service?.name ?? 'Servicio',
          serviceValue: Number(a.service?.price ?? 0),
          commission: Number(a.service?.price ?? 0) * commissionRate,
          paymentStatus: isPaid(a.payment?.status) ? 'PAID' : (a.payment?.status ?? 'PENDING'),
          paymentMethod: a.payment?.method ?? null,
          paidAt: a.payment?.paidAt?.toISOString() ?? null
        }))
      },
      thisMonth: {
        servicesCompleted: completedThisMonth.length,
        revenueEstimated,       // All services value (completed)
        revenueReal,            // Only actually paid
        pendingRevenue,         // Cuentas por cobrar
        commissionEstimated,    // Estimated based on all completed
        commissionPending,      // Not yet paid
        commissionPaid          // Actually received
      },
      weeklyHistory,
      appointmentHistory
    })

  } catch (error) {
    console.error('Barber Commissions API Error:', error)
    return NextResponse.json({ error: 'Error al cargar comisiones' }, { status: 500 })
  }
}
