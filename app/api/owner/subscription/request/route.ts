import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'
import { getEffectiveSubscription } from '@/lib/commercial-permissions'
import { sendSentinelNotification } from '@/lib/telegram-sentinel'

export const dynamic = 'force-dynamic'

/**
 * GET /api/owner/subscription/request
 * Consulta las solicitudes de plan realizadas por la barbería del usuario
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const requests = await prisma.planRequest.findMany({
      where: { businessId: session.businessId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            billingPeriod: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      requests: requests.map(r => ({
        id: r.id,
        status: r.status,
        planName: r.plan.name,
        planSlug: r.plan.slug,
        billingCycle: r.billingCycle,
        amount: Number(r.amount || r.plan.price),
        notes: r.notes,
        adminNotes: r.adminNotes,
        paymentMethod: r.paymentMethod,
        paymentReference: r.paymentReference,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      }))
    })
  } catch (error) {
    console.error('Owner Plan Request GET Error:', error)
    return NextResponse.json({ error: 'Error al consultar solicitudes de plan' }, { status: 500 })
  }
}

/**
 * POST /api/owner/subscription/request
 * Crea una solicitud formal para contratar o actualizar un plan comercial de pago
 */
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      planId,
      billingCycle = 'MONTHLY',
      contactName,
      contactPhone,
      notes,
      paymentMethod = 'TRANSFER',
      paymentReference
    } = body

    if (!planId) {
      return NextResponse.json({ error: 'Debes seleccionar un plan válido' }, { status: 400 })
    }

    const selectedPlan = await prisma.plan.findUnique({
      where: { id: planId }
    })

    if (!selectedPlan || !selectedPlan.isActive || selectedPlan.slug === 'sandbox') {
      return NextResponse.json({ error: 'El plan seleccionado no está disponible para contratación' }, { status: 404 })
    }

    const business = await prisma.business.findUnique({
      where: { id: session.businessId },
      include: {
        users: { where: { id: session.userId } }
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    const currentUser = business.users[0]
    const effectiveSub = await getEffectiveSubscription(business.id)

    // Verificar si ya existe una solicitud PENDING o WAITING_PAYMENT para evitar duplicados innecesarios
    const existingPending = await prisma.planRequest.findFirst({
      where: {
        businessId: business.id,
        status: { in: ['PENDING', 'CONTACTED', 'WAITING_PAYMENT', 'PAYMENT_UNDER_REVIEW'] }
      },
      include: { plan: true }
    })

    // Calcular monto según ciclo
    let multiplier = 1
    if (billingCycle === 'QUARTERLY') multiplier = 3
    else if (billingCycle === 'BIANNUAL') multiplier = 6
    else if (billingCycle === 'YEARLY') multiplier = 12 // Se puede aplicar descuento si se requiere

    const basePrice = Number(selectedPlan.price)
    const totalAmount = basePrice * multiplier

    // Si ya tenía una solicitud pendiente, actualizarla en vez de duplicar
    let planRequest
    if (existingPending) {
      planRequest = await prisma.planRequest.update({
        where: { id: existingPending.id },
        data: {
          planId: selectedPlan.id,
          billingCycle,
          amount: totalAmount,
          contactName: contactName || currentUser?.name || business.name,
          contactPhone: contactPhone || business.phone || '',
          contactEmail: currentUser?.email || business.email || '',
          notes: notes || existingPending.notes,
          paymentMethod,
          paymentReference: paymentReference || existingPending.paymentReference,
          status: 'PENDING'
        },
        include: { plan: true }
      })
    } else {
      planRequest = await prisma.planRequest.create({
        data: {
          businessId: business.id,
          planId: selectedPlan.id,
          userId: session.userId,
          contactName: contactName || currentUser?.name || business.name,
          contactPhone: contactPhone || business.phone || '',
          contactEmail: currentUser?.email || business.email || '',
          billingCycle,
          amount: totalAmount,
          notes: notes || null,
          paymentMethod,
          paymentReference: paymentReference || null,
          status: 'PENDING'
        },
        include: { plan: true }
      })
    }

    // Registro de auditoría
    await recordAuditLog({
      userId: session.userId,
      businessId: business.id,
      action: 'PLAN_REQUEST_CREATED',
      entity: 'PlanRequest',
      entityId: planRequest.id,
      details: {
        planName: selectedPlan.name,
        planSlug: selectedPlan.slug,
        amount: totalAmount,
        billingCycle,
        currentTier: effectiveSub.tier
      }
    })

    // Notificación en tiempo real al Super Admin mediante BarberOS Sentinel en Telegram
    const formattedPrice = totalAmount.toLocaleString('es-CO')
    sendSentinelNotification({
      type: 'PLAN_REQUEST',
      priority: 'ALTA',
      title: '📋 Nueva Solicitud de Plan BarberOS',
      message:
        `<b>Barbería:</b> ${business.name}\n` +
        `<b>Slug:</b> <code>${business.slug}</code>\n` +
        `<b>Plan Solicitado:</b> ⭐️ <b>${selectedPlan.name}</b> (${billingCycle})\n` +
        `<b>Inversión:</b> $${formattedPrice} COP\n` +
        `<b>Contacto:</b> ${planRequest.contactName} | <code>${planRequest.contactPhone || 'Sin teléfono'}</code>\n` +
        `<b>Email:</b> ${planRequest.contactEmail}\n` +
        `<b>Estado actual:</b> ${effectiveSub.statusLabel}\n` +
        (paymentReference ? `<b>Ref. Pago:</b> <code>${paymentReference}</code> (${paymentMethod})\n` : '') +
        (notes ? `<b>Notas cliente:</b> <i>${notes}</i>\n` : ''),
      actionUrl: 'https://sas-barbery.vercel.app/superadmin/billing',
      buttons: [
        { text: '💳 Ver en Super Admin', url: 'https://sas-barbery.vercel.app/superadmin/billing' }
      ]
    }).catch(sentinelErr => {
      console.warn('[Sentinel Plan Request Alert Error]:', sentinelErr)
    })

    return NextResponse.json({
      success: true,
      message: `Solicitud para el ${selectedPlan.name} registrada con éxito. Nuestro equipo de soporte o Super Admin se comunicará contigo de inmediato para la confirmación de pago y activación.`,
      request: {
        id: planRequest.id,
        status: planRequest.status,
        planName: selectedPlan.name,
        amount: totalAmount,
        billingCycle,
        createdAt: planRequest.createdAt
      }
    })
  } catch (error) {
    console.error('Owner Plan Request POST Error:', error)
    return NextResponse.json({ error: 'Error al enviar la solicitud de plan' }, { status: 500 })
  }
}
