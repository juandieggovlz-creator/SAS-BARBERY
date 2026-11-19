import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const devices = await prisma.pushSubscription.findMany({
      where: { userId: session.userId },
      select: {
        id: true,
        deviceName: true,
        userAgent: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ devices })
  } catch (error: any) {
    console.error('[API /api/push/devices GET] Error:', error)
    return NextResponse.json(
      { error: 'Error al consultar dispositivos', details: error.message },
      { status: 500 }
    )
  }
}
