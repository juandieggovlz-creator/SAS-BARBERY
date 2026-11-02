import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const business = await prisma.business.findUnique({
      where: { id: session.businessId },
      include: {
        plan: true,
        saasSubscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    })

    const isTrial = business.status === 'TRIAL' || !!business.trialEndsAt
    const targetDate = isTrial ? business.trialEndsAt : business.subscriptionEndsAt

    let daysRemaining = null
    let isExpired = false

    if (targetDate) {
      const now = Date.now()
      const end = new Date(targetDate).getTime()
      daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)))
      isExpired = end < now
    }

    return NextResponse.json({
      success: true,
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        status: business.status,
        createdAt: business.createdAt,
        trialEndsAt: business.trialEndsAt,
        subscriptionEndsAt: business.subscriptionEndsAt,
        maxBarbers: business.maxBarbers,
        maxClients: business.maxClients,
        maxAppointments: business.maxAppointments,
        plan: business.plan ? {
          id: business.plan.id,
          name: business.plan.name,
          slug: business.plan.slug,
          price: Number(business.plan.price),
          features: Array.isArray(business.plan.features) ? business.plan.features : [],
          maxBarbers: business.plan.maxBarbers,
          maxClients: business.plan.maxClients,
          maxAppointments: business.plan.maxAppointments
        } : null
      },
      daysRemaining,
      isExpired,
      isTrial,
      plans: plans.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.price),
        billingPeriod: p.billingPeriod,
        maxBarbers: p.maxBarbers,
        maxClients: p.maxClients,
        maxAppointments: p.maxAppointments,
        features: Array.isArray(p.features) ? p.features : [],
        isPopular: p.isPopular
      }))
    })
  } catch (error) {
    console.error('Owner Subscription GET Error:', error)
    return NextResponse.json({ error: 'Error al consultar suscripción' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { planId } = body

    if (!planId) {
      return NextResponse.json({ error: 'Debes seleccionar un plan válido' }, { status: 400 })
    }

    const selectedPlan = await prisma.plan.findUnique({
      where: { id: planId }
    })

    if (!selectedPlan || !selectedPlan.isActive) {
      return NextResponse.json({ error: 'El plan seleccionado no está disponible' }, { status: 404 })
    }

    const currentBusiness = await prisma.business.findUnique({
      where: { id: session.businessId }
    })

    // Actualizar plan del negocio y aplicar los nuevos límites
    const updatedBusiness = await prisma.business.update({
      where: { id: session.businessId },
      data: {
        planId: selectedPlan.id,
        maxBarbers: selectedPlan.maxBarbers,
        maxClients: selectedPlan.maxClients,
        maxAppointments: selectedPlan.maxAppointments,
      },
      include: { plan: true }
    })

    await recordAuditLog({
      userId: session.userId,
      businessId: session.businessId,
      action: 'PLAN_CHANGED',
      entity: 'Business',
      entityId: session.businessId,
      details: {
        previousPlanId: currentBusiness?.planId,
        newPlanId: selectedPlan.id,
        newPlanName: selectedPlan.name,
      }
    })

    return NextResponse.json({
      success: true,
      message: `Plan actualizado con éxito a "${selectedPlan.name}"`,
      business: updatedBusiness
    })
  } catch (error) {
    console.error('Owner Subscription POST Error:', error)
    return NextResponse.json({ error: 'Error al cambiar de plan' }, { status: 500 })
  }
}
