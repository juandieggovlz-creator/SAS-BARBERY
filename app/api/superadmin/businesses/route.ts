import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim() || ''
    const status = searchParams.get('status') || 'ALL'
    const planSlug = searchParams.get('plan') || 'ALL'

    const whereClause: Record<string, unknown> = {}

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ]
    }

    if (status !== 'ALL') {
      whereClause.status = status
    }

    if (planSlug !== 'ALL') {
      whereClause.plan = { slug: planSlug }
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [businesses, total, plans] = await Promise.all([
      prisma.business.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          plan: { select: { id: true, name: true, slug: true, price: true } },
          users: {
            where: { role: 'OWNER' },
            select: { id: true, email: true, lastLoginAt: true }
          },
          saasSubscriptions: {
            orderBy: { currentPeriodEnd: 'desc' },
            take: 1,
            select: { status: true, currentPeriodEnd: true }
          },
          barbers: {
            where: { status: 'ACTIVE' },
            select: { id: true }
          },
          appointments: {
            where: { createdAt: { gte: thirtyDaysAgo } },
            select: { id: true }
          },
          _count: {
            select: {
              clients: true,
              appointments: true
            }
          }
        }
      }),
      prisma.business.count({ where: whereClause }),
      prisma.plan.findMany({ where: { isActive: true } })
    ])

    return NextResponse.json({
      businesses: businesses.map(b => {
        const lastLogin = b.users[0]?.lastLoginAt || b.updatedAt
        const sub = b.saasSubscriptions[0]
        const subscriptionStatus = sub?.status || (b.status === 'TRIAL' ? 'TRIALING' : b.status)

        return {
          id: b.id,
          name: b.name,
          slug: b.slug,
          phone: b.phone,
          email: b.email,
          address: b.address,
          logo: b.logo,
          status: b.status,
          plan: b.plan,
          trialEndsAt: b.trialEndsAt,
          subscriptionEndsAt: b.subscriptionEndsAt,
          subscriptionStatus,
          createdAt: b.createdAt,
          ownerEmail: b.users[0]?.email || 'Sin Propietario',
          lastLoginAt: lastLogin,
          activeBarbersCount: b.barbers.length,
          clientsCount: b._count.clients,
          reservationsLast30Days: b.appointments.length,
          totalAppointments: b._count.appointments
        }
      }),
      total,
      plans
    })
  } catch (error) {
    console.error('Super Admin Businesses API Error:', error)
    return NextResponse.json({ error: 'Error al listar negocios' }, { status: 500 })
  }
}
