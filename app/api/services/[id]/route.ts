import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()

    // Multi-tenant Ownership Verification
    const serviceToUpdate = await prisma.service.findUnique({ where: { id } })
    if (!serviceToUpdate || serviceToUpdate.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
    }

    const data: {
      name?: string
      price?: number
      duration?: number
      category?: string | null
      description?: string | null
      isActive?: boolean
    } = {}

    if (body.name !== undefined) {
      const trimmed = String(body.name).trim()
      if (!trimmed) {
        return NextResponse.json({ error: 'El nombre del servicio no puede estar vacío' }, { status: 400 })
      }
      if (trimmed.length > 100) {
        return NextResponse.json({ error: 'El nombre no puede exceder 100 caracteres' }, { status: 400 })
      }
      // Verificar si hay otro servicio activo con el mismo nombre
      const duplicate = await prisma.service.findFirst({
        where: {
          businessId: session.businessId,
          name: { equals: trimmed, mode: 'insensitive' },
          isActive: true,
          id: { not: id }
        }
      })
      if (duplicate && body.isActive !== false) {
        return NextResponse.json({ error: `Ya existe otro servicio activo con el nombre "${trimmed}".` }, { status: 409 })
      }
      data.name = trimmed
    }

    if (body.price !== undefined) {
      const p = parseFloat(body.price)
      if (isNaN(p) || p < 0) {
        return NextResponse.json({ error: 'El precio no puede ser negativo' }, { status: 400 })
      }
      data.price = p
    }

    if (body.duration !== undefined) {
      const d = parseInt(body.duration)
      if (isNaN(d) || d <= 0 || d > 720) {
        return NextResponse.json({ error: 'La duración debe ser entre 1 y 720 minutos' }, { status: 400 })
      }
      data.duration = d
    }

    if (body.category !== undefined) {
      data.category = typeof body.category === 'string' && body.category.trim()
        ? body.category.trim().slice(0, 50)
        : null
    }

    if (body.description !== undefined) {
      data.description = typeof body.description === 'string' && body.description.trim()
        ? body.description.trim().slice(0, 500)
        : null
    }

    if (body.isActive !== undefined) {
      data.isActive = Boolean(body.isActive)
    }

    const service = await prisma.service.update({
      where: { id },
      data,
    })

    return NextResponse.json(service)
  } catch {
    return NextResponse.json({ error: 'Error al actualizar servicio' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Multi-tenant Ownership Verification
    const serviceToDelete = await prisma.service.findUnique({
      where: { id },
      include: {
        _count: {
          select: { appointments: true }
        }
      }
    })

    if (!serviceToDelete || serviceToDelete.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
    }

    const appointmentCount = serviceToDelete._count?.appointments ?? 0

    // Si tiene citas históricas, archivamos/desactivamos lógicamente para preservar la integridad
    // Si no tiene citas dependientes, realizamos eliminación física segura
    if (appointmentCount > 0) {
      await prisma.service.update({
        where: { id },
        data: { isActive: false }
      })
      return NextResponse.json({
        ok: true,
        action: 'ARCHIVED',
        appointmentCount,
        message: `El servicio tiene ${appointmentCount} cita(s) en su historial. Se ha desactivado del catálogo para proteger la integridad de tus registros.`
      })
    } else {
      await prisma.service.delete({
        where: { id }
      })
      return NextResponse.json({
        ok: true,
        action: 'DELETED',
        appointmentCount: 0,
        message: 'Servicio eliminado permanentemente del catálogo.'
      })
    }
  } catch {
    return NextResponse.json({ error: 'Error al procesar la eliminación del servicio' }, { status: 500 })
  }
}
