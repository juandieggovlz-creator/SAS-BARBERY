import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession('SUPER_ADMIN')
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 })
  }

  try {
    const now = new Date()
    const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Parallel aggregation queries for speed & scale
    const [
      totalBusinesses,
      activeBusinesses,
      trialBusinesses,
      suspendedBusinesses,
      totalUsersCount,
      ownerUsersCount,
      barberUsersCount,
      totalClientsCount,
      totalAppointments,
      monthAppointments,
      lastMonthAppointments,
      pendingTicketsCount,
      businessesList,
      recentAuditLogs,
      openTickets
    ] = await Promise.all([
      prisma.business.count(),
      prisma.business.count({ where: { status: 'ACTIVE' } }),
      prisma.business.count({ where: { status: 'TRIAL' } }),
      prisma.business.count({ where: { status: 'SUSPENDED' } }),
      prisma.user.count(),
      prisma.user.count({ where: { role: 'OWNER' } }),
      prisma.user.count({ where: { role: 'BARBER' } }),
      prisma.client.count(),
      prisma.appointment.count(),
      prisma.appointment.count({ where: { createdAt: { gte: firstDayOfMonth } } }),
      prisma.appointment.count({
        where: {
          createdAt: {
            gte: firstDayOfLastMonth,
            lte: lastDayOfLastMonth
          }
        }
      }),
      prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.business.findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
          plan: { select: { id: true, name: true, price: true, billingPeriod: true } },
          users: {
            orderBy: { lastLoginAt: 'desc' },
            take: 1,
            select: { lastLoginAt: true, email: true }
          },
          _count: {
            select: {
              barbers: true,
              clients: true,
              appointments: true
            }
          }
        }
      }),
      prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.supportTicket.findMany({
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
        take: 5,
        orderBy: { priority: 'desc' },
        include: { business: { select: { name: true, slug: true } } }
      })
    ])

    // Calculate MRR from active businesses' assigned plans
    let mrr = 0
    let activeSubscriptionsCount = 0
    let expiredSubscriptionsCount = 0

    const trialsExpiringSoon: Array<any> = []
    const plansExpired: Array<any> = []
    const inactiveBusinessesList: Array<any> = []

    businessesList.forEach(b => {
      // Calculate MRR
      if (b.status === 'ACTIVE' && b.plan) {
        const price = Number(b.plan.price)
        mrr += b.plan.billingPeriod === 'YEARLY' ? price / 12 : price
      }

      // Subscriptions status check
      if (b.status === 'ACTIVE') {
        if (b.subscriptionEndsAt && new Date(b.subscriptionEndsAt) < now) {
          expiredSubscriptionsCount++
          plansExpired.push({
            id: b.id,
            name: b.name,
            phone: b.phone,
            ownerEmail: b.users[0]?.email || b.email,
            planName: b.plan?.name || 'Plan Estándar',
            expiredAt: b.subscriptionEndsAt
          })
        } else {
          activeSubscriptionsCount++
        }
      } else if (b.status === 'SUSPENDED') {
        expiredSubscriptionsCount++
        plansExpired.push({
          id: b.id,
          name: b.name,
          phone: b.phone,
          ownerEmail: b.users[0]?.email || b.email,
          planName: b.plan?.name || 'Suspendido',
          expiredAt: b.subscriptionEndsAt || b.updatedAt
        })
      }

      // Trials expiring in <= 5 days
      if (b.status === 'TRIAL' && b.trialEndsAt) {
        const trialEnd = new Date(b.trialEndsAt)
        if (trialEnd > now && trialEnd <= fiveDaysFromNow) {
          const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
          trialsExpiringSoon.push({
            id: b.id,
            name: b.name,
            phone: b.phone,
            ownerEmail: b.users[0]?.email || b.email,
            daysLeft,
            trialEndsAt: b.trialEndsAt
          })
        }
      }

      // Inactive businesses (no login/update in 30 days)
      const lastAct = b.users[0]?.lastLoginAt || b.updatedAt
      if (new Date(lastAct) < thirtyDaysAgo) {
        const daysInactive = Math.floor((now.getTime() - new Date(lastAct).getTime()) / (1000 * 60 * 60 * 24))
        inactiveBusinessesList.push({
          id: b.id,
          name: b.name,
          phone: b.phone,
          ownerEmail: b.users[0]?.email || b.email,
          daysInactive
        })
      }
    })

    // Sort trials by urgency (fewest days left first)
    trialsExpiringSoon.sort((a, b) => a.daysLeft - b.daysLeft)

    // Calculate business health status (🟢 Activa, 🟡 Poco uso, 🔴 Inactiva)
    const nowMs = now.getTime()
    const businessesHealth = businessesList.map(b => {
      const lastLogin = b.users[0]?.lastLoginAt || b.updatedAt
      const diffMs = nowMs - new Date(lastLogin).getTime()
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffHours / 24)

      let healthStatus: 'HEALTHY' | 'WARNING' | 'INACTIVE' = 'HEALTHY'
      let healthLabel = '🟢 Activa'
      let timeAgo = ''

      if (diffHours < 1) {
        timeAgo = 'Hace unos minutos'
        healthStatus = 'HEALTHY'
        healthLabel = '🟢 Activa'
      } else if (diffHours < 24) {
        timeAgo = `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`
        healthStatus = 'HEALTHY'
        healthLabel = '🟢 Activa'
      } else if (diffDays <= 3) {
        timeAgo = `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`
        healthStatus = 'HEALTHY'
        healthLabel = '🟢 Activa'
      } else if (diffDays <= 14) {
        timeAgo = `Hace ${diffDays} días`
        healthStatus = 'WARNING'
        healthLabel = '🟡 Poco uso'
      } else {
        timeAgo = diffDays > 30 ? 'Hace más de 30 días' : `Hace ${diffDays} días`
        healthStatus = 'INACTIVE'
        healthLabel = '🔴 Inactiva'
      }

      return {
        id: b.id,
        name: b.name,
        slug: b.slug,
        status: b.status,
        planName: b.plan?.name || 'Sin Plan',
        lastLoginAt: lastLogin,
        timeAgo,
        healthStatus,
        healthLabel,
        barbersCount: b._count.barbers,
        clientsCount: b._count.clients,
        appointmentsCount: b._count.appointments
      }
    })

    return NextResponse.json({
      metrics: {
        totalBusinesses,
        activeBusinesses,
        trialBusinesses,
        suspendedBusinesses,
        ownerUsers: ownerUsersCount,
        barberUsers: barberUsersCount,
        clientsCount: totalClientsCount,
        totalAppointments,
        monthAppointments,
        mrr,
        activeSubscriptionsCount,
        expiredSubscriptionsCount,
        pendingTicketsCount
      },
      alerts: {
        trialsExpiringSoon,
        plansExpired,
        inactiveBusinessesList,
        openTickets
      },
      businessesHealth,
      recentAuditLogs
    })
  } catch (error) {
    console.error('Super Admin Dashboard API Error:', error)
    return NextResponse.json({ error: 'Error al cargar métricas del centro de operaciones' }, { status: 500 })
  }
}
