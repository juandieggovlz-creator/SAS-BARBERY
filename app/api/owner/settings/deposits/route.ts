import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'
import {
  parseBusinessDepositConfig,
  serializeDepositInstructionsWithConfig,
} from '@/lib/booking/deposit-config'
import { resolveAppointmentFinancials } from '@/lib/booking/booking-metadata'
import { expireStaleHoldsForBusiness } from '@/lib/sync/availability-engine'
import { canUseDeposits } from '@/lib/commercial-permissions'

export const dynamic = 'force-dynamic'

const ALLOWED_ROLES = ['OWNER', 'BRANCH_ADMIN', 'SUPER_ADMIN', 'ROOT_PLATFORM_OWNER']

/**
 * GET /api/owner/settings/deposits
 * Obtiene la configuración de anticipos, medios de pago manuales, plazos de reserva
 * temporal y el listado en vivo de anticipos pendientes / en verificación / con saldo pendiente.
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session || !ALLOWED_ROLES.includes(session.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!session.businessId) {
      return NextResponse.json(
        { error: 'No se encontró el negocio asignado a tu sesión' },
        { status: 400 }
      )
    }

    await expireStaleHoldsForBusiness(session.businessId)

    const [business, appointmentsWithDeposits] = await Promise.all([
      prisma.business.findUnique({
        where: { id: session.businessId },
        select: {
          id: true,
          name: true,
          slug: true,
          depositEnabled: true,
          depositType: true,
          depositPercentage: true,
          depositFixedAmount: true,
          depositInstructions: true,
        },
      }),
      prisma.appointment.findMany({
        where: {
          businessId: session.businessId,
          OR: [
            { depositRequired: { gt: 0 } },
            { notes: { contains: 'BARBEROS_META' } },
          ],
        },
        include: {
          client: true,
          barber: true,
          service: true,
          payment: true,
        },
        orderBy: { date: 'desc' },
        take: 60,
      }),
    ])

    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    const parsedConfig = parseBusinessDepositConfig(business)

    const depositAppointments = appointmentsWithDeposits
      .map((appt) => {
        const financials = resolveAppointmentFinancials(appt)
        return {
          id: appt.id,
          reservationCode: appt.reservationCode,
          date: appt.date,
          status: appt.status,
          depositPaid: appt.depositPaid,
          client: {
            id: appt.client.id,
            name: appt.client.name,
            phone: appt.client.phone,
            email: appt.client.email,
          },
          barber: {
            id: appt.barber.id,
            name: appt.barber.name,
          },
          service: {
            id: appt.service.id,
            name: financials.serviceNamesJoined || appt.service.name,
            price: financials.totalPrice,
            duration: financials.totalDuration,
          },
          financials,
        }
      })
      .filter(
        (item) =>
          item.financials.depositRequired > 0 ||
          Boolean(item.financials.proofUrl) ||
          item.financials.depositStatus !== 'NOT_REQUIRED'
      )

    return NextResponse.json({
      depositEnabled: parsedConfig.depositEnabled,
      depositType: parsedConfig.depositType,
      depositPercentage: parsedConfig.depositPercentage,
      depositFixedAmount: parsedConfig.depositFixedAmount,
      depositInstructions: parsedConfig.cleanInstructions,
      paymentMethods: parsedConfig.paymentMethods,
      depositAppointments,
    })
  } catch (error) {
    console.error('Error fetching deposit settings:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

/**
 * PATCH /api/owner/settings/deposits
 * Actualiza la configuración de anticipos, medios de pago aceptados y plazos.
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !ALLOWED_ROLES.includes(session.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!session.businessId) {
      return NextResponse.json(
        { error: 'No se encontró el negocio asignado a tu sesión' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      depositEnabled,
      depositType,
      depositPercentage,
      depositFixedAmount,
      depositInstructions,
      paymentMethods,
    } = body

    if (Boolean(depositEnabled)) {
      const allowedDeposits = await canUseDeposits(session.businessId)
      if (!allowedDeposits) {
        return NextResponse.json(
          {
            error: 'Tu plan actual no incluye el módulo de cobro de anticipos y señas. Actualiza al Plan Profesional o Premium VIP para habilitarlo.',
            code: 'PLAN_UPGRADE_REQUIRED'
          },
          { status: 403 }
        )
      }
    }

    if (depositType && !['PERCENTAGE', 'FIXED'].includes(depositType)) {
      return NextResponse.json(
        { error: 'Tipo de anticipo no válido. Debe ser PERCENTAGE o FIXED' },
        { status: 400 }
      )
    }

    const percentageVal = Number(depositPercentage)
    if (
      depositType === 'PERCENTAGE' &&
      (isNaN(percentageVal) || percentageVal < 5 || percentageVal > 90)
    ) {
      return NextResponse.json(
        { error: 'El porcentaje de anticipo debe estar entre 5% y 90%' },
        { status: 400 }
      )
    }

    const fixedVal = Number(depositFixedAmount)
    if (depositType === 'FIXED' && (isNaN(fixedVal) || fixedVal < 0)) {
      return NextResponse.json(
        { error: 'El monto fijo debe ser un valor positivo' },
        { status: 400 }
      )
    }

    // Preservar paymentMethods existentes si no fueron enviados en el body
    const currentBiz = await prisma.business.findUnique({
      where: { id: session.businessId },
      select: { depositInstructions: true },
    })
    const existingParsed = parseBusinessDepositConfig({
      depositInstructions: currentBiz?.depositInstructions,
    })

    const mergedPaymentMethods = {
      ...existingParsed.paymentMethods,
      ...(paymentMethods && typeof paymentMethods === 'object' ? paymentMethods : {}),
    }

    const serializedInstructions = serializeDepositInstructionsWithConfig(
      typeof depositInstructions === 'string'
        ? depositInstructions.trim()
        : existingParsed.cleanInstructions,
      mergedPaymentMethods
    )

    const updated = await prisma.business.update({
      where: { id: session.businessId },
      data: {
        depositEnabled: Boolean(depositEnabled),
        depositType: depositType || 'PERCENTAGE',
        depositPercentage: !isNaN(percentageVal) ? Math.round(percentageVal) : 30,
        depositFixedAmount: !isNaN(fixedVal) ? fixedVal : 0,
        depositInstructions: serializedInstructions,
      },
      select: {
        id: true,
        depositEnabled: true,
        depositType: true,
        depositPercentage: true,
        depositFixedAmount: true,
        depositInstructions: true,
      },
    })

    const finalParsed = parseBusinessDepositConfig(updated)

    await recordAuditLog({
      action: 'UPDATE_DEPOSIT_SETTINGS',
      entity: 'Business',
      entityId: session.businessId,
      businessId: session.businessId,
      userId: session.userId,
      details: {
        depositEnabled: finalParsed.depositEnabled,
        depositType: finalParsed.depositType,
        depositPercentage: finalParsed.depositPercentage,
        depositFixedAmount: finalParsed.depositFixedAmount,
        holdMinutes: finalParsed.paymentMethods.holdMinutes,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Configuración de anticipos actualizada exitosamente',
      settings: {
        depositEnabled: finalParsed.depositEnabled,
        depositType: finalParsed.depositType,
        depositPercentage: finalParsed.depositPercentage,
        depositFixedAmount: finalParsed.depositFixedAmount,
        depositInstructions: finalParsed.cleanInstructions,
        paymentMethods: finalParsed.paymentMethods,
      },
    })
  } catch (error) {
    console.error('Error updating deposit settings:', error)
    return NextResponse.json(
      { error: 'Error al actualizar configuración de anticipos' },
      { status: 500 }
    )
  }
}
