import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await getSession()
  if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const businessId = session.businessId

  const fromStr = searchParams.get('from')
  const toStr = searchParams.get('to')

  const now = new Date()

  // Always compute today boundaries (local midnight)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  // Selected period boundaries
  const defaultFrom = todayStart
  const defaultTo = todayEnd
  const startDate = fromStr ? new Date(fromStr) : defaultFrom
  const endDate = toStr ? new Date(toStr) : defaultTo

  // Previous period (same length, right before startDate)
  const durationMs = endDate.getTime() - startDate.getTime()
  const prevStartDate = new Date(startDate.getTime() - durationMs)
  const prevEndDate = new Date(startDate.getTime() - 1)

  // Month boundaries for clientStats
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  // 15 and 30 days ago for "próximos a regresar"
  const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  try {
    // ─── SELECTED PERIOD DATA ────────────────────────────────────────────────

    // 1. Current Period Payments (Revenue)
    const payments = await prisma.payment.findMany({
      where: {
        businessId,
        status: { in: ['PAID', 'COMPLETED'] },
        OR: [
          { appointment: { date: { gte: startDate, lte: endDate } } },
          { appointmentId: null, createdAt: { gte: startDate, lte: endDate } }
        ]
      }
    })
    const totalRevenue = payments.reduce((acc, p) => acc + Number(p.amount), 0)

    // 2. Previous Period Payments (for comparison)
    const prevPayments = await prisma.payment.findMany({
      where: {
        businessId,
        status: { in: ['PAID', 'COMPLETED'] },
        OR: [
          { appointment: { date: { gte: prevStartDate, lte: prevEndDate } } },
          { appointmentId: null, createdAt: { gte: prevStartDate, lte: prevEndDate } }
        ]
      }
    })
    const prevRevenue = prevPayments.reduce((acc, p) => acc + Number(p.amount), 0)

    // 3. Current Period Expenses
    const expenses = await prisma.expense.findMany({
      where: {
        businessId,
        date: { gte: startDate, lte: endDate }
      }
    })
    const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount), 0)

    // Previous Period Expenses
    const prevExpenses = await prisma.expense.findMany({
      where: {
        businessId,
        date: { gte: prevStartDate, lte: prevEndDate }
      }
    })
    const prevTotalExpenses = prevExpenses.reduce((acc, e) => acc + Number(e.amount), 0)

    // 4. Net Profit
    const netProfit = totalRevenue - totalExpenses
    const prevNetProfit = prevRevenue - prevTotalExpenses

    // 5. Appointments in Selected Period
    const appointments = await prisma.appointment.findMany({
      where: {
        businessId,
        date: { gte: startDate, lte: endDate }
      },
      include: {
        client: true,
        barber: true,
        service: true,
        payment: true
      },
      orderBy: { date: 'asc' }
    })

    // Previous Period Appointments count
    const prevApptsCount = await prisma.appointment.count({
      where: {
        businessId,
        date: { gte: prevStartDate, lte: prevEndDate }
      }
    })

    // 6. New Clients in Selected Period
    const newClientsCount = await prisma.client.count({
      where: {
        businessId,
        createdAt: { gte: startDate, lte: endDate }
      }
    })

    const prevNewClientsCount = await prisma.client.count({
      where: {
        businessId,
        createdAt: { gte: prevStartDate, lte: prevEndDate }
      }
    })

    // 7. Status Breakdown (selected period)
    const statusCounts = {
      PENDING: appointments.filter(a => a.status === 'PENDING').length,
      CONFIRMED: appointments.filter(a => a.status === 'CONFIRMED').length,
      COMPLETED: appointments.filter(a => a.status === 'COMPLETED').length,
      CANCELLED: appointments.filter(a => a.status === 'CANCELLED').length,
      NO_SHOW: appointments.filter(a => a.status === 'NO_SHOW').length,
    }

    // ─── TODAY STATS (always today, regardless of selected period) ───────────

    const todayAppointmentsAll = await prisma.appointment.findMany({
      where: {
        businessId,
        date: { gte: todayStart, lte: todayEnd }
      },
      include: { service: true, client: true, barber: true, payment: true },
      orderBy: { date: 'asc' }
    })

    const todayPayments = await prisma.payment.findMany({
      where: {
        businessId,
        status: { in: ['PAID', 'COMPLETED'] },
        OR: [
          { appointment: { date: { gte: todayStart, lte: todayEnd } } },
          { appointmentId: null, createdAt: { gte: todayStart, lte: todayEnd } }
        ]
      }
    })
    const todayRevenue = todayPayments.reduce((acc, p) => acc + Number(p.amount), 0)

    const todayExpensesList = await prisma.expense.findMany({
      where: {
        businessId,
        date: { gte: todayStart, lte: todayEnd }
      }
    })
    const todayExpenses = todayExpensesList.reduce((acc, e) => acc + Number(e.amount), 0)

    const todayCompleted = todayAppointmentsAll.filter(a => a.status === 'COMPLETED').length
    const todayPending = todayAppointmentsAll.filter(a => a.status === 'PENDING' || a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS').length
    const todayTotal = todayAppointmentsAll.length

    const todayStats = {
      revenue: todayRevenue,
      expenses: todayExpenses,
      estimatedProfit: todayRevenue - todayExpenses,
      totalAppointments: todayTotal,
      completed: todayCompleted,
      pending: todayPending,
    }

    // ─── PENDING PAYMENTS (citas completadas sin pago o cobro pendiente) ────

    const pendingPaymentItems = await prisma.payment.findMany({
      where: {
        businessId,
        status: 'PENDING'
      },
      include: {
        appointment: {
          include: { client: true, service: true, barber: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    const pendingPaymentTotal = pendingPaymentItems.reduce(
      (acc, p) => acc + Number(p.amount),
      0
    )

    const pendingPayments = {
      count: pendingPaymentItems.length,
      total: pendingPaymentTotal,
      items: pendingPaymentItems.map(p => ({
        id: p.appointmentId || p.id,
        paymentId: p.id,
        paymentCode: p.paymentCode,
        reservationCode: p.appointment?.reservationCode,
        clientName: p.appointment?.client?.name || 'Cliente',
        serviceName: p.appointment?.service?.name || 'Servicio',
        barberName: p.appointment?.barber?.name || 'Barbero',
        price: Number(p.amount),
        date: p.appointment?.date || p.createdAt
      }))
    }

    // ─── BARBER PERFORMANCE RANKING ──────────────────────────────────────────

    const barbers = await prisma.barber.findMany({
      where: { businessId, status: 'ACTIVE' },
      include: { schedules: true }
    })

    const barberPerformance = barbers.map(b => {
      const barberAppts = appointments.filter(a => a.barberId === b.id)
      const completedAppts = barberAppts.filter(a => a.status === 'COMPLETED')
      const revenue = completedAppts.reduce((acc, a) => acc + Number(a.service?.price || 0), 0)
      const commissionRate = b.commission || 40
      const estimatedCommission = (revenue * commissionRate) / 100

      return {
        id: b.id,
        name: b.name,
        avatar: b.avatar,
        specialty: b.specialty,
        totalAppointments: barberAppts.length,
        completedAppointments: completedAppts.length,
        revenue,
        estimatedCommission,
        hasSchedule: b.schedules.length > 0
      }
    }).sort((a, b) => b.revenue - a.revenue)

    // ─── TOP SERVICES RANKING ─────────────────────────────────────────────────

    const services = await prisma.service.findMany({
      where: { businessId, isActive: true }
    })

    const servicePerformance = services.map(s => {
      const serviceAppts = appointments.filter(a => a.serviceId === s.id && a.status !== 'CANCELLED')
      const revenue = serviceAppts.reduce((acc, a) => acc + Number(a.service?.price || 0), 0)

      return {
        id: s.id,
        name: s.name,
        category: s.category || 'General',
        count: serviceAppts.length,
        revenue
      }
    }).filter(s => s.count > 0).sort((a, b) => b.count - a.count)

    // ─── CLIENT STATS ─────────────────────────────────────────────────────────

    const newThisMonth = await prisma.client.count({
      where: { businessId, createdAt: { gte: monthStart, lte: monthEnd } }
    })

    // Recurring: clients with >= 2 completed appointments
    const allClients = await prisma.client.findMany({
      where: { businessId },
      select: { id: true }
    })
    const totalClients = allClients.length

    const completedAppts = await prisma.appointment.groupBy({
      by: ['clientId'],
      where: { businessId, status: 'COMPLETED' },
      _count: { id: true },
      having: { id: { _count: { gte: 2 } } }
    })
    const recurringClients = completedAppts.length

    // Coming back: clients whose last appointment was between 15-30 days ago
    const comingBackCandidates = await prisma.appointment.findMany({
      where: {
        businessId,
        status: 'COMPLETED',
        date: { gte: thirtyDaysAgo, lte: fifteenDaysAgo }
      },
      select: { clientId: true },
      distinct: ['clientId']
    })
    const comingBack = comingBackCandidates.length

    const clientStats = {
      total: totalClients,
      newThisMonth,
      recurring: recurringClients,
      comingBack
    }

    // ─── ALERTS ──────────────────────────────────────────────────────────────

    const alerts: Array<{ type: 'warning' | 'danger' | 'info'; message: string }> = []

    const pendingCount = await prisma.appointment.count({
      where: { businessId, status: 'PENDING' }
    })
    if (pendingCount > 0) {
      alerts.push({ type: 'warning', message: `${pendingCount} cita${pendingCount > 1 ? 's' : ''} pendiente${pendingCount > 1 ? 's' : ''} por confirmar` })
    }

    if (pendingPaymentItems.length > 0) {
      alerts.push({ type: 'danger', message: `${pendingPaymentItems.length} pago${pendingPaymentItems.length > 1 ? 's' : ''} pendiente${pendingPaymentItems.length > 1 ? 's' : ''} por registrar` })
    }

    const barbersWithoutSchedule = barbers.filter(b => b.schedules.length === 0)
    if (barbersWithoutSchedule.length > 0) {
      barbersWithoutSchedule.forEach(b => {
        alerts.push({ type: 'info', message: `${b.name} no tiene horario configurado` })
      })
    }

    // Helper for percentage change calculation
    const calcChange = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0
      return Math.round(((curr - prev) / prev) * 100 * 10) / 10
    }

    return NextResponse.json({
      // Legacy metrics (keep for backwards compat)
      metrics: {
        revenue: { value: totalRevenue, change: calcChange(totalRevenue, prevRevenue) },
        expenses: { value: totalExpenses, change: calcChange(totalExpenses, prevTotalExpenses) },
        netProfit: { value: netProfit, change: calcChange(netProfit, prevNetProfit) },
        appointments: { value: appointments.length, change: calcChange(appointments.length, prevApptsCount) },
        newClients: { value: newClientsCount, change: calcChange(newClientsCount, prevNewClientsCount) },
        completedServices: { value: statusCounts.COMPLETED, change: 0 }
      },
      statusCounts,
      todayAppointments: appointments.slice(0, 10).map(a => ({
        id: a.id,
        reservationCode: a.reservationCode,
        date: a.date,
        status: a.status,
        client: a.client,
        barber: a.barber,
        service: a.service,
        price: Number(a.service?.price || 0)
      })),
      // New blocks
      todayStats,
      pendingPayments,
      barberPerformance,
      servicePerformance,
      clientStats,
      alerts
    })
  } catch (error) {
    console.error("Overview API Error:", error)
    return NextResponse.json({ error: 'Error al calcular visión general' }, { status: 500 })
  }
}
