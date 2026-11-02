import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
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

    const updatedBarber = await prisma.barber.update({
      where: { id },
      data: { status }
    })

    return NextResponse.json(updatedBarber)
  } catch (error) {
    console.error("Update Status Error:", error)
    return NextResponse.json({ error: 'Error al actualizar el estado' }, { status: 500 })
  }
}
