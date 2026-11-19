import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, isSuperAdminRole } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'
import {
  addCalendarMonths,
  addDays,
  formatColombiaDate,
  parseColombiaExpirationDate
} from '@/lib/billing-dates'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || !isSuperAdminRole(session.role)) {
    return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const {
      action,
      days,
      months,
      planId,
      period,
      expirationDate,
      preserveRemainingDays = true,
      keepCurrentExpiration = true,
      reason,
      notes
    } = body

    const business = await prisma.business.findUnique({
      where: { id },
      include: { plan: true, company: true }
    })

    if (!business) {
      return NextResponse.json({ error: 'Barbería no encontrada' }, { status: 404 })
    }

    const now = new Date()
    const previousSubEnd = business.subscriptionEndsAt ? new Date(business.subscriptionEndsAt) : null
    const previousTrialEnd = business.trialEndsAt ? new Date(business.trialEndsAt) : null

    // Determinar fecha base para extensiones sin sobrescribir ni perder días vigentes
    const resolveExtensionBaseDate = (): Date => {
      if (preserveRemainingDays !== false) {
        if (previousSubEnd && previousSubEnd.getTime() > now.getTime()) {
          return previousSubEnd
        }
        if (business.status === 'TRIAL' && previousTrialEnd && previousTrialEnd.getTime() > now.getTime()) {
          return previousTrialEnd
        }
      }
      return now
    }

    // 1. Activar prueba (7, 15, 30, 60 días, personalizado)
    if (action === 'ACTIVATE_TRIAL') {
      const trialDays = Math.max(1, Number(days) || 15)
      const newTrialEnds = addDays(now, trialDays)

      const updated = await prisma.business.update({
        where: { id },
        data: {
          status: 'TRIAL',
          trialEndsAt: newTrialEnds
        }
      })

      if (business.companyId) {
        await prisma.company.update({
          where: { id: business.companyId },
          data: {
            status: 'TRIAL',
            trialEndsAt: newTrialEnds
          }
        })
      }

      await recordAuditLog({
        userId: session.userId,
        userRole: session.role,
        businessId: id,
        action: 'TRIAL_ACTIVATED',
        entity: 'Business',
        entityId: id,
        details: {
          days: trialDays,
          previousTrialEndsAt: previousTrialEnd?.toISOString() || null,
          trialEndsAt: newTrialEnds.toISOString(),
          businessName: business.name
        }
      })

      return NextResponse.json({
        success: true,
        message: `Prueba de ${trialDays} días activada para ${business.name} (hasta ${formatColombiaDate(newTrialEnds)})`,
        business: updated
      })
    }

    // 2. Activar plan comercial (Mensual, Trimestral, Semestral, Anual)
    if (action === 'ACTIVATE_PLAN') {
      const targetPlanId = planId || business.planId
      if (!targetPlanId) {
        return NextResponse.json({ error: 'Debes seleccionar un plan' }, { status: 400 })
      }

      const plan = await prisma.plan.findUnique({ where: { id: targetPlanId } })
      if (!plan) {
        return NextResponse.json({ error: 'Plan seleccionado no existe' }, { status: 404 })
      }

      const normPeriod = String(period || 'MONTHLY').toUpperCase()
      let durationMonths = 1
      if (normPeriod === 'QUARTERLY') durationMonths = 3
      else if (normPeriod === 'BIANNUAL' || normPeriod === 'SEMIANNUAL') durationMonths = 6
      else if (normPeriod === 'YEARLY' || normPeriod === 'ANNUAL') durationMonths = 12

      const baseDate =
        preserveRemainingDays !== false && previousSubEnd && previousSubEnd.getTime() > now.getTime()
          ? previousSubEnd
          : now
      const newSubscriptionEnds = addCalendarMonths(baseDate, durationMonths)

      const updated = await prisma.business.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          planId: plan.id,
          subscriptionEndsAt: newSubscriptionEnds,
          maxBarbers: plan.maxBarbers,
          maxClients: plan.maxClients,
          maxAppointments: plan.maxAppointments
        }
      })

      if (business.companyId) {
        await prisma.company.update({
          where: { id: business.companyId },
          data: {
            status: 'ACTIVE',
            planId: plan.id,
            subscriptionEndsAt: newSubscriptionEnds,
            maxBranches: plan.includedBranches || 1
          }
        })
      }

      const subRecord = await prisma.saaSSubscription.create({
        data: {
          businessId: id,
          planId: plan.id,
          amount: Number(plan.price) * durationMonths,
          status: 'ACTIVE',
          currentPeriodStart: baseDate,
          currentPeriodEnd: newSubscriptionEnds,
          paymentMethod: body.paymentMethod || 'MANUAL_ADMIN',
          notes: notes || `Plan ${plan.name} (${normPeriod}) activado desde Super Admin`
        }
      })

      await recordAuditLog({
        userId: session.userId,
        userRole: session.role,
        businessId: id,
        action: 'PLAN_ACTIVATED',
        entity: 'Business',
        entityId: id,
        details: {
          previousPlanName: business.plan?.name || 'Sin plan',
          planName: plan.name,
          planSlug: plan.slug,
          period: normPeriod,
          durationMonths,
          previousSubscriptionEndsAt: previousSubEnd?.toISOString() || null,
          subscriptionEndsAt: newSubscriptionEnds.toISOString(),
          subscriptionId: subRecord.id,
          businessName: business.name
        }
      })

      return NextResponse.json({
        success: true,
        message: `Plan ${plan.name} (${normPeriod}) activado hasta el ${formatColombiaDate(newSubscriptionEnds)}`,
        business: updated
      })
    }

    // 2.5. Cambiar de plan manualmente (aplicando nuevos límites y módulos de inmediato sin borrar datos)
    if (action === 'CHANGE_PLAN') {
      if (!planId) {
        return NextResponse.json({ error: 'Debes especificar el nuevo plan (planId)' }, { status: 400 })
      }

      const plan = await prisma.plan.findUnique({ where: { id: planId } })
      if (!plan) {
        return NextResponse.json({ error: 'El plan especificado no existe' }, { status: 404 })
      }

      const isSandboxPlan = plan.slug.toLowerCase() === 'sandbox'
      const effectiveSubEnd = isSandboxPlan
        ? null
        : keepCurrentExpiration !== false && previousSubEnd && previousSubEnd.getTime() > now.getTime()
        ? previousSubEnd
        : addCalendarMonths(now, 1)

      const updated = await prisma.business.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          planId: plan.id,
          subscriptionEndsAt: effectiveSubEnd,
          ...(isSandboxPlan ? { trialEndsAt: null } : {}),
          maxBarbers: plan.maxBarbers,
          maxClients: plan.maxClients,
          maxAppointments: plan.maxAppointments
        }
      })

      if (business.companyId) {
        await prisma.company.update({
          where: { id: business.companyId },
          data: {
            status: 'ACTIVE',
            planId: plan.id,
            subscriptionEndsAt: effectiveSubEnd,
            ...(isSandboxPlan ? { trialEndsAt: null } : {}),
            maxBranches: plan.includedBranches || 1
          }
        })
      }

      if (!isSandboxPlan && effectiveSubEnd) {
        await prisma.saaSSubscription.create({
          data: {
            businessId: id,
            planId: plan.id,
            amount: plan.price,
            status: 'ACTIVE',
            currentPeriodStart: now,
            currentPeriodEnd: effectiveSubEnd,
            paymentMethod: 'ADMIN_ASSIGNMENT',
            notes: notes || `Cambio administrativo de plan (${business.plan?.name || 'Anterior'} -> ${plan.name})`
          }
        })
      }

      await recordAuditLog({
        userId: session.userId,
        userRole: session.role,
        businessId: id,
        action: 'PLAN_CHANGED',
        entity: 'Business',
        entityId: id,
        details: {
          previousPlanId: business.planId,
          previousPlanName: business.plan?.name || 'Sin plan',
          newPlanId: plan.id,
          newPlanName: plan.name,
          newPlanSlug: plan.slug,
          newMaxBarbers: plan.maxBarbers,
          newMaxBranches: plan.includedBranches || 1,
          subscriptionEndsAt: effectiveSubEnd?.toISOString() || null,
          businessName: business.name
        }
      })

      return NextResponse.json({
        success: true,
        message: `Plan actualizado a ${plan.name}${effectiveSubEnd ? ` (vigente hasta ${formatColombiaDate(effectiveSubEnd)})` : ''}`,
        business: updated
      })
    }

    // 3. Extender plan por días (+7, +15, +30, +60, +90 días o personalizado)
    if (action === 'EXTEND_PLAN' || action === 'EXTEND_DAYS') {
      const extendDays = Math.max(1, Number(days) || 30)
      const baseDate = resolveExtensionBaseDate()
      const newEnd = addDays(baseDate, extendDays)

      const updated = await prisma.business.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          subscriptionEndsAt: newEnd
        }
      })

      if (business.companyId) {
        await prisma.company.update({
          where: { id: business.companyId },
          data: {
            status: 'ACTIVE',
            subscriptionEndsAt: newEnd
          }
        })
      }

      if (business.planId) {
        await prisma.saaSSubscription.create({
          data: {
            businessId: id,
            planId: business.planId,
            amount: 0,
            status: 'ACTIVE',
            currentPeriodStart: baseDate,
            currentPeriodEnd: newEnd,
            paymentMethod: 'EXTENSION_DAYS',
            notes: notes || `Extensión manual +${extendDays} días desde Super Admin`
          }
        })
      }

      await recordAuditLog({
        userId: session.userId,
        userRole: session.role,
        businessId: id,
        action: 'PLAN_EXTENDED',
        entity: 'Business',
        entityId: id,
        details: {
          daysAdded: extendDays,
          previousSubscriptionEndsAt: previousSubEnd?.toISOString() || null,
          baseDateUsed: baseDate.toISOString(),
          newSubscriptionEndsAt: newEnd.toISOString(),
          businessName: business.name
        }
      })

      return NextResponse.json({
        success: true,
        message: `Suscripción extendida +${extendDays} días (nueva fecha: ${formatColombiaDate(newEnd)})`,
        business: updated
      })
    }

    // 3.5. Extender plan por meses calendario (+1, +3, +6, +12 meses)
    if (action === 'EXTEND_MONTHS') {
      const extendMonths = Math.max(1, Number(months) || 1)
      const baseDate = resolveExtensionBaseDate()
      const newEnd = addCalendarMonths(baseDate, extendMonths)

      const updated = await prisma.business.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          subscriptionEndsAt: newEnd
        }
      })

      if (business.companyId) {
        await prisma.company.update({
          where: { id: business.companyId },
          data: {
            status: 'ACTIVE',
            subscriptionEndsAt: newEnd
          }
        })
      }

      if (business.planId) {
        await prisma.saaSSubscription.create({
          data: {
            businessId: id,
            planId: business.planId,
            amount: Number(business.plan?.price || 0) * extendMonths,
            status: 'ACTIVE',
            currentPeriodStart: baseDate,
            currentPeriodEnd: newEnd,
            paymentMethod: 'EXTENSION_MONTHS',
            notes: notes || `Extensión manual +${extendMonths} mes(es) desde Super Admin`
          }
        })
      }

      await recordAuditLog({
        userId: session.userId,
        userRole: session.role,
        businessId: id,
        action: 'PLAN_EXTENDED_MONTHS',
        entity: 'Business',
        entityId: id,
        details: {
          monthsAdded: extendMonths,
          previousSubscriptionEndsAt: previousSubEnd?.toISOString() || null,
          baseDateUsed: baseDate.toISOString(),
          newSubscriptionEndsAt: newEnd.toISOString(),
          businessName: business.name
        }
      })

      return NextResponse.json({
        success: true,
        message: `Suscripción extendida +${extendMonths} mes(es) (nueva fecha: ${formatColombiaDate(newEnd)})`,
        business: updated
      })
    }

    // 3.8. Establecer una fecha de vencimiento específica (Zona horaria Colombia America/Bogota)
    if (action === 'SET_EXPIRATION_DATE') {
      if (!expirationDate) {
        return NextResponse.json({ error: 'Debes indicar la nueva fecha de vencimiento' }, { status: 400 })
      }

      const newEnd = parseColombiaExpirationDate(expirationDate)
      const isFuture = newEnd.getTime() > now.getTime()
      const nextStatus = isFuture ? 'ACTIVE' : business.status

      const updated = await prisma.business.update({
        where: { id },
        data: {
          status: nextStatus,
          subscriptionEndsAt: newEnd
        }
      })

      if (business.companyId) {
        await prisma.company.update({
          where: { id: business.companyId },
          data: {
            status: nextStatus,
            subscriptionEndsAt: newEnd
          }
        })
      }

      if (business.planId && isFuture) {
        await prisma.saaSSubscription.create({
          data: {
            businessId: id,
            planId: business.planId,
            amount: 0,
            status: 'ACTIVE',
            currentPeriodStart: now,
            currentPeriodEnd: newEnd,
            paymentMethod: 'MANUAL_DATE_SET',
            notes: notes || `Fecha de vencimiento fijada manualmente al ${formatColombiaDate(newEnd)}`
          }
        })
      }

      await recordAuditLog({
        userId: session.userId,
        userRole: session.role,
        businessId: id,
        action: 'SUBSCRIPTION_EXPIRATION_SET',
        entity: 'Business',
        entityId: id,
        details: {
          previousSubscriptionEndsAt: previousSubEnd?.toISOString() || null,
          newSubscriptionEndsAt: newEnd.toISOString(),
          isFuture,
          notes: notes || null,
          businessName: business.name
        }
      })

      return NextResponse.json({
        success: true,
        message: `Fecha de vencimiento establecida al ${formatColombiaDate(newEnd)}`,
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

      if (business.companyId) {
        await prisma.company.update({
          where: { id: business.companyId },
          data: { status: 'SUSPENDED' }
        })
      }

      await recordAuditLog({
        userId: session.userId,
        userRole: session.role,
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

    // 5. Reactivar acceso (y si estaba vencida, asignar vigencia activa para salir de Sandbox/Suspensión)
    if (action === 'REACTIVATE') {
      const isCurrentlyExpired =
        (!previousSubEnd || previousSubEnd.getTime() <= now.getTime()) &&
        (!previousTrialEnd || previousTrialEnd.getTime() <= now.getTime())

      let effectiveSubEnd = previousSubEnd
      if (days && Number(days) > 0) {
        const base = previousSubEnd && previousSubEnd.getTime() > now.getTime() ? previousSubEnd : now
        effectiveSubEnd = addDays(base, Number(days))
      } else if (months && Number(months) > 0) {
        const base = previousSubEnd && previousSubEnd.getTime() > now.getTime() ? previousSubEnd : now
        effectiveSubEnd = addCalendarMonths(base, Number(months))
      } else if (isCurrentlyExpired) {
        effectiveSubEnd = addCalendarMonths(now, 1)
      }

      const updated = await prisma.business.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          ...(effectiveSubEnd ? { subscriptionEndsAt: effectiveSubEnd } : {})
        }
      })

      if (business.companyId) {
        await prisma.company.update({
          where: { id: business.companyId },
          data: {
            status: 'ACTIVE',
            ...(effectiveSubEnd ? { subscriptionEndsAt: effectiveSubEnd } : {})
          }
        })
      }

      if (business.planId && isCurrentlyExpired && effectiveSubEnd) {
        await prisma.saaSSubscription.create({
          data: {
            businessId: id,
            planId: business.planId,
            amount: Number(business.plan?.price || 0),
            status: 'ACTIVE',
            currentPeriodStart: now,
            currentPeriodEnd: effectiveSubEnd,
            paymentMethod: 'REACTIVATION',
            notes: notes || 'Reactivación administrativa de suscripción vencida'
          }
        })
      }

      await recordAuditLog({
        userId: session.userId,
        userRole: session.role,
        businessId: id,
        action: 'BUSINESS_REACTIVATED',
        entity: 'Business',
        entityId: id,
        details: {
          businessName: business.name,
          wasExpired: isCurrentlyExpired,
          previousSubscriptionEndsAt: previousSubEnd?.toISOString() || null,
          newSubscriptionEndsAt: effectiveSubEnd?.toISOString() || null,
          notes: notes || 'Reactivación ejecutada desde Super Admin'
        }
      })

      return NextResponse.json({
        success: true,
        message: `Barbería ${business.name} reactivada correctamente${effectiveSubEnd ? ` (vigente hasta ${formatColombiaDate(effectiveSubEnd)})` : ''}`,
        business: updated
      })
    }

    // 6. Asignar vigencia indefinida (sin fecha de expiración ficticia ni 2099)
    if (action === 'SET_INDEFINITE') {
      const targetPlanId = planId || business.planId
      let activePlanId = targetPlanId
      if (!activePlanId) {
        const defaultPlan = await prisma.plan.findFirst({
          where: { isActive: true },
          orderBy: { price: 'desc' }
        })
        activePlanId = defaultPlan?.id || null
      }

      const plan = activePlanId ? await prisma.plan.findUnique({ where: { id: activePlanId } }) : null

      const updated = await prisma.business.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          planId: activePlanId,
          subscriptionEndsAt: null,
          trialEndsAt: null
        }
      })

      if (business.companyId) {
        await prisma.company.update({
          where: { id: business.companyId },
          data: {
            status: 'ACTIVE',
            planId: activePlanId,
            subscriptionEndsAt: null,
            trialEndsAt: null
          }
        })
      }

      await prisma.saaSSubscription.create({
        data: {
          businessId: id,
          planId: activePlanId || business.planId || '',
          amount: 0,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: now,
          paymentMethod: 'INDEFINITE_ADMIN',
          notes: notes || `Vigencia INDEFINIDA asignada desde Super Admin por usuario ${session.userId}`
        }
      })

      await recordAuditLog({
        userId: session.userId,
        userRole: session.role,
        businessId: id,
        action: 'INDEFINITE_SUBSCRIPTION_SET',
        entity: 'Business',
        entityId: id,
        details: {
          businessName: business.name,
          planName: plan?.name || business.plan?.name || 'Comercial',
          assignedBy: session.userId,
          notes: notes || 'Vigencia indefinida asignada',
          executedAt: new Date().toISOString()
        }
      })

      return NextResponse.json({
        success: true,
        message: `Vigencia INDEFINIDA asignada exitosamente a ${business.name}. No vencerá automáticamente.`,
        business: updated
      })
    }

    // 6.5. Retirar vigencia indefinida y retornar a una fecha determinada
    if (action === 'REVOKE_INDEFINITE') {
      const newEnd = expirationDate
        ? parseColombiaExpirationDate(expirationDate)
        : addCalendarMonths(now, 1)

      const updated = await prisma.business.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          subscriptionEndsAt: newEnd
        }
      })

      if (business.companyId) {
        await prisma.company.update({
          where: { id: business.companyId },
          data: {
            status: 'ACTIVE',
            subscriptionEndsAt: newEnd
          }
        })
      }

      await recordAuditLog({
        userId: session.userId,
        userRole: session.role,
        businessId: id,
        action: 'INDEFINITE_SUBSCRIPTION_REVOKED',
        entity: 'Business',
        entityId: id,
        details: {
          businessName: business.name,
          revokedBy: session.userId,
          newSubscriptionEndsAt: newEnd.toISOString()
        }
      })

      return NextResponse.json({
        success: true,
        message: `Vigencia indefinida revocada. Nueva fecha de vencimiento: ${formatColombiaDate(newEnd)}.`,
        business: updated
      })
    }

    // 7. ASIGNAR MODO PRUEBAS ILIMITADO (Para negocio interno de pruebas del Super Admin)
    if (action === 'ASSIGN_UNLIMITED_TEST_MODE') {
      const topPlan = await prisma.plan.findFirst({
        where: { isActive: true },
        orderBy: { price: 'desc' }
      })

      if (!topPlan) {
        return NextResponse.json({ error: 'No se encontró un plan activo disponible' }, { status: 500 })
      }

      const updated = await prisma.business.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          planId: topPlan.id,
          subscriptionEndsAt: null,
          trialEndsAt: null,
          maxBarbers: null, // Sin límite comercial
          maxClients: null, // Sin límite comercial
          maxAppointments: null // Sin límite comercial
        }
      })

      if (business.companyId) {
        await prisma.company.update({
          where: { id: business.companyId },
          data: {
            status: 'ACTIVE',
            planId: topPlan.id,
            subscriptionEndsAt: null,
            trialEndsAt: null,
            maxBranches: -1 // Sin límite de sedes (-1 representa formalmente ilimitado)
          }
        })
      }

      // Guardar marcador explícito en PlatformSetting
      await prisma.platformSetting.upsert({
        where: { key: `test_mode_${id}` },
        update: {
          value: JSON.stringify({
            enabled: true,
            grantedBy: session.userId,
            grantedAt: new Date().toISOString(),
            businessName: business.name,
            reason: reason || 'Negocio interno de pruebas de plataforma'
          }),
          description: `Acceso de pruebas ilimitado para ${business.name}`
        },
        create: {
          key: `test_mode_${id}`,
          value: JSON.stringify({
            enabled: true,
            grantedBy: session.userId,
            grantedAt: new Date().toISOString(),
            businessName: business.name,
            reason: reason || 'Negocio interno de pruebas de plataforma'
          }),
          description: `Acceso de pruebas ilimitado para ${business.name}`
        }
      })

      await recordAuditLog({
        userId: session.userId,
        userRole: session.role,
        businessId: id,
        action: 'UNLIMITED_TEST_MODE_ASSIGNED',
        entity: 'Business',
        entityId: id,
        details: {
          businessName: business.name,
          grantedBy: session.userId,
          topPlanName: topPlan.name,
          limits: 'UNLIMITED (null)'
        }
      })

      return NextResponse.json({
        success: true,
        message: `¡Modo Pruebas Ilimitado activado para ${business.name}! Plan ${topPlan.name}, barberos y sedes ilimitados sin vencimiento.`,
        business: updated
      })
    }

    // 7.5. REVOCAR MODO PRUEBAS ILIMITADO
    if (action === 'REVOKE_UNLIMITED_TEST_MODE') {
      const plan = business.plan || await prisma.plan.findFirst({ where: { isActive: true }, orderBy: { price: 'asc' } })

      const newEnd = addCalendarMonths(now, 1)
      const updated = await prisma.business.update({
        where: { id },
        data: {
          maxBarbers: plan?.maxBarbers || 3,
          maxClients: plan?.maxClients || 500,
          maxAppointments: plan?.maxAppointments || 1000,
          subscriptionEndsAt: newEnd
        }
      })

      if (business.companyId) {
        await prisma.company.update({
          where: { id: business.companyId },
          data: {
            maxBranches: plan?.includedBranches || 1,
            subscriptionEndsAt: newEnd
          }
        })
      }

      await prisma.platformSetting.deleteMany({
        where: { key: `test_mode_${id}` }
      })

      await recordAuditLog({
        userId: session.userId,
        userRole: session.role,
        businessId: id,
        action: 'UNLIMITED_TEST_MODE_REVOKED',
        entity: 'Business',
        entityId: id,
        details: {
          businessName: business.name,
          revokedBy: session.userId
        }
      })

      return NextResponse.json({
        success: true,
        message: `Modo pruebas ilimitado revocado para ${business.name}. Restablecidos límites estándar del plan.`,
        business: updated
      })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error: any) {
    console.error('Subscription management error:', error)
    return NextResponse.json({ error: error?.message || 'Error al gestionar la suscripción' }, { status: 500 })
  }
}
