import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { id } = await params
    const { status, reason } = await request.json()

    const validStatuses = ['ACTIVE', 'TRIAL', 'SUSPENDED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Estado no válido' }, { status: 400 })
    }

    const business = await prisma.business.findUnique({ where: { id } })
    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    const updated = await prisma.business.update({
      where: { id },
      data: { status }
    })

    await recordAuditLog({
      userId: session.userId,
      userRole: 'SUPER_ADMIN',
      businessId: id,
      action: status === 'SUSPENDED' ? 'BUSINESS_SUSPENDED' : status === 'ACTIVE' ? 'BUSINESS_ACTIVATED' : 'BUSINESS_STATUS_CHANGED',
      entity: 'Business',
      entityId: id,
      details: {
        previousStatus: business.status,
        newStatus: status,
        reason: reason || 'Acción administrativa desde panel Super Admin'
      }
    })

    return NextResponse.json({
      success: true,
      message: `Estado actualizado a ${status}`,
      business: updated
    })
  } catch (error) {
    console.error('Super Admin Change Status Error:', error)
    return NextResponse.json({ error: 'Error al cambiar estado' }, { status: 500 })
  }
}
