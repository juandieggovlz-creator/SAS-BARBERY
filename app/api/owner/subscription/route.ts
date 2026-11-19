import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'
import { getEffectiveSubscription } from '@/lib/commercial-permissions'

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
          take: 10,
          include: {
            plan: { select: { name: true, slug: true } }
          }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    // Obtener estado efectivo calculado
    const effectiveSub = await getEffectiveSubscription(business.id)

    // Planes comerciales públicos (Básico, Profesional, Premium)
    const plans = await prisma.plan.findMany({
      where: { isActive: true, isPublic: true },
      orderBy: { price: 'asc' }
    })

    // Todos los planes activos incluyendo Sandbox para la matriz comparativa oficial
    const allPlans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    })

    // Solicitud pendiente de plan (si existe)
    const pendingRequest = await prisma.planRequest.findFirst({
      where: {
        businessId: business.id,
        status: { in: ['PENDING', 'CONTACTED', 'WAITING_PAYMENT', 'PAYMENT_UNDER_REVIEW'] }
      },
      include: {
        plan: { select: { name: true, slug: true, price: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

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
        maxBarbers: effectiveSub.limits.maxBarbers,
        maxClients: effectiveSub.limits.maxClients,
        maxAppointments: effectiveSub.limits.maxAppointments,
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
      effectiveSub,
      daysRemaining: effectiveSub.daysRemaining,
      isInGracePeriod: effectiveSub.isInGracePeriod,
      graceDaysRemaining: effectiveSub.graceDaysRemaining,
      isExpired: effectiveSub.isSandbox && !effectiveSub.isTrial,
      isTrial: effectiveSub.isTrial,
      isSandbox: effectiveSub.isSandbox,
      pendingRequest: pendingRequest ? {
        id: pendingRequest.id,
        status: pendingRequest.status,
        planName: pendingRequest.plan.name,
        planSlug: pendingRequest.plan.slug,
        amount: Number(pendingRequest.amount || pendingRequest.plan.price),
        billingCycle: pendingRequest.billingCycle,
        createdAt: pendingRequest.createdAt,
        notes: pendingRequest.notes,
        adminNotes: pendingRequest.adminNotes
      } : null,
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
      })),
      allPlans: allPlans.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.price),
        billingPeriod: p.billingPeriod,
        maxBarbers: p.maxBarbers,
        maxClients: p.maxClients,
        maxAppointments: p.maxAppointments,
        features: Array.isArray(p.features) ? p.features : [],
        allowsMultiBranch: p.allowsMultiBranch,
        includedBranches: p.includedBranches,
        isPublic: p.isPublic
      })),
      recentSubscriptions: business.saasSubscriptions.map(s => ({
        id: s.id,
        planName: s.plan.name,
        amount: Number(s.amount),
        status: s.status,
        paymentMethod: s.paymentMethod,
        paymentReference: s.paymentReference,
        currentPeriodStart: s.currentPeriodStart,
        currentPeriodEnd: s.currentPeriodEnd,
        createdAt: s.createdAt
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

    // Si es SUPER_ADMIN, se permite cambio directo para pruebas/administración
    if (session.role === 'SUPER_ADMIN') {
      const body = await request.json()
      const { planId } = body

      const selectedPlan = await prisma.plan.findUnique({ where: { id: planId } })
      if (!selectedPlan) {
        return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })
      }

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
        action: 'PLAN_CHANGED_SUPERADMIN',
        entity: 'Business',
        entityId: session.businessId,
        details: { planId: selectedPlan.id, planName: selectedPlan.name }
      })

      return NextResponse.json({
        success: true,
        message: `Plan actualizado administrativamente a "${selectedPlan.name}"`,
        business: updatedBusiness
      })
    }

    // Para Owners normales: las solicitudes comerciales van a través de /api/owner/subscription/request
    return NextResponse.json({
      error: 'Para cambiar de plan comercial, utiliza la opción "Solicitar Plan" para generar la orden y procesar el pago correspondiente.',
      redirectToRequest: true
    }, { status: 400 })
  } catch (error) {
    console.error('Owner Subscription POST Error:', error)
    return NextResponse.json({ error: 'Error al procesar solicitud de plan' }, { status: 500 })
  }
}
