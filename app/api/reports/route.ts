import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { resolveAppointmentFinancials, parseAppointmentNotesAndMeta } from '@/lib/booking/booking-metadata'

export const dynamic = 'force-dynamic'

interface AccumulatorByMethod {
  CASH: number
  TRANSFER: number
  CARD: number
  OTHER: number
}

function validMethod(m?: string | null): 'CASH' | 'TRANSFER' | 'CARD' | 'OTHER' {
  if (m === 'CASH' || m === 'TRANSFER' || m === 'CARD' || m === 'OTHER') return m
  return 'CASH'
}

function accumulatePaymentByMethod(
  acc: AccumulatorByMethod,
  payment: {
    amount: unknown
    method?: string | null
    status?: string | null
    appointment?: {
      depositRequired?: unknown
      depositPaid?: boolean | null
      notes?: string | null
      service?: { price?: unknown; duration?: number | null } | null
    } | null
  }
) {
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
  const allowedRoles = ['OWNER', 'BRANCH_ADMIN', 'SUPER_ADMIN', 'ROOT_PLATFORM_OWNER']
  if (!session || !session.businessId || !allowedRoles.includes(session.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)

  // ── 1. Resolución Multi-Sede y Aislamiento de Negocio ─────────────────────────
  let companyId = session.companyId || null
  if (!companyId && session.businessId) {
    const currentBiz = await prisma.business.findUnique({
      where: { id: session.businessId },
      select: { companyId: true },
    })
    companyId = currentBiz?.companyId || null
  }

  let companyBranches: { id: string; name: string; slug: string; isMainBranch: boolean; status: string }[] = []
  if (companyId) {
    companyBranches = await prisma.business.findMany({
      where: { companyId },
      select: { id: true, name: true, slug: true, isMainBranch: true, status: true },
      orderBy: [{ isMainBranch: 'desc' }, { createdAt: 'asc' }],
    })
  } else {
    const singleBiz = await prisma.business.findUnique({
      where: { id: session.businessId },
      select: { id: true, name: true, slug: true, isMainBranch: true, status: true },
    })
    if (singleBiz) companyBranches = [singleBiz]
  }

  const branchParam = searchParams.get('branchId') || searchParams.get('sede')
  let targetBusinessIds: string[] = []
  let activeBranchName = 'Todas las sedes'
  let isConsolidated = false

  if (session.role === 'BRANCH_ADMIN') {
    // Administrador de sede: aislamiento estricto a su sede asignada
    targetBusinessIds = [session.businessId]
    const currentBranch = companyBranches.find((b) => b.id === session.businessId)
    activeBranchName = currentBranch?.name || 'Mi Sede'
  } else if (!branchParam || branchParam === '__all__' || branchParam.toUpperCase() === 'ALL') {
    // Propietario / SuperAdmin: Consolidado de todas las sedes de la empresa
    targetBusinessIds = companyBranches.length > 0 ? companyBranches.map((b) => b.id) : [session.businessId]
    isConsolidated = companyBranches.length > 1
    activeBranchName = isConsolidated ? 'Todas las sedes' : (companyBranches[0]?.name || 'Sede Principal')
  } else {
    // Propietario / SuperAdmin: Sede específica seleccionada
    const matched = companyBranches.find((b) => b.id === branchParam)
    if (!matched) {
      return NextResponse.json({ error: 'Sede no encontrada o no autorizada para este negocio' }, { status: 403 })
    }
    targetBusinessIds = [matched.id]
    activeBranchName = matched.name
  }

  // ── 2. Fechas de referencia ajustadas a zona horaria de Colombia (UTC-5) ──────
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const [yStr, mStr] = formatter.format(now).split('-')
  const y = Number(yStr)
  const m = Number(mStr) - 1

  const defaultFrom = new Date(Date.UTC(y, m, 1, 5, 0, 0, 0))
  const defaultTo = new Date(Date.UTC(y, m + 1, 1, 4, 59, 59, 999))

  const fromStr = searchParams.get('from')
  const toStr = searchParams.get('to')

  const startDate = fromStr ? new Date(fromStr) : defaultFrom
  const endDate = toStr ? new Date(toStr) : defaultTo

  try {
    // ── 3. Consultas concurrentes optimizadas ─────────────────────────────────
    const [appointments, payments, expenses, barbers, services] = await Promise.all([
      // Citas en el rango
      prisma.appointment.findMany({
        where: {
          businessId: { in: targetBusinessIds },
          date: { gte: startDate, lte: endDate },
        },
        include: {
          client: true,
          barber: true,
          service: true,
          payment: true,
          business: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { date: 'asc' },
      }),

      // Pagos cobrados en el rango (incluyendo PAID, COMPLETED, PARTIAL y REFUNDED para cuadre con Finanzas)
      prisma.payment.findMany({
        where: {
          businessId: { in: targetBusinessIds },
          status: { in: ['PAID', 'COMPLETED', 'PARTIAL', 'REFUNDED'] },
          OR: [
            { paidAt: { gte: startDate, lte: endDate } },
            { paidAt: null, createdAt: { gte: startDate, lte: endDate } },
            { appointment: { date: { gte: startDate, lte: endDate } } },
          ],
        },
        include: {
          appointment: {
            include: { client: true, service: true, barber: true, business: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),

      // Gastos en el rango
      prisma.expense.findMany({
        where: {
          businessId: { in: targetBusinessIds },
          date: { gte: startDate, lte: endDate },
        },
        include: {
          business: { select: { id: true, name: true } },
        },
        orderBy: { date: 'asc' },
      }),

      // Barberos (activos e históricos de las sedes objetivo)
      prisma.barber.findMany({
        where: { businessId: { in: targetBusinessIds } },
        include: {
          business: { select: { id: true, name: true } },
        },
        orderBy: { name: 'asc' },
      }),

      // Servicios (activos e históricos)
      prisma.service.findMany({
        where: { businessId: { in: targetBusinessIds } },
        include: {
          business: { select: { id: true, name: true } },
        },
        orderBy: { name: 'asc' },
      }),
    ])

    // ── 4. Métricas Diarias (Tendencia Diaria en horario Colombia UTC-5) ───────
    const dailyMap: Record<
      string,
      {
        date: string
        dayLabel: string
        appointmentsCount: number
        completedCount: number
        revenue: number
        expenses: number
        profit: number
        cashRevenue: number
        digitalRevenue: number
      }
    > = {}

    // Generar todas las fechas del rango (hasta 92 días para evitar sobrecarga)
    const dayCursor = new Date(startDate)
    let safetyCounter = 0
    while (dayCursor <= endDate && safetyCounter < 100) {
      safetyCounter++
      const cursorUtc = dayCursor.getTime()
      const bogotaDate = new Date(cursorUtc - 5 * 3600 * 1000)
      const key = `${bogotaDate.getUTCFullYear()}-${String(bogotaDate.getUTCMonth() + 1).padStart(2, '0')}-${String(bogotaDate.getUTCDate()).padStart(2, '0')}`

      if (!dailyMap[key]) {
        const dayLabel = bogotaDate.toLocaleDateString('es-CO', {
          timeZone: 'UTC',
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })
        dailyMap[key] = {
          date: key,
          dayLabel,
          appointmentsCount: 0,
          completedCount: 0,
          revenue: 0,
          expenses: 0,
          profit: 0,
          cashRevenue: 0,
          digitalRevenue: 0,
        }
      }
      dayCursor.setDate(dayCursor.getDate() + 1)
    }

    // Poblar citas por día
    for (const a of appointments) {
      const apptUtc = new Date(a.date).getTime()
      const bogotaDate = new Date(apptUtc - 5 * 3600 * 1000)
      const key = `${bogotaDate.getUTCFullYear()}-${String(bogotaDate.getUTCMonth() + 1).padStart(2, '0')}-${String(bogotaDate.getUTCDate()).padStart(2, '0')}`
      if (dailyMap[key]) {
        dailyMap[key].appointmentsCount++
        if (a.status === 'COMPLETED') {
          dailyMap[key].completedCount++
        }
      }
    }

    // Poblar pagos por día
    for (const p of payments) {
      const pDate = p.paidAt || p.createdAt || p.appointment?.date
      if (!pDate) continue
      const payUtc = new Date(pDate).getTime()
      const bogotaDate = new Date(payUtc - 5 * 3600 * 1000)
      const key = `${bogotaDate.getUTCFullYear()}-${String(bogotaDate.getUTCMonth() + 1).padStart(2, '0')}-${String(bogotaDate.getUTCDate()).padStart(2, '0')}`
      const amt = p.status === 'REFUNDED' ? -Math.abs(Number(p.amount)) : Number(p.amount)

      if (dailyMap[key]) {
        dailyMap[key].revenue += amt
        if (p.method === 'CASH') {
          dailyMap[key].cashRevenue += amt
        } else {
          dailyMap[key].digitalRevenue += amt
        }
      }
    }

    // Poblar gastos por día
    for (const e of expenses) {
      const expUtc = new Date(e.date).getTime()
      const bogotaDate = new Date(expUtc - 5 * 3600 * 1000)
      const key = `${bogotaDate.getUTCFullYear()}-${String(bogotaDate.getUTCMonth() + 1).padStart(2, '0')}-${String(bogotaDate.getUTCDate()).padStart(2, '0')}`
      const amt = Number(e.amount)
      if (dailyMap[key]) {
        dailyMap[key].expenses += amt
      }
    }

    const dailyMetrics = Object.values(dailyMap)
      .map((d) => ({
        ...d,
        profit: d.revenue - d.expenses,
      }))
      .sort((a, b) => b.date.localeCompare(a.date))

    // ── 5. Rendimiento de Barberos ───────────────────────────────────────────
    const barberStats = barbers
      .map((b) => {
        const barberAppts = appointments.filter((a) => a.barberId === b.id)
        const paidCompleted = barberAppts.filter(
          (a) =>
            a.status === 'COMPLETED' &&
            a.payment &&
            (a.payment.status === 'PAID' || a.payment.status === 'COMPLETED' || a.payment.status === 'PARTIAL')
        )

        const revenue = paidCompleted.reduce((acc, a) => {
          const pAmt = Number(a.payment?.amount || 0)
          if (pAmt > 0) return acc + pAmt
          return acc + Number(a.service?.price || 0)
        }, 0)

        const rate = typeof b.commission === 'number' ? b.commission : 40
        const commission = (revenue * rate) / 100
        const clientsSet = new Set(
          paidCompleted.map((a) => a.client?.phone?.trim() || a.client?.email?.trim() || a.clientId)
        )

        return {
          id: b.id,
          name: b.name,
          branchId: b.businessId,
          branchName: b.business?.name || 'Sede Principal',
          commissionRate: rate,
          totalAppointments: barberAppts.length,
          completedAppointments: paidCompleted.length,
          clientsCount: clientsSet.size,
          revenue,
          commission,
          shopShare: revenue - commission,
          avgTicket: paidCompleted.length > 0 ? Math.round(revenue / paidCompleted.length) : 0,
        }
      })
      .sort((a, b) => b.revenue - a.revenue)

    // ── 6. Análisis de Servicios (Con soporte Multi-Servicio) ──────────────────
    const serviceCountsMap: Record<
      string,
      { id: string; name: string; category: string; price: number; count: number; revenue: number }
    > = {}

    for (const s of services) {
      serviceCountsMap[s.id] = {
        id: s.id,
        name: s.name,
        category: s.category || 'General',
        price: Number(s.price || 0),
        count: 0,
        revenue: 0,
      }
    }

    for (const a of appointments) {
      if (a.status !== 'COMPLETED') continue
      const isPaidAppt =
        a.payment && (a.payment.status === 'PAID' || a.payment.status === 'COMPLETED' || a.payment.status === 'PARTIAL')

      const { meta } = parseAppointmentNotesAndMeta(a.notes)
      if (Array.isArray(meta.services) && meta.services.length > 0) {
        for (const item of meta.services) {
          if (!serviceCountsMap[item.id]) {
            serviceCountsMap[item.id] = {
              id: item.id,
              name: item.name,
              category: 'General',
              price: Number(item.price || 0),
              count: 0,
              revenue: 0,
            }
          }
          serviceCountsMap[item.id].count++
          if (isPaidAppt) {
            serviceCountsMap[item.id].revenue += Number(item.price || 0)
          }
        }
      } else if (a.serviceId && serviceCountsMap[a.serviceId]) {
        serviceCountsMap[a.serviceId].count++
        if (isPaidAppt) {
          const itemPrice = Number(a.payment?.amount || a.service?.price || 0)
          serviceCountsMap[a.serviceId].revenue += itemPrice
        }
      }
    }

    const serviceStats = Object.values(serviceCountsMap)
      .filter((s) => s.count > 0 || s.revenue > 0)
      .sort((a, b) => b.count - a.count)

    // ── 7. Horas Pico y Días de Demanda (Ajustados a Colombia UTC-5) ───────────
    const hourlyMap: Record<number, { hourLabel: string; count: number; completedCount: number }> = {}
    for (let h = 8; h <= 20; h++) {
      const padH = String(h).padStart(2, '0')
      hourlyMap[h] = { hourLabel: `${padH}:00`, count: 0, completedCount: 0 }
    }

    for (const a of appointments) {
      const apptUtc = new Date(a.date).getTime()
      const bogotaDate = new Date(apptUtc - 5 * 3600 * 1000)
      const hour = bogotaDate.getUTCHours()
      if (hourlyMap[hour]) {
        hourlyMap[hour].count++
        if (a.status === 'COMPLETED') hourlyMap[hour].completedCount++
      }
    }
    const hourlyDistribution = Object.values(hourlyMap)

    const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    const dayOfWeekMap: Record<
      number,
      { dayName: string; count: number; completedCount: number; revenue: number }
    > = {}
    for (let d = 0; d < 7; d++) {
      dayOfWeekMap[d] = { dayName: DAY_NAMES[d], count: 0, completedCount: 0, revenue: 0 }
    }

    for (const a of appointments) {
      const apptUtc = new Date(a.date).getTime()
      const bogotaDate = new Date(apptUtc - 5 * 3600 * 1000)
      const dayIdx = bogotaDate.getUTCDay()
      if (dayOfWeekMap[dayIdx]) {
        dayOfWeekMap[dayIdx].count++
        if (a.status === 'COMPLETED') {
          dayOfWeekMap[dayIdx].completedCount++
          if (
            a.payment &&
            (a.payment.status === 'PAID' || a.payment.status === 'COMPLETED' || a.payment.status === 'PARTIAL')
          ) {
            dayOfWeekMap[dayIdx].revenue += Number(a.payment.amount || a.service?.price || 0)
          }
        }
      }
    }
    const dayOfWeekDistribution = Object.values(dayOfWeekMap)

    // ── 8. Cancelaciones & Pérdidas Estimadas (Cancelaciones & Loss) ───────────
    const totalApptsCount = appointments.length
    const completedApptsCount = appointments.filter((a) => a.status === 'COMPLETED').length
    const cancelledAppts = appointments.filter((a) => a.status === 'CANCELLED')
    const noShowAppts = appointments.filter((a) => a.status === 'NO_SHOW')
    const cancelledCount = cancelledAppts.length
    const noShowCount = noShowAppts.length
    const totalLostCount = cancelledCount + noShowCount
    const cancellationRate =
      totalApptsCount > 0 ? Math.round((totalLostCount / totalApptsCount) * 100 * 10) / 10 : 0

    let potentialLostRevenue = 0
    let retainedDeposits = 0
    let refundedDeposits = 0

    for (const a of [...cancelledAppts, ...noShowAppts]) {
      const fin = resolveAppointmentFinancials(a)
      potentialLostRevenue += fin.totalPrice || Number(a.service?.price || 0)
      retainedDeposits += Number(fin.retainedAmount || 0)
      refundedDeposits += Number(fin.refundAmount || 0)
    }

    const netEstimatedLoss = Math.max(0, potentialLostRevenue - retainedDeposits)

    // ── 9. Clientes y Retención (Deduplicación Cross-Sede) ─────────────────────
    const uniqueClientsMap = new Map<string, { id: string; name: string }>()
    for (const a of appointments) {
      if (a.client) {
        const key = a.client.phone?.trim() || a.client.email?.trim() || a.client.id
        if (!uniqueClientsMap.has(key)) {
          uniqueClientsMap.set(key, { id: a.client.id, name: a.client.name })
        }
      }
    }
    const uniqueClientsCount = uniqueClientsMap.size

    const newClients = await prisma.client.findMany({
      where: {
        businessId: { in: targetBusinessIds },
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { id: true, phone: true, email: true },
    })
    const newClientsSet = new Set(newClients.map((c) => c.phone?.trim() || c.email?.trim() || c.id))
    const newClientsCount = newClientsSet.size

    // Clientes recurrentes: Clientes con 2 o más citas completadas
    const recurringAppts = await prisma.appointment.findMany({
      where: {
        businessId: { in: targetBusinessIds },
        status: 'COMPLETED',
      },
      select: { clientId: true, client: { select: { phone: true, email: true } } },
    })
    const clientVisitsCount: Record<string, number> = {}
    for (const a of recurringAppts) {
      const key = a.client?.phone?.trim() || a.client?.email?.trim() || a.clientId
      clientVisitsCount[key] = (clientVisitsCount[key] || 0) + 1
    }
    const recurringClientsCount = Object.values(clientVisitsCount).filter((cnt) => cnt >= 2).length
    const retentionRate =
      uniqueClientsCount > 0 ? Math.round((recurringClientsCount / uniqueClientsCount) * 100 * 10) / 10 : 0

    // ── 10. Métodos de Pago y Reconciliación con Finanzas ───────────────────────
    const byMethod: AccumulatorByMethod = {
      CASH: 0,
      TRANSFER: 0,
      CARD: 0,
      OTHER: 0,
    }

    for (const p of payments) {
      accumulatePaymentByMethod(byMethod, p)
    }

    const sumRevenue = (arr: { amount: unknown; status?: string }[]) =>
      arr.reduce((acc, p) => {
        const val = Number(p.amount)
        if (p.status === 'REFUNDED') {
          return acc - Math.abs(val)
        }
        return acc + val
      }, 0)

    const totalRevenue = sumRevenue(payments)
    const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount), 0)

    // Gastos no comisiones para evitar doble resta
    const nonCommissionExpenses = expenses
      .filter((e) => e.category !== 'COMMISSIONS')
      .reduce((acc, e) => acc + Number(e.amount), 0)

    const totalCommissions = barberStats.reduce((acc, b) => acc + b.commission, 0)
    const netProfit = totalRevenue - nonCommissionExpenses - totalCommissions
    const grossMargin = totalRevenue - totalExpenses

    // ── 11. Comparativa por Sede (Si la empresa tiene multisedes) ──────────────
    const branchStats = companyBranches.map((branch) => {
      const bPayments = payments.filter((p) => p.businessId === branch.id)
      const bExpenses = expenses.filter((e) => e.businessId === branch.id)
      const bAppointments = appointments.filter((a) => a.businessId === branch.id)

      const bRevenue = sumRevenue(bPayments)
      const bExpenseTotal = bExpenses.reduce((s, e) => s + Number(e.amount), 0)

      // Comisiones de la sede
      const bBarberStats = barberStats.filter((b) => b.branchId === branch.id)
      const bCommissionTotal = bBarberStats.reduce((s, b) => s + b.commission, 0)

      const bNonCommExp = bExpenses
        .filter((e) => e.category !== 'COMMISSIONS')
        .reduce((s, e) => s + Number(e.amount), 0)
      const bProfit = bRevenue - bNonCommExp - bCommissionTotal

      const bCompleted = bAppointments.filter((a) => a.status === 'COMPLETED').length
      const bCancelled = bAppointments.filter((a) => a.status === 'CANCELLED').length

      const bClientKeys = new Set(
        bAppointments
          .filter((a) => a.client)
          .map((a) => a.client?.phone?.trim() || a.client?.email?.trim() || a.client?.id || a.clientId)
      )

      return {
        branchId: branch.id,
        branchName: branch.name,
        branchSlug: branch.slug,
        isMainBranch: branch.isMainBranch,
        status: branch.status,
        revenue: bRevenue,
        expenses: bExpenseTotal,
        commissions: bCommissionTotal,
        profit: bProfit,
        totalAppointments: bAppointments.length,
        completedAppointments: bCompleted,
        cancelledAppointments: bCancelled,
        completionRate: bAppointments.length > 0 ? Math.round((bCompleted / bAppointments.length) * 100) : 0,
        revenueShare: totalRevenue > 0 ? Math.round((bRevenue / totalRevenue) * 100) : 0,
        clients: bClientKeys.size,
      }
    })

    return NextResponse.json({
      range: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
      branchContext: {
        activeBranchId: branchParam || (isConsolidated ? '__all__' : targetBusinessIds[0]),
        activeBranchName,
        isConsolidated,
        availableBranches: companyBranches.map((b) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          isMainBranch: b.isMainBranch,
          status: b.status,
        })),
      },
      summary: {
        totalRevenue,
        totalExpenses,
        totalCommissions,
        netProfit,
        grossMargin,
        totalAppointments: appointments.length,
        completedAppointments: completedApptsCount,
        uniqueClients: uniqueClientsCount,
        avgTicket: completedApptsCount > 0 ? Math.round(totalRevenue / completedApptsCount) : 0,
      },
      dailyMetrics,
      barberStats,
      serviceStats,
      hourlyDistribution,
      dayOfWeekDistribution,
      cancellationStats: {
        total: totalApptsCount,
        completed: completedApptsCount,
        cancelled: cancelledCount,
        noShow: noShowCount,
        cancellationRate,
        potentialLostRevenue,
        retainedDeposits,
        refundedDeposits,
        netEstimatedLoss,
      },
      clientAnalytics: {
        totalUnique: uniqueClientsCount,
        newClients: newClientsCount,
        recurringClients: recurringClientsCount,
        retentionRate,
      },
      byMethod,
      branchStats: companyBranches.length > 1 ? branchStats : [],
    })
  } catch (error) {
    console.error('Reports API Error:', error)
    return NextResponse.json({ error: 'Error al generar reportes analíticos' }, { status: 500 })
  }
}
