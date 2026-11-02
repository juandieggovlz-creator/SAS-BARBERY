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
    const serviceToUpdate = await prisma.service.findUnique({ where: { id } })
    if (!serviceToUpdate || serviceToUpdate.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
    }

    const data: { name?: string; price?: number; duration?: number; isActive?: boolean } = {}
    if (body.name !== undefined) data.name = body.name.trim()
    if (body.price !== undefined) {
      const p = parseFloat(body.price)
      if (isNaN(p) || p <= 0) return NextResponse.json({ error: 'Precio debe ser mayor a 0' }, { status: 400 })
      data.price = p
    }
    if (body.duration !== undefined) {
      const d = parseInt(body.duration)
      if (isNaN(d) || d <= 0) return NextResponse.json({ error: 'Duración debe ser mayor a 0' }, { status: 400 })
      data.duration = d
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
    if (!session || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Multi-tenant Ownership Verification
    const serviceToDelete = await prisma.service.findUnique({ where: { id } })
    if (!serviceToDelete || serviceToDelete.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
    }

    // Soft delete to preserve historical appointments integrity
    await prisma.service.update({
      where: { id },
      data: { isActive: false }
    })
    
    return NextResponse.json({ ok: true, message: 'Servicio desactivado con éxito' })
  } catch {
    return NextResponse.json({ error: 'Error al desactivar servicio' }, { status: 500 })
  }
}
