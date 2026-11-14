import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/owner/settings/deposits
 * Obtiene la configuración de anticipos y señas del negocio del propietario autenticado.
 */
export async function GET() {
  try {
    const session = await getSession('OWNER')
    if (!session || !['OWNER', 'SUPER_ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!session.businessId) {
      return NextResponse.json({ error: 'No se encontró el negocio asignado a tu sesión' }, { status: 400 })
    }

    const business = await prisma.business.findUnique({
      where: { id: session.businessId },
      select: {
        id: true,
        name: true,
        slug: true,
        depositEnabled: true,
        depositType: true,
        depositPercentage: true,
        depositFixedAmount: true,
        depositInstructions: true
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      depositEnabled: business.depositEnabled,
      depositType: business.depositType || 'PERCENTAGE',
      depositPercentage: business.depositPercentage ?? 30,
      depositFixedAmount: business.depositFixedAmount ? Number(business.depositFixedAmount) : 0,
      depositInstructions: business.depositInstructions || ''
    })
  } catch (error) {
    console.error('Error fetching deposit settings:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

/**
 * PATCH /api/owner/settings/deposits
 * Actualiza la configuración de anticipos y señas del negocio.
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession('OWNER')
    if (!session || !['OWNER', 'SUPER_ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!session.businessId) {
      return NextResponse.json({ error: 'No se encontró el negocio asignado a tu sesión' }, { status: 400 })
    }

    const body = await request.json()
    const { depositEnabled, depositType, depositPercentage, depositFixedAmount, depositInstructions } = body

    // Validaciones
    if (depositType && !['PERCENTAGE', 'FIXED'].includes(depositType)) {
      return NextResponse.json({ error: 'Tipo de anticipo no válido. Debe ser PERCENTAGE o FIXED' }, { status: 400 })
    }

    const percentageVal = Number(depositPercentage)
    if (depositType === 'PERCENTAGE' && (isNaN(percentageVal) || percentageVal < 5 || percentageVal > 90)) {
      return NextResponse.json({ error: 'El porcentaje de anticipo debe estar entre 5% y 90%' }, { status: 400 })
    }

    const fixedVal = Number(depositFixedAmount)
    if (depositType === 'FIXED' && (isNaN(fixedVal) || fixedVal < 0)) {
      return NextResponse.json({ error: 'El monto fijo debe ser un valor positivo' }, { status: 400 })
    }

    const updated = await prisma.business.update({
      where: { id: session.businessId },
      data: {
        depositEnabled: Boolean(depositEnabled),
        depositType: depositType || 'PERCENTAGE',
        depositPercentage: !isNaN(percentageVal) ? Math.round(percentageVal) : 30,
        depositFixedAmount: !isNaN(fixedVal) ? fixedVal : 0,
        depositInstructions: typeof depositInstructions === 'string' ? depositInstructions.trim() : null
      },
      select: {
        id: true,
        depositEnabled: true,
        depositType: true,
        depositPercentage: true,
        depositFixedAmount: true,
        depositInstructions: true
      }
    })

    // Registro de Auditoría
    await recordAuditLog({
      action: 'UPDATE_DEPOSIT_SETTINGS',
      entity: 'Business',
      entityId: session.businessId,
      businessId: session.businessId,
      userId: session.userId,
      details: {
        depositEnabled: updated.depositEnabled,
        depositType: updated.depositType,
        depositPercentage: updated.depositPercentage,
        depositFixedAmount: updated.depositFixedAmount
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Configuración de anticipos actualizada exitosamente',
      settings: {
        depositEnabled: updated.depositEnabled,
        depositType: updated.depositType,
        depositPercentage: updated.depositPercentage,
        depositFixedAmount: updated.depositFixedAmount ? Number(updated.depositFixedAmount) : 0,
        depositInstructions: updated.depositInstructions || ''
      }
    })
  } catch (error) {
    console.error('Error updating deposit settings:', error)
    return NextResponse.json({ error: 'Error al actualizar configuración de anticipos' }, { status: 500 })
  }
}

