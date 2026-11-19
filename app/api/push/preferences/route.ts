import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const pref = await prisma.userNotificationPreference.findUnique({
      where: { userId: session.userId },
    })

    const preferences = pref || {
      pushEnabled: true,
      soundEnabled: true,
      notifyNewAppointment: true,
      notifyCancelled: true,
      notifyRescheduled: true,
      notifyStatusChange: true,
    }

    return NextResponse.json({ preferences })
  } catch (error: any) {
    console.error('[API /api/push/preferences GET] Error:', error)
    return NextResponse.json(
      { error: 'Error al consultar preferencias', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const {
      pushEnabled,
      soundEnabled,
      notifyNewAppointment,
      notifyCancelled,
      notifyRescheduled,
      notifyStatusChange,
    } = body

    const updated = await prisma.userNotificationPreference.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        pushEnabled: pushEnabled !== undefined ? Boolean(pushEnabled) : true,
        soundEnabled: soundEnabled !== undefined ? Boolean(soundEnabled) : true,
        notifyNewAppointment: notifyNewAppointment !== undefined ? Boolean(notifyNewAppointment) : true,
        notifyCancelled: notifyCancelled !== undefined ? Boolean(notifyCancelled) : true,
        notifyRescheduled: notifyRescheduled !== undefined ? Boolean(notifyRescheduled) : true,
        notifyStatusChange: notifyStatusChange !== undefined ? Boolean(notifyStatusChange) : true,
      },
      update: {
        ...(pushEnabled !== undefined && { pushEnabled: Boolean(pushEnabled) }),
        ...(soundEnabled !== undefined && { soundEnabled: Boolean(soundEnabled) }),
        ...(notifyNewAppointment !== undefined && { notifyNewAppointment: Boolean(notifyNewAppointment) }),
        ...(notifyCancelled !== undefined && { notifyCancelled: Boolean(notifyCancelled) }),
        ...(notifyRescheduled !== undefined && { notifyRescheduled: Boolean(notifyRescheduled) }),
        ...(notifyStatusChange !== undefined && { notifyStatusChange: Boolean(notifyStatusChange) }),
      },
    })

    return NextResponse.json({
      success: true,
      preferences: updated,
      message: 'Preferencias de notificación actualizadas exitosamente',
    })
  } catch (error: any) {
    console.error('[API /api/push/preferences PUT] Error:', error)
    return NextResponse.json(
      { error: 'Error al guardar preferencias', details: error.message },
      { status: 500 }
    )
  }
}
