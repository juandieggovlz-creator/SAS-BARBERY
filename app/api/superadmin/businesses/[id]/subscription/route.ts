import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { action, days, planId, period, reason, notes } = body

    const business = await prisma.business.findUnique({
      where: { id },
      include: { plan: true }
    })

    if (!business) {
      return NextResponse.json({ error: 'Barbería no encontrada' }, { status: 404 })
    }

    const now = new Date()

    // 1. Activar prueba (7, 15, 30, 60 días, personalizado)
    if (action === 'ACTIVATE_TRIAL') {
      const trialDays = Number(days) || 15
      const newTrialEnds = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000)

      const updated = await prisma.business.update({
        where: { id },
        data: {
          status: 'TRIAL',
          trialEndsAt: newTrialEnds
        }
      })

      await recordAuditLog({
        userId: session.userId,
        userRole: 'SUPER_ADMIN',
        businessId: id,
        action: 'TRIAL_ACTIVATED',
        entity: 'Business',
        entityId: id,
        details: {
          days: trialDays,
          trialEndsAt: newTrialEnds.toISOString(),
          businessName: business.name
        }
      })

      return NextResponse.json({
        success: true,
        message: `Prueba de ${trialDays} días activada para ${business.name}`,
        business: updated
      })
    }

    // 2. Activar plan (Mensual, Trimestral, Semestral, Anual)
    if (action === 'ACTIVATE_PLAN') {
      if (!planId) {
        return NextResponse.json({ error: 'Debes seleccionar un plan' }, { status: 400 })
      }

      const plan = await prisma.plan.findUnique({ where: { id: planId } })
      if (!plan) {
        return NextResponse.json({ error: 'Plan seleccionado no existe' }, { status: 404 })
      }

      let durationMonths = 1
      if (period === 'QUARTERLY') durationMonths = 3
      if (period === 'BIANNUAL') durationMonths = 6
      if (period === 'YEARLY') durationMonths = 12

      const newSubscriptionEnds = new Date(now.getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000)

      const updated = await prisma.business.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          planId: plan.id,
          subscriptionEndsAt: newSubscriptionEnds
        }
      })

      // Registrar suscripción en historial SaaS
      await prisma.saaSSubscription.create({
        data: {
          businessId: id,
          planId: plan.id,
          amount: plan.price,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: newSubscriptionEnds,
          notes: notes || `Plan ${plan.name} (${period || 'MONTHLY'}) activado desde Super Admin`
        }
      })

      await recordAuditLog({
        userId: session.userId,
        userRole: 'SUPER_ADMIN',
        businessId: id,
        action: 'PLAN_ACTIVATED',
        entity: 'Business',
        entityId: id,
        details: {
          planName: plan.name,
          period: period || 'MONTHLY',
          subscriptionEndsAt: newSubscriptionEnds.toISOString(),
          businessName: business.name
        }
      })

      return NextResponse.json({
        success: true,
        message: `Plan ${plan.name} activado hasta el ${newSubscriptionEnds.toLocaleDateString()}`,
        business: updated
      })
    }

    // 3. Extender plan (+30, +60, +90 días)
    if (action === 'EXTEND_PLAN') {
      const extendDays = Number(days) || 30
      const currentEnd = business.subscriptionEndsAt && new Date(business.subscriptionEndsAt) > now
        ? new Date(business.subscriptionEndsAt)
        : now

      const newEnd = new Date(currentEnd.getTime() + extendDays * 24 * 60 * 60 * 1000)

      const updated = await prisma.business.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          subscriptionEndsAt: newEnd
        }
      })

      await recordAuditLog({
        userId: session.userId,
        userRole: 'SUPER_ADMIN',
        businessId: id,
        action: 'PLAN_EXTENDED',
        entity: 'Business',
        entityId: id,
        details: {
          daysAdded: extendDays,
          newSubscriptionEndsAt: newEnd.toISOString(),
          businessName: business.name
        }
      })

      return NextResponse.json({
        success: true,
        message: `Plan extendido +${extendDays} días (hasta ${newEnd.toLocaleDateString()})`,
        business: updated
      })
    }

    // 4. Suspender acceso
    if (action === 'SUSPEND') {
      const reasonLabel = reason || 'FALTA_DE_PAGO'
      const updated = await prisma.business.update({
        where: { id },
        data: { status: 'SUSPENDED' }
      })

      await recordAuditLog({
        userId: session.userId,
        userRole: 'SUPER_ADMIN',
        businessId: id,
        action: 'BUSINESS_SUSPENDED',
        entity: 'Business',
        entityId: id,
        details: {
          reason: reasonLabel,
          notes: notes || 'Suspensión ejecutada desde Super Admin',
          businessName: business.name
        }
      })

      return NextResponse.json({
        success: true,
        message: `Barbería ${business.name} suspendida por ${reasonLabel}`,
        business: updated
      })
    }

    // 5. Reactivar acceso
    if (action === 'REACTIVATE') {
      const updated = await prisma.business.update({
        where: { id },
        data: { status: 'ACTIVE' }
      })

      await recordAuditLog({
        userId: session.userId,
        userRole: 'SUPER_ADMIN',
        businessId: id,
        action: 'BUSINESS_REACTIVATED',
        entity: 'Business',
        entityId: id,
        details: {
          businessName: business.name,
          notes: notes || 'Reactivación ejecutada desde Super Admin'
        }
      })

      return NextResponse.json({
        success: true,
        message: `Barbería ${business.name} reactivada correctamente`,
        business: updated
      })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error) {
    console.error('Subscription management error:', error)
    return NextResponse.json({ error: 'Error al gestionar la suscripción' }, { status: 500 })
  }
}
