import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { resolveAppointmentFinancials } from '@/lib/booking/booking-metadata'

const ALLOWED_ROLES = ['OWNER', 'BRANCH_ADMIN', 'SUPER_ADMIN', 'ROOT_PLATFORM_OWNER']

/**
 * Distribuye el ingreso cobrado de un pago entre los métodos reales utilizados:
 * - Si fue un pago con anticipo verificado (ej. $10.000 por TRANSFER) y luego se cobró
 *   el saldo restante (ej. $30.000 por CASH), suma $10.000 a TRANSFER y $30.000 a CASH.
 * - Si es un pago PARTIAL (solo anticipo verificado hasta ahora), suma $10.000 a su método.
 */
function accumulatePaymentByMethod(
  acc: { CASH: number; TRANSFER: number; CARD: number; OTHER: number },
  payment: {
    amount: unknown
    method: string
    status: string
    appointment?: {
      depositRequired?: unknown
      depositPaid?: boolean | null
      notes?: string | null
      service?: { price?: unknown; duration?: number | null } | null
    } | null
  }
) {
  const validMethod = (m?: string | null): 'CASH' | 'TRANSFER' | 'CARD' | 'OTHER' => {
    if (m === 'CASH' || m === 'TRANSFER' || m === 'CARD' || m === 'OTHER') return m
    return 'CASH'
  }

  const paymentAmount = Number(payment.amount || 0)
  if (paymentAmount <= 0) return

  const m = validMethod(payment.method)
  if (payment.status === 'REFUNDED') {
    acc[m] = Math.max(0, acc[m] - paymentAmount)
    return
  }

  if (payment.appointment && (payment.status === 'PAID' || payment.status === 'COMPLETED')) {
    const fin = resolveAppointmentFinancials(payment.appointment)
    const depositPaid = fin.depositPaidAmount
    const balancePaid = Number(fin.meta.balancePaidAmount ?? Math.max(0, paymentAmount - depositPaid))

    if (depositPaid > 0 && balancePaid > 0 && depositPaid + balancePaid === paymentAmount) {
      const depMethod = validMethod(fin.meta.depositPaymentMethod || 'TRANSFER')
      const balMethod = validMethod(fin.meta.balancePaymentMethod || payment.method)
      acc[depMethod] += depositPaid
      acc[balMethod] += balancePaid
      return
    }
  }

  acc[m] += paymentAmount
}

