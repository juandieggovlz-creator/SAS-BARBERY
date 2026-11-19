import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const session = await getSession()
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await prisma.appNotification.updateMany({
      where: {
        userId: session.userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas',
    })
  } catch (error: any) {
    console.error('[API /api/notifications/mark-all-read] Error:', error)
    return NextResponse.json(
      { error: 'Error al marcar todas como leídas', details: error.message },
      { status: 500 }
    )
  }
}
