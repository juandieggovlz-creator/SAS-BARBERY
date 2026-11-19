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
    const body = await request.json()

    // Multi-tenant Ownership Verification
    const barberToUpdate = await prisma.barber.findUnique({ where: { id } })
    if (!barberToUpdate || barberToUpdate.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Barbero no encontrado' }, { status: 404 })
    }

    const updateData: { name?: string; commission?: number; phone?: string; specialty?: string; avatar?: string | null; status?: 'PENDING' | 'ACTIVE' | 'INACTIVE' } = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.commission !== undefined) updateData.commission = Number(body.commission)
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.specialty !== undefined) updateData.specialty = body.specialty
    if (body.avatar !== undefined) updateData.avatar = body.avatar ? String(body.avatar).trim() : null
    if (body.status !== undefined) updateData.status = body.status

    const barber = await prisma.barber.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json(barber)
  } catch {
    return NextResponse.json({ error: 'Error al actualizar barbero' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params

    // Multi-tenant Ownership Verification
    const barberToDelete = await prisma.barber.findUnique({ where: { id } })
    if (!barberToDelete || barberToDelete.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Barbero no encontrado' }, { status: 404 })
    }

    // FASE 9: Comprobar citas históricas
    const appointmentCount = await prisma.appointment.count({
      where: { barberId: id }
    })

    if (appointmentCount > 0) {
      // PROTEGER HISTORIAL: Desactivar en lugar de borrar físicamente
      await prisma.$transaction([
        prisma.barber.update({
          where: { id },
          data: { status: 'INACTIVE' }
        }),
        prisma.user.updateMany({
          where: { barberId: id },
          data: {
            isActive: false,
            inviteToken: null,
            inviteExpires: null
          }
        })
      ])

      return NextResponse.json({ 
        ok: true, 
        deactivated: true,
        message: 'El barbero tiene historial de citas. Su cuenta ha sido desactivada para salvaguardar la contabilidad del negocio.' 
      })
    }

    // Si no tiene historial, eliminar relaciones y registro limpiamente
    await prisma.$transaction([
      prisma.barberSchedule.deleteMany({ where: { barberId: id } }),
      prisma.barberBlock.deleteMany({ where: { barberId: id } }),
      prisma.user.deleteMany({ where: { barberId: id } }),
      prisma.barber.delete({ where: { id } })
    ])

    return NextResponse.json({ ok: true, message: 'Barbero eliminado exitosamente' })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar barbero' }, { status: 500 })
  }
}