export async function GET(request: Request) {
  const session = await getSession()
  if (
    !session ||
    !session.businessId ||
    !ALLOWED_ROLES.includes(session.role)
  ) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const businessId = session.businessId

  const fromStr = searchParams.get('from')
  const toStr = searchParams.get('to')

  // ── Fechas de referencia ajustadas a zona horaria de Colombia (America/Bogota, UTC-5) ──
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const [yStr, mStr, dStr] = formatter.format(now).split('-')
  const y = Number(yStr)
  const m = Number(mStr) - 1
  const d = Number(dStr)

  // Rango principal (por defecto mes actual en Colombia)
  const startDate = fromStr
    ? new Date(fromStr)
    : new Date(Date.UTC(y, m, 1, 5, 0, 0, 0))
  const endDate = toStr
    ? new Date(toStr)
    : new Date(Date.UTC(y, m + 1, 1, 4, 59, 59, 999))

  // Hoy en Colombia (00:00:00 a 23:59:59.999 Colombia = 05:00:00 UTC a 04:59:59.999 UTC)
  const todayStart = new Date(Date.UTC(y, m, d, 5, 0, 0, 0))
  const todayEnd = new Date(Date.UTC(y, m, d + 1, 4, 59, 59, 999))

  // Esta semana en Colombia (Domingo a Sábado)
  const todayMidnightUTC = new Date(Date.UTC(y, m, d, 0, 0, 0))
  const sundayOffset = todayMidnightUTC.getUTCDay()
  const weekStart = new Date(Date.UTC(y, m, d - sundayOffset, 5, 0, 0, 0))
  const weekEnd = new Date(Date.UTC(y, m, d - sundayOffset + 7, 4, 59, 59, 999))

  // Este mes en Colombia
  const monthStart = new Date(Date.UTC(y, m, 1, 5, 0, 0, 0))
  const monthEnd = new Date(Date.UTC(y, m + 1, 1, 4, 59, 59, 999))

  try {
    // ── 1. Pagos cobrados en el rango (por fecha real de cobro paidAt / createdAt, incluyendo anticipos PARTIAL y reembolsos REFUNDED) ──
    const payments = await prisma.payment.findMany({
      where: {
        businessId,
        status: { in: ['PAID', 'COMPLETED', 'PARTIAL', 'REFUNDED'] },
        OR: [
          { paidAt: { gte: startDate, lte: endDate } },
          { paidAt: null, createdAt: { gte: startDate, lte: endDate } },
        ],
      },
      include: {
        appointment: {
          include: { client: true, service: true, barber: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // ── 2. Gastos en el rango ──
    const expenses = await prisma.expense.findMany({
      where: { businessId, date: { gte: startDate, lte: endDate } },
      orderBy: { date: 'desc' },
    })

    // ── 3. Citas COMPLETADAS en el rango (para comisiones) ──
    const completedAppts = await prisma.appointment.findMany({
      where: {
        businessId,
        status: 'COMPLETED',
        date: { gte: startDate, lte: endDate },
      },
      include: { barber: true, service: true, client: true, payment: true },
    })

    // ── 4. Cobros / Saldos PENDIENTES ──
    // a) Pagos existentes con saldo pendiente (PENDING o PARTIAL)
    const pendingPaymentsList = await prisma.payment.findMany({
      where: {
        businessId,
        status: { in: ['PENDING', 'PARTIAL'] },
      },
      include: {
        appointment: {
          include: { client: true, service: true, barber: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // b) Citas confirmadas o completadas que aún no tienen registro de pago
    const unpaidAppointmentsWithoutPayment = await prisma.appointment.findMany({
      where: {
        businessId,
        status: { in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] },
        paidAt: null,
        payment: null,
      },
      include: { client: true, service: true, barber: true },
      orderBy: { date: 'desc' },
      take: 60,
    })

    // ── 5. Breakdowns hoy / semana / mes ──
    const [
      paymentsToday,
      expensesToday,
      paymentsWeek,
      expensesWeek,
      paymentsMonth,
      expensesMonth,
    ] = await Promise.all([
      prisma.payment.findMany({
        where: {
          businessId,
          status: { in: ['PAID', 'COMPLETED', 'PARTIAL', 'REFUNDED'] },
          OR: [
            { paidAt: { gte: todayStart, lte: todayEnd } },
            { paidAt: null, createdAt: { gte: todayStart, lte: todayEnd } },
          ],
        },
      }),
      prisma.expense.findMany({
        where: { businessId, date: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.payment.findMany({
        where: {
          businessId,
          status: { in: ['PAID', 'COMPLETED', 'PARTIAL', 'REFUNDED'] },
          OR: [
            { paidAt: { gte: weekStart, lte: weekEnd } },
            { paidAt: null, createdAt: { gte: weekStart, lte: weekEnd } },
          ],
        },
      }),
      prisma.expense.findMany({
        where: { businessId, date: { gte: weekStart, lte: weekEnd } },
      }),
      prisma.payment.findMany({
        where: {
          businessId,
          status: { in: ['PAID', 'COMPLETED', 'PARTIAL', 'REFUNDED'] },
          OR: [
            { paidAt: { gte: monthStart, lte: monthEnd } },
            { paidAt: null, createdAt: { gte: monthStart, lte: monthEnd } },
          ],
        },
      }),
      prisma.expense.findMany({
        where: { businessId, date: { gte: monthStart, lte: monthEnd } },
      }),
    ])

    const sumRevenue = (arr: { amount: unknown; status?: string }[]) =>
      arr.reduce((acc, b) => {
        const val = Number(b.amount)
        if (b.status === 'REFUNDED') {
          return acc - Math.abs(val)
        }
        return acc + val
      }, 0)

    const sumExpenses = (arr: { amount: unknown }[]) =>
      arr.reduce((a, b) => a + Number(b.amount), 0)

    const todayRevenue = sumRevenue(paymentsToday)
    const todayExpenses = sumExpenses(expensesToday)
    const weekRevenue = sumRevenue(paymentsWeek)
    const weekExpenses = sumExpenses(expensesWeek)
    const monthRevenue = sumRevenue(paymentsMonth)
    const monthExpenses = sumExpenses(expensesMonth)

    // ── 6. Cálculos principales ──
    const totalRevenue = sumRevenue(payments)
    const totalExpenses = sumExpenses(expenses)
    const grossMargin = totalRevenue - totalExpenses

    const totalCommissions = completedAppts.reduce((acc, appt) => {
      const fin = resolveAppointmentFinancials(appt)
      const price = fin.totalPrice
      const commissionRate = appt.barber?.commission ?? 40
      return acc + (price * commissionRate) / 100
    }, 0)

    // Protección contra doble resta: si el negocio ya registró comisiones pagadas en gastos
    const commissionExpenses = expenses
      .filter((e) => e.category === 'COMMISSIONS')
      .reduce((a, b) => a + Number(b.amount), 0)

    const nonCommissionExpenses = Math.max(0, totalExpenses - commissionExpenses)
    // Utilidad Estimada = Ingresos Cobrados - Gastos Generales - Comisiones del Equipo
    const netProfit = totalRevenue - nonCommissionExpenses - totalCommissions
    const availableToday = todayRevenue - todayExpenses

    // Mapear pendientes calculando exactamente el SALDO RESTANTE si ya hubo anticipo (`PARTIAL`)
    const mappedExistingPending = pendingPaymentsList
      .map((p) => {
        const fin = p.appointment
          ? resolveAppointmentFinancials({ ...p.appointment, payment: p })
          : null
        const totalServicePrice = fin ? fin.totalPrice : Number(p.amount)
        const depositPaidAmount = fin ? fin.depositPaidAmount : 0
        const remainingToCollect =
          p.status === 'PARTIAL' && fin
            ? fin.remainingBalance
            : Number(p.amount)

        return {
          id: p.appointmentId || p.id,
          paymentId: p.id,
          paymentCode: p.paymentCode,
          reservationCode: p.appointment?.reservationCode,
          date: p.appointment?.date || p.createdAt,
          status: p.appointment?.status || 'COMPLETED',
          paymentStatus: p.status,
          clientName: p.appointment?.client?.name || 'Cliente',
          serviceName:
            fin?.serviceNamesJoined ||
            p.appointment?.service?.name ||
            'Servicio',
          totalServicePrice,
          depositPaidAmount,
          servicePrice: remainingToCollect, // Saldo pendiente a cobrar hoy
          barberName: p.appointment?.barber?.name || 'Barbero',
        }
      })
      .filter((item) => item.servicePrice > 0)

    const mappedUnpaidWithoutPayment = unpaidAppointmentsWithoutPayment.map((appt) => {
      const fin = resolveAppointmentFinancials(appt)
      return {
        id: appt.id,
        paymentId: undefined,
        paymentCode: undefined,
        reservationCode: appt.reservationCode,
        date: appt.date,
        status: appt.status,
        paymentStatus: 'PENDING',
        clientName: appt.client?.name || 'Cliente',
        serviceName: fin.serviceNamesJoined || appt.service?.name || 'Servicio',
        totalServicePrice: fin.totalPrice,
        depositPaidAmount: 0,
        servicePrice: fin.totalPrice,
        barberName: appt.barber?.name || 'Barbero',
      }
    })

    const mappedPendingAppointments = [
      ...mappedExistingPending,
      ...mappedUnpaidWithoutPayment,
    ]

    const totalPending = mappedPendingAppointments.reduce(
      (acc, item) => acc + item.servicePrice,
      0
    )

    // ── 7. Distribución exacta por método de pago (respetando pago mixto anticipo + saldo) ──
    const byMethod = {
      CASH: 0,
      TRANSFER: 0,
      CARD: 0,
      OTHER: 0,
    }

    for (const p of payments) {
      accumulatePaymentByMethod(byMethod, p)
    }

    const expensesByMethod = {
      CASH: expenses
        .filter((e) => e.paymentMethod === 'CASH')
        .reduce((a, b) => a + Number(b.amount), 0),
      TRANSFER: expenses
        .filter((e) => e.paymentMethod === 'TRANSFER')
        .reduce((a, b) => a + Number(b.amount), 0),
      CARD: expenses
        .filter((e) => e.paymentMethod === 'CARD')
        .reduce((a, b) => a + Number(b.amount), 0),
      OTHER: expenses
        .filter((e) => e.paymentMethod === 'OTHER')
        .reduce((a, b) => a + Number(b.amount), 0),
    }

    // ── 8. Rendimiento por barbero ──
    const allBarbers = await prisma.barber.findMany({
      where: { businessId },
      orderBy: { name: 'asc' },
    })

    const barberMap: Record<
      string,
      {
        id: string
        name: string
        servicesCount: number
        revenue: number
        commission: number
        commissionRate: number
        clientIds: Set<string>
      }
    > = {}

    for (const b of allBarbers) {
      barberMap[b.id] = {
        id: b.id,
        name: b.name,
        servicesCount: 0,
        revenue: 0,
        commission: 0,
        commissionRate: b.commission ?? 40,
        clientIds: new Set(),
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
          clientIds: new Set(),
        }
      }
      const fin = resolveAppointmentFinancials(appt)
      const price = fin.totalPrice
      const commRate = barberMap[bid].commissionRate
      barberMap[bid].servicesCount++
      barberMap[bid].revenue += price
      barberMap[bid].commission += (price * commRate) / 100
      barberMap[bid].clientIds.add(appt.clientId)
    }

    const barberPerformance = Object.values(barberMap).map((b) => ({
      id: b.id,
      name: b.name,
      servicesCount: b.servicesCount,
      clientsCount: b.clientIds.size,
      revenue: b.revenue,
      commission: b.commission,
      commissionRate: b.commissionRate,
      avgTicket: b.servicesCount > 0 ? b.revenue / b.servicesCount : 0,
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
        today: {
          revenue: todayRevenue,
          expenses: todayExpenses,
          profit: todayRevenue - todayExpenses,
        },
        week: {
          revenue: weekRevenue,
          expenses: weekExpenses,
          profit: weekRevenue - weekExpenses,
        },
        month: {
          revenue: monthRevenue,
          expenses: monthExpenses,
          profit: monthRevenue - monthExpenses,
        },
      },
      byMethod,
      expensesByMethod,
      payments,
      expenses,
      pendingAppointments: mappedPendingAppointments,
      barberPerformance,
    })
  } catch (error) {
    console.error('Financial Summary Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener resumen financiero' },
      { status: 500 }
    )
  }
}
