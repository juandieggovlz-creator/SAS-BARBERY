import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/owner/reports/consolidated
 * Retorna métricas consolidadas de todas las sedes de la empresa.
 * Parámetros: ?from=ISO&to=ISO
 */
export async function GET(request: Request) {
  try {
    const session = await getSession('OWNER')
    if (!session || (session.role !== 'OWNER' && session.role !== 'BRANCH_ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    // Rango de fechas
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    const from = fromParam ? new Date(fromParam) : startOfMonth
    const to = toParam ? new Date(toParam) : endOfMonth

    // Resolver la empresa del usuario
    let companyId = session.companyId || null

    if (!companyId && session.businessId) {
      const biz = await prisma.business.findUnique({
        where: { id: session.businessId },
        select: { companyId: true }
      })
      companyId = biz?.companyId || null
    }

    if (!companyId) {
      const company = await prisma.company.findFirst({
        where: { ownerId: session.userId },
        select: { id: true }
      })
      companyId = company?.id || null
    }

    if (!companyId) {
      return NextResponse.json({ error: 'No se encontró la estructura empresarial' }, { status: 404 })
    }

    // Obtener todas las sedes de la empresa
    const branches = await prisma.business.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        isMainBranch: true
      },
      orderBy: [{ isMainBranch: 'desc' }, { createdAt: 'asc' }]
    })

    if (branches.length === 0) {
      return NextResponse.json({
        range: { from: from.toISOString(), to: to.toISOString() },
        branches: [],
        summary: {
          totalRevenue: 0,
          totalExpenses: 0,
          totalCommissions: 0,
          netProfit: 0,
          grossMargin: 0,
          totalAppointments: 0,
          completedAppointments: 0,
          cancelledAppointments: 0,
          completionRate: 0,
          totalClients: 0,
          branchCount: 0
        },
        branchStats: []
      })
    }

    const branchIds = branches.map(b => b.id)

    // ── Pagos completados en el rango (ingresos reales) ───────────────────────
    const payments = await prisma.payment.findMany({
      where: {
        businessId: { in: branchIds },
        status: 'COMPLETED',
        OR: [
          { appointment: { date: { gte: from, lte: to } } },
          { appointmentId: null, createdAt: { gte: from, lte: to } }
        ]
      },
      select: {
        businessId: true,
        amount: true,
        method: true,
        appointment: {
          select: {
            barber: {
              select: {
                commission: true
              }
            }
          }
        }
      }
    })

    // ── Gastos en el rango ───────────────────────────────────────────────────
    const expenses = await prisma.expense.findMany({
      where: {
        businessId: { in: branchIds },
        date: { gte: from, lte: to }
      },
      select: {
        businessId: true,
        amount: true
      }
    })

    // ── Citas en el rango ────────────────────────────────────────────────────
    const appointments = await prisma.appointment.findMany({
      where: {
        businessId: { in: branchIds },
        date: { gte: from, lte: to }
      },
      select: {
        businessId: true,
        status: true
      }
    })

    // ── Clientes únicos por sede ─────────────────────────────────────────────
    const clientCounts = await prisma.client.groupBy({
      by: ['businessId'],
      where: { businessId: { in: branchIds } },
      _count: { id: true }
    })

    // ── Totales consolidados ─────────────────────────────────────────────────
    let totalRevenue = 0
    let totalCommissions = 0

    for (const p of payments) {
      const amt = Number(p.amount)
      totalRevenue += amt
      const commRate = p.appointment?.barber?.commission ?? 0
      totalCommissions += amt * (commRate / 100)
    }

    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
    const netProfit = totalRevenue - totalExpenses - totalCommissions
    const totalAppointments = appointments.length
    const completedAppointments = appointments.filter(a => a.status === 'COMPLETED').length
    const cancelledAppointments = appointments.filter(a => a.status === 'CANCELLED').length
    const totalClients = clientCounts.reduce((s, c) => s + c._count.id, 0)

    // ── Stats por sede ───────────────────────────────────────────────────────
    const branchStats = branches.map(branch => {
      const bPayments = payments.filter(p => p.businessId === branch.id)
      const bExpenses = expenses.filter(e => e.businessId === branch.id)
      const bAppointments = appointments.filter(a => a.businessId === branch.id)
      const bClients = clientCounts.find(c => c.businessId === branch.id)?._count.id || 0

      let revenue = 0
      let commissionTotal = 0
      for (const p of bPayments) {
        const amt = Number(p.amount)
        revenue += amt
        const rate = p.appointment?.barber?.commission ?? 0
        commissionTotal += amt * (rate / 100)
      }

      const expenseTotal = bExpenses.reduce((s, e) => s + Number(e.amount), 0)
      const profit = revenue - expenseTotal - commissionTotal
      const completed = bAppointments.filter(a => a.status === 'COMPLETED').length
      const cancelled = bAppointments.filter(a => a.status === 'CANCELLED').length

      return {
        branchId: branch.id,
        branchName: branch.name,
        branchSlug: branch.slug,
        isMainBranch: branch.isMainBranch,
        status: branch.status,
        revenue,
        expenses: expenseTotal,
        commissions: commissionTotal,
        profit,
        totalAppointments: bAppointments.length,
        completedAppointments: completed,
        cancelledAppointments: cancelled,
        completionRate: bAppointments.length > 0 ? Math.round((completed / bAppointments.length) * 100) : 0,
        revenueShare: totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0,
        clients: bClients
      }
    })

    return NextResponse.json({
      range: { from: from.toISOString(), to: to.toISOString() },
      branches: branches.map(b => ({ id: b.id, name: b.name, slug: b.slug, isMainBranch: b.isMainBranch, status: b.status })),
      summary: {
        totalRevenue,
        totalExpenses,
        totalCommissions,
        netProfit,
        grossMargin: totalRevenue > 0 ? Math.round(((totalRevenue - totalExpenses) / totalRevenue) * 100) : 0,
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        completionRate: totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0,
        totalClients,
        branchCount: branches.length
      },
      branchStats
    })
  } catch (error: unknown) {
    console.error('Error in consolidated reports:', error)
    return NextResponse.json({ error: 'Error al generar reporte consolidado' }, { status: 500 })
  }
}
