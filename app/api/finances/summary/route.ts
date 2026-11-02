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

  // Main date range (defaults to current month)
  const now = new Date()
  const startDate = fromStr ? new Date(fromStr) : new Date(now.getFullYear(), now.getMonth(), 1)
  const endDate = toStr ? new Date(toStr) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  // Helpers for time ranges
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  try {
    // ── 1. Pagos cobrados en el rango seleccionado ────────────────────────
    const payments = await prisma.payment.findMany({
      where: {
        businessId,
        status: { in: ['PAID', 'COMPLETED'] },
        OR: [
          { appointment: { date: { gte: startDate, lte: endDate } } },
          { appointmentId: null, createdAt: { gte: startDate, lte: endDate } }
        ]
      },
      include: {
        appointment: {
          include: { client: true, service: true, barber: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // ── 2. Gastos en el rango ──────────────────────────────────────────────
    const expenses = await prisma.expense.findMany({
      where: { businessId, date: { gte: startDate, lte: endDate } },
      orderBy: { date: 'desc' }
    })

    // ── 3. Citas COMPLETADAS en el rango (para comisiones) ─────────────────
    const completedAppts = await prisma.appointment.findMany({
      where: {
        businessId,
        status: 'COMPLETED',
        date: { gte: startDate, lte: endDate }
      },
      include: { barber: true, service: true, client: true, payment: true }
    })

    // ── 4. Cobros / Pagos PENDIENTES ───────────────────────────────────────
    // Payments that have status PENDING or appointments COMPLETED with no paid payment
    const pendingPaymentsList = await prisma.payment.findMany({
      where: {
        businessId,
        status: 'PENDING'
      },
      include: {
        appointment: {
          include: { client: true, service: true, barber: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // ── 5. Breakdowns hoy / semana / mes ──────────────────────────────────
    const [paymentsToday, expensesToday, paymentsWeek, expensesWeek, paymentsMonth, expensesMonth] = await Promise.all([
      prisma.payment.findMany({ where: { businessId, status: { in: ['PAID', 'COMPLETED'] }, OR: [{ appointment: { date: { gte: todayStart, lte: todayEnd } } }, { appointmentId: null, createdAt: { gte: todayStart, lte: todayEnd } }] } }),
      prisma.expense.findMany({ where: { businessId, date: { gte: todayStart, lte: todayEnd } } }),
      prisma.payment.findMany({ where: { businessId, status: { in: ['PAID', 'COMPLETED'] }, OR: [{ appointment: { date: { gte: weekStart, lte: weekEnd } } }, { appointmentId: null, createdAt: { gte: weekStart, lte: weekEnd } }] } }),
      prisma.expense.findMany({ where: { businessId, date: { gte: weekStart, lte: weekEnd } } }),
      prisma.payment.findMany({ where: { businessId, status: { in: ['PAID', 'COMPLETED'] }, OR: [{ appointment: { date: { gte: monthStart, lte: monthEnd } } }, { appointmentId: null, createdAt: { gte: monthStart, lte: monthEnd } }] } }),
      prisma.expense.findMany({ where: { businessId, date: { gte: monthStart, lte: monthEnd } } }),
    ])

    const sum = (arr: { amount: unknown }[]) => arr.reduce((a, b) => a + Number(b.amount), 0)

    const todayRevenue   = sum(paymentsToday)
    const todayExpenses  = sum(expensesToday)
    const weekRevenue    = sum(paymentsWeek)
    const weekExpenses   = sum(expensesWeek)
    const monthRevenue   = sum(paymentsMonth)
    const monthExpenses  = sum(expensesMonth)

    // ── 6. Cálculos principales ────────────────────────────────────────────
    const totalRevenue    = sum(payments)
    const totalExpenses   = sum(expenses)
    const grossMargin     = totalRevenue - totalExpenses

    const totalCommissions = completedAppts.reduce((acc, appt) => {
      const price          = Number(appt.service?.price || 0)
      const commissionRate = appt.barber?.commission || 40
      return acc + (price * commissionRate) / 100
    }, 0)

    const netProfit = grossMargin - totalCommissions

    // Dinero disponible hoy: cobrado hoy - gastos hoy
    const availableToday = todayRevenue - todayExpenses

    // Pendiente total a cobrar
    const totalPending = sum(pendingPaymentsList)

    // ── 7. Distribución por método de pago ────────────────────────────────
    const byMethod = {
      CASH:     payments.filter(p => p.method === 'CASH').reduce((a, b) => a + Number(b.amount), 0),
      TRANSFER: payments.filter(p => p.method === 'TRANSFER').reduce((a, b) => a + Number(b.amount), 0),
      CARD:     payments.filter(p => p.method === 'CARD').reduce((a, b) => a + Number(b.amount), 0),
      OTHER:    payments.filter(p => p.method === 'OTHER').reduce((a, b) => a + Number(b.amount), 0),
    }

    const expensesByMethod = {
      CASH:     expenses.filter(e => e.paymentMethod === 'CASH').reduce((a, b) => a + Number(b.amount), 0),
      TRANSFER: expenses.filter(e => e.paymentMethod === 'TRANSFER').reduce((a, b) => a + Number(b.amount), 0),
      CARD:     expenses.filter(e => e.paymentMethod === 'CARD').reduce((a, b) => a + Number(b.amount), 0),
      OTHER:    expenses.filter(e => e.paymentMethod === 'OTHER').reduce((a, b) => a + Number(b.amount), 0),
    }

    // ── 8. Rendimiento por barbero ─────────────────────────────────────────
    const allBarbers = await prisma.barber.findMany({
      where: { businessId },
      orderBy: { name: 'asc' }
    })

    const barberMap: Record<string, {
      id: string; name: string; servicesCount: number;
      revenue: number; commission: number; commissionRate: number;
      clientIds: Set<string>
    }> = {}

    for (const b of allBarbers) {
      barberMap[b.id] = {
        id: b.id,
        name: b.name,
        servicesCount: 0,
        revenue: 0,
        commission: 0,
        commissionRate: b.commission ?? 40,
        clientIds: new Set()
      }
    }

    for (const appt of completedAppts) {
      if (!appt.barber) continue
      const bid = appt.barber.id
      if (!barberMap[bid]) {
        barberMap[bid] = {
          id: bid,
          name: appt.barber.name,
          servicesCount: 0,
          revenue: 0,
          commission: 0,
          commissionRate: appt.barber.commission ?? 40,
          clientIds: new Set()
        }
      }
      const price = Number(appt.service?.price || 0)
      const commRate = barberMap[bid].commissionRate
      barberMap[bid].servicesCount++
      barberMap[bid].revenue += price
      barberMap[bid].commission += (price * commRate) / 100
      barberMap[bid].clientIds.add(appt.clientId)
    }

    const barberPerformance = Object.values(barberMap).map(b => ({
      id: b.id,
      name: b.name,
      servicesCount: b.servicesCount,
      clientsCount: b.clientIds.size,
      revenue: b.revenue,
      commission: b.commission,
      commissionRate: b.commissionRate,
      avgTicket: b.servicesCount > 0 ? b.revenue / b.servicesCount : 0
    }))

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalExpenses,
        grossMargin,
        totalCommissions,
        netProfit,
        totalPending,
        availableToday,
      },
      periods: {
        today:   { revenue: todayRevenue,  expenses: todayExpenses,  profit: todayRevenue - todayExpenses },
        week:    { revenue: weekRevenue,   expenses: weekExpenses,   profit: weekRevenue - weekExpenses },
        month:   { revenue: monthRevenue,  expenses: monthExpenses,  profit: monthRevenue - monthExpenses },
      },
      byMethod,
      expensesByMethod,
      payments,
      expenses,
      pendingAppointments: pendingPaymentsList.map(p => ({
        id: p.appointmentId || p.id,
        paymentId: p.id,
        paymentCode: p.paymentCode,
        reservationCode: p.appointment?.reservationCode,
        date: p.appointment?.date || p.createdAt,
        status: p.appointment?.status || 'COMPLETED',
        paymentStatus: p.status,
        clientName: p.appointment?.client?.name || 'Cliente',
        serviceName: p.appointment?.service?.name || 'Servicio',
        servicePrice: Number(p.amount),
        barberName: p.appointment?.barber?.name || 'Barbero',
      })),
      barberPerformance,
    })
  } catch (error) {
    console.error('Financial Summary Error:', error)
    return NextResponse.json({ error: 'Error al obtener resumen financiero' }, { status: 500 })
  }
}
