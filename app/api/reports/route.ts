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
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
  const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const startDate = fromStr ? new Date(fromStr) : defaultFrom
  const endDate = toStr ? new Date(toStr) : defaultTo

  try {
    // 1. Fetch completed appointments in range
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

    // 2. Fetch payments in range
    const payments = await prisma.payment.findMany({
      where: {
        businessId,
        status: 'COMPLETED',
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
      orderBy: { createdAt: 'asc' }
    })

    // 3. Fetch expenses in range
    const expenses = await prisma.expense.findMany({
      where: {
        businessId,
        date: { gte: startDate, lte: endDate }
      },
      orderBy: { date: 'asc' }
    })

    // 4. Fetch all barbers for business
    const barbers = await prisma.barber.findMany({
      where: { businessId },
      orderBy: { name: 'asc' }
    })

    // 5. Fetch all services for business
    const services = await prisma.service.findMany({
      where: { businessId },
      orderBy: { name: 'asc' }
    })

    // ── Calculate Daily Breakdown ──
    // Group payments, expenses and appointments by date (YYYY-MM-DD)
    const dailyMap: Record<string, {
      date: string
      dayLabel: string
      appointmentsCount: number
      completedCount: number
      revenue: number
      expenses: number
      profit: number
      cashRevenue: number
      digitalRevenue: number
    }> = {}

    // Initialize all days in the range (up to 62 days to avoid huge empty objects)
    const dayCursor = new Date(startDate)
    let safetyCounter = 0
    while (dayCursor <= endDate && safetyCounter < 100) {
      safetyCounter++
      const key = `${dayCursor.getFullYear()}-${String(dayCursor.getMonth() + 1).padStart(2, '0')}-${String(dayCursor.getDate()).padStart(2, '0')}`
      const dayLabel = dayCursor.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })
      
      dailyMap[key] = {
        date: key,
        dayLabel,
        appointmentsCount: 0,
        completedCount: 0,
        revenue: 0,
        expenses: 0,
        profit: 0,
        cashRevenue: 0,
        digitalRevenue: 0
      }
      dayCursor.setDate(dayCursor.getDate() + 1)
    }

    // Populate appointments per day
    for (const a of appointments) {
      const d = new Date(a.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (dailyMap[key]) {
        dailyMap[key].appointmentsCount++
        if (a.status === 'COMPLETED') {
          dailyMap[key].completedCount++
        }
      }
    }

    // Populate payments per day
    for (const p of payments) {
      const d = new Date(p.appointment?.date || p.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const amt = Number(p.amount)
      if (dailyMap[key]) {
        dailyMap[key].revenue += amt
        if (p.method === 'CASH') {
          dailyMap[key].cashRevenue += amt
        } else {
          dailyMap[key].digitalRevenue += amt
        }
      }
    }

    // Populate expenses per day
    for (const e of expenses) {
      const d = new Date(e.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const amt = Number(e.amount)
      if (dailyMap[key]) {
        dailyMap[key].expenses += amt
      }
    }

    // Calculate profit per day
    const dailyMetrics = Object.values(dailyMap).map(d => ({
      ...d,
      profit: d.revenue - d.expenses
    })).sort((a, b) => b.date.localeCompare(a.date)) // newest first

    // ── Barber Performance ──
    const barberStats = barbers.map(b => {
      const barberAppts = appointments.filter(a => a.barberId === b.id)
      const paidCompleted = barberAppts.filter(a => 
        a.status === 'COMPLETED' && 
        a.payment && 
        (a.payment.status === 'PAID' || a.payment.status === 'COMPLETED')
      )
      const revenue = paidCompleted.reduce((acc, a) => acc + Number(a.payment?.amount || a.service?.price || 0), 0)
      const rate = b.commission ?? 40
      const commission = (revenue * rate) / 100
      const clientsSet = new Set(barberAppts.map(a => a.clientId))

      return {
        id: b.id,
        name: b.name,
        commissionRate: rate,
        totalAppointments: barberAppts.length,
        completedAppointments: paidCompleted.length,
        clientsCount: clientsSet.size,
        revenue,
        commission,
        shopShare: revenue - commission,
        avgTicket: paidCompleted.length > 0 ? revenue / paidCompleted.length : 0
      }
    }).sort((a, b) => b.revenue - a.revenue)

    // ── Service Performance ──
    const serviceStats = services.map(s => {
      const serviceAppts = appointments.filter(a => 
        a.serviceId === s.id && 
        a.status === 'COMPLETED' && 
        a.payment && 
        (a.payment.status === 'PAID' || a.payment.status === 'COMPLETED')
      )
      const revenue = serviceAppts.reduce((acc, a) => acc + Number(a.payment?.amount || s.price || 0), 0)

      return {
        id: s.id,
        name: s.name,
        category: s.category || 'General',
        price: Number(s.price || 0),
        count: serviceAppts.length,
        revenue
      }
    }).filter(s => s.count > 0).sort((a, b) => b.count - a.count)

    // ── Hourly Distribution (Horas Pico: 08:00 a 20:00) ──
    const hourlyMap: Record<number, { hourLabel: string; count: number; completedCount: number }> = {}
    for (let h = 8; h <= 20; h++) {
      const padH = String(h).padStart(2, '0')
      hourlyMap[h] = { hourLabel: `${padH}:00`, count: 0, completedCount: 0 }
    }

    for (const a of appointments) {
      const hour = new Date(a.date).getHours()
      if (hourlyMap[hour]) {
        hourlyMap[hour].count++
        if (a.status === 'COMPLETED') hourlyMap[hour].completedCount++
      }
    }
    const hourlyDistribution = Object.values(hourlyMap)

    // ── Day of Week Distribution (Días Fuertes) ──
    const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    const dayOfWeekMap: Record<number, { dayName: string; count: number; completedCount: number; revenue: number }> = {}
    for (let d = 0; d < 7; d++) {
      dayOfWeekMap[d] = { dayName: DAY_NAMES[d], count: 0, completedCount: 0, revenue: 0 }
    }

    for (const a of appointments) {
      const dayIdx = new Date(a.date).getDay()
      if (dayOfWeekMap[dayIdx]) {
        dayOfWeekMap[dayIdx].count++
        if (a.status === 'COMPLETED') {
          dayOfWeekMap[dayIdx].completedCount++
          if (a.payment && (a.payment.status === 'PAID' || a.payment.status === 'COMPLETED')) {
            dayOfWeekMap[dayIdx].revenue += Number(a.payment.amount || a.service?.price || 0)
          }
        }
      }
    }
    const dayOfWeekDistribution = Object.values(dayOfWeekMap)

    // ── Cancellation & No-Show Stats ──
    const totalApptsCount = appointments.length
    const completedApptsCount = appointments.filter(a => a.status === 'COMPLETED').length
    const cancelledCount = appointments.filter(a => a.status === 'CANCELLED').length
    const noShowCount = appointments.filter(a => a.status === 'NO_SHOW').length
    const totalLostCount = cancelledCount + noShowCount
    const cancellationRate = totalApptsCount > 0 ? Math.round((totalLostCount / totalApptsCount) * 100 * 10) / 10 : 0

    // ── Client Retention Analytics ──
    const newClientsCount = await prisma.client.count({
      where: {
        businessId,
        createdAt: { gte: startDate, lte: endDate }
      }
    })

    const clientApptCounts = await prisma.appointment.groupBy({
      by: ['clientId'],
      where: { businessId, status: 'COMPLETED', date: { gte: startDate, lte: endDate } },
      _count: { id: true },
      having: { id: { _count: { gte: 2 } } }
    })
    const recurringClientsCount = clientApptCounts.length

    // ── Totals / KPI Summary ──
    const totalRevenue = payments.reduce((acc, p) => acc + Number(p.amount), 0)
    const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount), 0)
    const totalCommissions = barberStats.reduce((acc, b) => acc + b.commission, 0)
    const netProfit = totalRevenue - totalExpenses - totalCommissions

    const completedAppointmentsCount = appointments.filter(a => a.status === 'COMPLETED').length
    const totalClientsSet = new Set(appointments.map(a => a.clientId))

    return NextResponse.json({
      range: {
        from: startDate.toISOString(),
        to: endDate.toISOString()
      },
      summary: {
        totalRevenue,
        totalExpenses,
        totalCommissions,
        netProfit,
        grossMargin: totalRevenue - totalExpenses,
        totalAppointments: appointments.length,
        completedAppointments: completedAppointmentsCount,
        uniqueClients: totalClientsSet.size,
        avgTicket: completedAppointmentsCount > 0 ? totalRevenue / completedAppointmentsCount : 0
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
        cancellationRate
      },
      clientAnalytics: {
        totalUnique: totalClientsSet.size,
        newClients: newClientsCount,
        recurringClients: recurringClientsCount
      },
      byMethod: {
        CASH: payments.filter(p => p.method === 'CASH').reduce((a, b) => a + Number(b.amount), 0),
        TRANSFER: payments.filter(p => p.method === 'TRANSFER').reduce((a, b) => a + Number(b.amount), 0),
        CARD: payments.filter(p => p.method === 'CARD').reduce((a, b) => a + Number(b.amount), 0),
        OTHER: payments.filter(p => p.method === 'OTHER').reduce((a, b) => a + Number(b.amount), 0)
      }
    })
  } catch (error) {
    console.error('Reports API Error:', error)
    return NextResponse.json({ error: 'Error al generar reportes' }, { status: 500 })
  }
}
