import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'

export async function GET(request: Request) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'ALL'
    const search = searchParams.get('search')?.trim() || ''

    // Calculate MRR from active businesses with plans or subscriptions
    const activeBusinessesWithPlans = await prisma.business.findMany({
      where: { status: 'ACTIVE', planId: { not: null } },
      include: { plan: true }
    })

    const mrr = activeBusinessesWithPlans.reduce((sum, b) => {
      const price = Number(b.plan?.price || 0)
      return sum + (b.plan?.billingPeriod === 'YEARLY' ? price / 12 : price)
    }, 0)

    const arr = mrr * 12

    // Count expiring soon (next 7 days)
    const now = new Date()
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const [pendingRenewalsCount, pastDueCount, totalSubscriptions] = await Promise.all([
      prisma.saaSSubscription.count({
        where: {
          currentPeriodEnd: { gte: now, lte: next7Days },
          status: 'ACTIVE'
        }
      }),
      prisma.saaSSubscription.count({
        where: { status: 'PAST_DUE' }
      }),
      prisma.saaSSubscription.count()
    ])

    // Filter subscriptions
    const whereClause: Record<string, unknown> = {}
    if (status !== 'ALL') {
      whereClause.status = status
    }
    if (search) {
      whereClause.OR = [
        { business: { name: { contains: search, mode: 'insensitive' } } },
        { business: { slug: { contains: search, mode: 'insensitive' } } },
        { paymentMethod: { contains: search, mode: 'insensitive' } }
      ]
    }

    const subscriptions = await prisma.saaSSubscription.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        business: {
          select: { id: true, name: true, slug: true, email: true, phone: true }
        },
        plan: {
          select: { id: true, name: true, slug: true, billingPeriod: true }
        }
      }
    })

    return NextResponse.json({
      summary: {
        mrr,
        arr,
        activeBusinessesCount: activeBusinessesWithPlans.length,
        pendingRenewalsCount,
        pastDueCount,
        totalSubscriptions
      },
      subscriptions: subscriptions.map(s => ({
        id: s.id,
        businessId: s.businessId,
        businessName: s.business.name,
        businessSlug: s.business.slug,
        businessEmail: s.business.email,
        planName: s.plan.name,
        amount: Number(s.amount),
        status: s.status,
        paymentMethod: s.paymentMethod || 'CARD',
        currentPeriodStart: s.currentPeriodStart,
        currentPeriodEnd: s.currentPeriodEnd,
        createdAt: s.createdAt,
        notes: s.notes
      }))
    })
  } catch (error) {
    console.error('Super Admin Billing GET Error:', error)
    return NextResponse.json({ error: 'Error al consultar facturación' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { businessId, planId, amount, paymentMethod = 'CARD', periodDays = 30, notes } = body

    if (!businessId || !planId) {
      return NextResponse.json({ error: 'Negocio y Plan son requeridos' }, { status: 400 })
    }

    const business = await prisma.business.findUnique({ where: { id: businessId } })
    const plan = await prisma.plan.findUnique({ where: { id: planId } })

    if (!business || !plan) {
      return NextResponse.json({ error: 'Negocio o Plan no encontrado' }, { status: 404 })
    }

    const startDate = new Date()
    const endDate = new Date(startDate.getTime() + periodDays * 24 * 60 * 60 * 1000)

    // Create subscription entry
    const newSub = await prisma.saaSSubscription.create({
      data: {
        businessId,
        planId,
        amount: Number(amount) || Number(plan.price),
        status: 'ACTIVE',
        currentPeriodStart: startDate,
        currentPeriodEnd: endDate,
        paymentMethod,
        notes
      }
    })

    // Update business subscription dates and plan
    await prisma.business.update({
      where: { id: businessId },
      data: {
        planId,
        status: 'ACTIVE',
        subscriptionEndsAt: endDate,
        maxBarbers: plan.maxBarbers,
        maxClients: plan.maxClients,
        maxAppointments: plan.maxAppointments
      }
    })

    await recordAuditLog({
      userId: session.userId,
      action: 'SUBSCRIPTION_RENEWED',
      entity: 'SaaSSubscription',
      entityId: newSub.id,
      businessId,
      details: { amount: newSub.amount, plan: plan.name, periodDays }
    })

    return NextResponse.json({ success: true, subscription: newSub }, { status: 201 })
  } catch (error) {
    console.error('Create Subscription Error:', error)
    return NextResponse.json({ error: 'Error al registrar suscripción' }, { status: 500 })
  }
}
