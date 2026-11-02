import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !session.businessId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params

    const block = await prisma.barberBlock.findUnique({
      where: { id },
      include: { barber: true }
    })

    if (!block || block.barber.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Bloqueo no encontrado' }, { status: 404 })
    }

    if (session.role === 'BARBER' && block.barberId !== session.barberId) {
      return NextResponse.json({ error: 'No tienes permiso para eliminar este bloqueo' }, { status: 403 })
    }

    await prisma.barberBlock.delete({
      where: { id }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete Block Error:', error)
    return NextResponse.json({ error: 'Error al eliminar el bloqueo' }, { status: 500 })
  }
}
