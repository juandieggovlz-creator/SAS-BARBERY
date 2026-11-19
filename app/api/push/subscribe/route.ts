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
    const { endpoint, keys, deviceName } = body

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return NextResponse.json(
        { error: 'Datos de suscripción incompletos (endpoint, p256dh y auth requeridos)' },
        { status: 400 }
      )
    }

    const userAgent = req.headers.get('user-agent') || 'Navegador Web'
    const name = deviceName || (userAgent.includes('Mobile') ? 'Dispositivo Móvil' : 'Computadora / Escritorio')

    // Upsert subscription tied to this user and business
    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId: session.userId,
        businessId: session.businessId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent,
        deviceName: name,
      },
      update: {
        userId: session.userId,
        businessId: session.businessId,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent,
        deviceName: name,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      deviceName: subscription.deviceName,
      message: 'Dispositivo registrado exitosamente para notificaciones Web Push',
    })
  } catch (error: any) {
    console.error('[API /api/push/subscribe] Error:', error)
    return NextResponse.json(
      { error: 'Error al registrar suscripción push', details: error.message },
      { status: 500 }
    )
  }
}
