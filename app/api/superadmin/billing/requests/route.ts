import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'
import { sendSentinelNotification } from '@/lib/telegram-sentinel'

export const dynamic = 'force-dynamic'

/**
 * GET /api/superadmin/billing/requests
 * Consulta y filtra todas las solicitudes de planes comerciales
 */
export async function GET(request: Request) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ROOT_PLATFORM_OWNER')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'ALL'
    const search = searchParams.get('search')?.trim() || ''

    const whereClause: Record<string, unknown> = {}
    if (status !== 'ALL') {
      whereClause.status = status
    }
    if (search) {
      whereClause.OR = [
        { business: { name: { contains: search, mode: 'insensitive' } } },
        { business: { slug: { contains: search, mode: 'insensitive' } } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
        { contactPhone: { contains: search, mode: 'insensitive' } },
        { paymentReference: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [requests, counts] = await Promise.all([
      prisma.planRequest.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
              phone: true,
              email: true,
              status: true,
              trialEndsAt: true,
              subscriptionEndsAt: true,
              plan: { select: { name: true, slug: true } }
            }
          },
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
      }),
      prisma.planRequest.groupBy({
        by: ['status'],
        _count: { _all: true }
      })
    ])

    const statusCounts: Record<string, number> = {
      ALL: 0,
      PENDING: 0,
      CONTACTED: 0,
      WAITING_PAYMENT: 0,
      PAYMENT_UNDER_REVIEW: 0,
      APPROVED: 0,
      REJECTED: 0,
      CANCELLED: 0
    }

    counts.forEach(c => {
      statusCounts[c.status] = c._count._all
      statusCounts.ALL += c._count._all
    })

    return NextResponse.json({
      success: true,
      counts: statusCounts,
      requests: requests.map(r => ({
        id: r.id,
        businessId: r.businessId,
        businessName: r.business.name,
        businessSlug: r.business.slug,
        businessStatus: r.business.status,
        currentPlanName: r.business.plan?.name || 'Sin plan / Sandbox',
        planId: r.planId,
        planName: r.plan.name,
        planSlug: r.plan.slug,
        billingCycle: r.billingCycle,
        amount: Number(r.amount || r.plan.price),
        status: r.status,
        contactName: r.contactName,
        contactEmail: r.contactEmail,
        contactPhone: r.contactPhone,
        paymentMethod: r.paymentMethod,
        paymentReference: r.paymentReference,
        paymentProofUrl: r.paymentProofUrl,
        notes: r.notes,
        adminNotes: r.adminNotes,
        reviewedBy: r.reviewedBy,
        reviewedAt: r.reviewedAt,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      }))
    })
  } catch (error) {
    console.error('Super Admin Plan Requests GET Error:', error)
    return NextResponse.json({ error: 'Error al consultar solicitudes de planes' }, { status: 500 })
  }
}

/**
 * PATCH /api/superadmin/billing/requests
 * Actualiza el estado o notas de una solicitud de plan
 */
export async function PATCH(request: Request) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ROOT_PLATFORM_OWNER')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { requestId, status, adminNotes, paymentMethod, paymentReference } = body

    if (!requestId) {
      return NextResponse.json({ error: 'requestId es requerido' }, { status: 400 })
    }

    const currentReq = await prisma.planRequest.findUnique({
      where: { id: requestId },
      include: { business: true, plan: true }
    })

    if (!currentReq) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date()
    }

    if (status) {
      updateData.status = status
      updateData.reviewedBy = session.userId
      updateData.reviewedAt = new Date()
    }
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod
    if (paymentReference !== undefined) updateData.paymentReference = paymentReference

    const updated = await prisma.planRequest.update({
      where: { id: requestId },
      data: updateData,
      include: { business: true, plan: true }
    })

    await recordAuditLog({
      userId: session.userId,
      userRole: 'SUPER_ADMIN',
      businessId: currentReq.businessId,
      action: 'PLAN_REQUEST_UPDATED',
      entity: 'PlanRequest',
      entityId: requestId,
      details: {
        previousStatus: currentReq.status,
        newStatus: status || currentReq.status,
        adminNotes
      }
    })

    // Notificar en Telegram Sentinel si el estado cambió
    if (status && status !== currentReq.status) {
      sendSentinelNotification({
        type: 'PLAN_REQUEST_STATUS_UPDATE',
        priority: 'MEDIA',
        title: '🔄 Solicitud de Plan Actualizada',
        message:
          `<b>Barbería:</b> ${currentReq.business.name}\n` +
          `<b>Plan:</b> ${currentReq.plan.name}\n` +
          `<b>Nuevo Estado:</b> <code>${status}</code>\n` +
          (adminNotes ? `<b>Nota Admin:</b> ${adminNotes}\n` : ''),
        actionUrl: 'https://sas-barbery.vercel.app/superadmin/billing'
      }).catch(err => console.error('[Sentinel Request Update Error]:', err))
    }

    return NextResponse.json({
      success: true,
      message: 'Solicitud actualizada correctamente',
      request: updated
    })
  } catch (error) {
    console.error('Super Admin Plan Request PATCH Error:', error)
    return NextResponse.json({ error: 'Error al actualizar solicitud' }, { status: 500 })
  }
}
