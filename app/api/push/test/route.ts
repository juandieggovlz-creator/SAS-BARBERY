import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import webpush from '@/lib/web-push'

export async function POST() {
  try {
    const session = await getSession()
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        pushSubscriptions: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const title = '💈 BarberOS — Notificación de Prueba'
    const body = '¡Tu dispositivo está correctamente vinculado y listo para recibir alertas en tiempo real!'

    // Create internal AppNotification
    const internalNotif = await prisma.appNotification.create({
      data: {
        userId: user.id,
        businessId: user.businessId,
        title,
        message: body,
        type: 'SYSTEM',
        metadata: {
          test: true,
          dateStr: new Date().toLocaleTimeString('es-CO'),
        },
      },
    })

    let pushSent = 0
    let pruned = 0

    const payload = JSON.stringify({
      title,
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `barberos-test-${Date.now()}`,
      data: {
        url: user.role === 'BARBER' ? '/barber/appointments' : '/appointments',
        test: true,
      },
      actions: [
        { action: 'open', title: 'Abrir BarberOS' }
      ]
    })

    for (const sub of user.pushSubscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        )
        pushSent++
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
          pruned++
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Notificación de prueba enviada',
      registeredDevices: user.pushSubscriptions.length,
      pushSent,
      pruned,
      internalNotificationId: internalNotif.id,
    })
  } catch (error: any) {
    console.error('[API /api/push/test] Error:', error)
    return NextResponse.json(
      { error: 'Error al enviar notificación de prueba', details: error.message },
      { status: 500 }
    )
  }
}
