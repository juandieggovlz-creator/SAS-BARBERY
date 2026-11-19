import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await context.params

    const sub = await prisma.pushSubscription.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!sub) {
      return NextResponse.json({ error: 'Dispositivo no encontrado' }, { status: 404 })
    }

    if (sub.userId !== session.userId) {
      return NextResponse.json({ error: 'No tienes permiso para eliminar este dispositivo' }, { status: 403 })
    }

    await prisma.pushSubscription.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Dispositivo eliminado correctamente',
    })
  } catch (error: any) {
    console.error('[API /api/push/devices/[id] DELETE] Error:', error)
    return NextResponse.json(
      { error: 'Error al eliminar dispositivo', details: error.message },
      { status: 500 }
    )
  }
}
