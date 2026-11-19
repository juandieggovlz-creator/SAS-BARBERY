import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'
import { sendSentinelNotification } from '@/lib/telegram-sentinel'
import { addCalendarMonths, addDays, formatColombiaDate } from '@/lib/billing-dates'

export const dynamic = 'force-dynamic'

/**
 * POST /api/superadmin/billing/activate
 * Activa, renueva o actualiza manualmente la suscripción de un negocio con registro de pago y trazabilidad
 */
export async function POST(request: Request) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ROOT_PLATFORM_OWNER')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const {
      businessId,
      planId,
      amount,
      paymentMethod = 'TRANSFER',
      paymentReference,
      periodMonths = 1,
      periodDays,
      preserveRemainingDays = true,
      activationType = 'RENEWAL_EXTENSION', // 'RENEWAL_EXTENSION' | 'UPGRADE_IMMEDIATE_DIFFERENCE' | 'UPGRADE_NEW_FULL_PERIOD'
      planRequestId,
      notes
    } = body

    if (!businessId || !planId) {
      return NextResponse.json({ error: 'businessId y planId son obligatorios' }, { status: 400 })
    }

    const [business, plan] = await Promise.all([
      prisma.business.findUnique({
        where: { id: businessId },
        include: { company: true, plan: true }
      }),
      prisma.plan.findUnique({ where: { id: planId } })
    ])

    if (!business || !plan) {
      return NextResponse.json({ error: 'Negocio o Plan no encontrado' }, { status: 404 })
    }

    const now = new Date()
    const previousPlanName = business.plan?.name || 'Sin plan / Sandbox'
    const previousSubscriptionEnd = business.subscriptionEndsAt

    let startDate = now
    let endDate: Date

    // Manejo exacto según el tipo de activación seleccionado por el Super Admin:
    if (activationType === 'UPGRADE_IMMEDIATE_DIFFERENCE') {
      // UPGRADE INMEDIATO (Se cobra diferencia acordada, se mantiene la fecha de vencimiento original)
      if (business.subscriptionEndsAt && new Date(business.subscriptionEndsAt).getTime() > now.getTime()) {
        endDate = new Date(business.subscriptionEndsAt)
      } else {
        // Si no tenía fecha vigente, se asigna 1 mes calendario desde hoy
        endDate = addCalendarMonths(now, 1)
      }
    } else if (activationType === 'UPGRADE_NEW_FULL_PERIOD') {
      // UPGRADE CON PERÍODO NUEVO COMPLETO (Inicia desde hoy un nuevo ciclo completo)
      startDate = now
      if (periodDays) {
        endDate = addDays(now, Number(periodDays))
      } else {
        endDate = addCalendarMonths(now, Number(periodMonths) || 1)
      }
    } else {
      // RENOVACIÓN / EXTENSIÓN ESTÁNDAR
      if (
        preserveRemainingDays &&
        business.subscriptionEndsAt &&
        new Date(business.subscriptionEndsAt).getTime() > now.getTime()
      ) {
        // La suscripción actual sigue vigente en el futuro: la extensión comienza desde el final del período pagado
        startDate = new Date(business.subscriptionEndsAt)
      } else {
        // Ya venció o está en Sandbox: el nuevo período inicia hoy en la fecha efectiva de activación
        startDate = now
      }

      if (periodDays) {
        endDate = addDays(startDate, Number(periodDays))
      } else {
        endDate = addCalendarMonths(startDate, Number(periodMonths) || 1)
      }
    }

    const finalAmount = amount !== undefined && amount !== null ? Number(amount) : Number(plan.price)

    // Transacción atómica: verificación de idempotencia + creación SaaSSubscription + update Business + update PlanRequest
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verificación de idempotencia si viene de una solicitud existente
      if (planRequestId) {
        const existingReq = await tx.planRequest.findUnique({ where: { id: planRequestId } })
        if (!existingReq) {
          throw new Error('La solicitud especificada no existe')
        }
        if (existingReq.status === 'APPROVED') {
          throw new Error('Esta solicitud ya fue aprobada previamente. No se permite duplicar la activación.')
        }
      }

      // 2. Crear registro formal en SaaSSubscription
      const subscription = await tx.saaSSubscription.create({
        data: {
          businessId: business.id,
          planId: plan.id,
          amount: finalAmount,
          status: 'ACTIVE',
          currentPeriodStart: startDate,
          currentPeriodEnd: endDate,
          paymentMethod,
          paymentReference: paymentReference || null,
          notes: notes || `Activación manual (${activationType}) ejecutada por Super Admin (${session.userId})`
        }
      })

      // 3. Actualizar estado y límites del negocio
      const updatedBusiness = await tx.business.update({
        where: { id: business.id },
        data: {
          status: 'ACTIVE',
          planId: plan.id,
          subscriptionEndsAt: endDate,
          maxBarbers: plan.maxBarbers,
          maxClients: plan.maxClients,
          maxAppointments: plan.maxAppointments
        }
      })

      // 3.1 Si el negocio tiene una Company asociada, sincronizar el plan
      if (business.companyId) {
        await tx.company.update({
          where: { id: business.companyId },
          data: {
            planId: plan.id,
            status: 'ACTIVE'
          }
        })
      }

      // 4. Si venía asociada a una solicitud de plan, marcarla como APPROVED de forma atómica
      if (planRequestId) {
        await tx.planRequest.update({
          where: { id: planRequestId },
          data: {
            status: 'APPROVED',
            paymentMethod,
            paymentReference: paymentReference || null,
            adminNotes: notes || `Aprobado por Super Admin. Activación: ${activationType}`,
            reviewedBy: session.userId,
            reviewedAt: now
          }
        })
      }

      return { subscription, updatedBusiness }
    })

    // Registrar en AuditLog con trazabilidad completa
    await recordAuditLog({
      userId: session.userId,
      userRole: 'SUPER_ADMIN',
      businessId: business.id,
      action: 'SUBSCRIPTION_ACTIVATED_MANUAL',
      entity: 'SaaSSubscription',
      entityId: result.subscription.id,
      details: {
        activationType,
        previousPlanName,
        newPlanName: plan.name,
        previousSubscriptionEnd: previousSubscriptionEnd ? previousSubscriptionEnd.toISOString() : null,
        newSubscriptionEnd: endDate.toISOString(),
        effectiveStartDate: startDate.toISOString(),
        amount: finalAmount,
        paymentMethod,
        paymentReference,
        adminUserId: session.userId,
        planRequestId
      }
    })

    // Notificación en Telegram Sentinel
    const dateFormatted = formatColombiaDate(endDate)
    sendSentinelNotification({
      type: 'SUBSCRIPTION_ACTIVATED',
      priority: 'ALTA',
      title: '💎 Suscripción Activada / Renovada',
      message:
        `<b>Barbería:</b> ${business.name} (<code>${business.slug}</code>)\n` +
        `<b>Plan:</b> ⭐️ <b>${plan.name}</b> (Previo: ${previousPlanName})\n` +
        `<b>Tipo:</b> <code>${activationType}</code>\n` +
        `<b>Vigencia hasta:</b> <code>${dateFormatted}</code>\n` +
        `<b>Monto Verificado:</b> $${finalAmount.toLocaleString('es-CO')} COP\n` +
        `<b>Medio de Pago:</b> ${paymentMethod} ${paymentReference ? `(Ref: <code>${paymentReference}</code>)` : ''}\n` +
        `<b>Admin responsable:</b> <code>${session.userId}</code>\n` +
        (notes ? `<b>Notas:</b> <i>${notes}</i>\n` : ''),
      actionUrl: `https://sas-barbery.vercel.app/superadmin/businesses/${business.id}`
    }).catch(err => console.error('[Sentinel Activation Alert Error]:', err))

    return NextResponse.json({
      success: true,
      message: `Plan "${plan.name}" activado exitosamente para "${business.name}" hasta el ${dateFormatted}`,
      subscription: result.subscription,
      business: result.updatedBusiness
    })
  } catch (error: any) {
    console.error('Super Admin Activate Subscription Error:', error)
    return NextResponse.json({ error: error.message || 'Error al activar la suscripción' }, { status: 500 })
  }
}
