import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canAddBarber } from '@/lib/commercial-permissions'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || (session.role !== 'OWNER' && session.role !== 'BRANCH_ADMIN' && session.role !== 'SUPER_ADMIN' && session.role !== 'ROOT_PLATFORM_OWNER')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const { status } = await request.json()

    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }

    // Multi-tenant Ownership Verification
    const barberToUpdate = await prisma.barber.findUnique({ where: { id } })
    if (!barberToUpdate || barberToUpdate.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Barbero no encontrado' }, { status: 404 })
    }

    const isActive = status === 'ACTIVE'

    // Si se está reactivando un barbero inactivo, validar que no exceda el límite de barberos activos del plan
    if (isActive && barberToUpdate.status === 'INACTIVE') {
      const barberCheck = await canAddBarber(barberToUpdate.businessId)
      if (!barberCheck.allowed) {
        return NextResponse.json(
          {
            error: barberCheck.reason || 'Has alcanzado el límite de barberos activos de tu plan actual.',
            code: 'PLAN_LIMIT_REACHED',
            currentCount: barberCheck.currentCount,
            maxAllowed: barberCheck.maxAllowed
          },
          { status: 403 }
        )
      }
    }

    const [updatedBarber] = await prisma.$transaction([
      prisma.barber.update({
        where: { id },
        data: { status }
      }),
      prisma.user.updateMany({
        where: { barberId: id },
        data: { isActive }
      })
    ])

    return NextResponse.json(updatedBarber)
  } catch (error) {
    console.error("Update Status Error:", error)
    return NextResponse.json({ error: 'Error al actualizar el estado' }, { status: 500 })
  }
}
