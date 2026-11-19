import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint requerido' }, { status: 400 })
    }

    await prisma.pushSubscription.deleteMany({
      where: {
        endpoint,
        userId: session.userId,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Suscripción desactivada para este dispositivo',
    })
  } catch (error: any) {
    console.error('[API /api/push/unsubscribe] Error:', error)
    return NextResponse.json(
      { error: 'Error al desactivar suscripción push', details: error.message },
      { status: 500 }
    )
  }
}
