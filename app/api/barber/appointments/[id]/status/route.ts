import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { ensurePaymentForAppointment } from '@/lib/payments'
import { WhatsAppService } from '@/lib/whatsapp/whatsapp-service'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession('BARBER') || await getSession('OWNER')
  if (!session || (!session.barberId && !session.businessId)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const { status } = await request.json()

    // Validate status
    const validStatuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }

    // Ensure appointment belongs to this barber or business
    const appointment = await prisma.appointment.findUnique({
      where: { id }
    })

    if (!appointment) {
      return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
    }

    if (session.role === 'BARBER' && appointment.barberId !== session.barberId) {
      return NextResponse.json({ error: 'No tienes permiso para editar esta cita' }, { status: 403 })
    }

    if ((session.role === 'OWNER' || session.role === 'SUPER_ADMIN') && appointment.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Cita no autorizada para tu negocio' }, { status: 403 })
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status }
    })

    if (status === 'COMPLETED') {
      await ensurePaymentForAppointment(id, { status: 'PENDING' })
      if (appointment.status !== 'COMPLETED') {
        WhatsAppService.sendPostServiceThankYou(id).catch(err => {
          console.error('[WhatsApp] Error enviando agradecimiento post-servicio:', err)
        })
      }
    } else if (status === 'CANCELLED' && appointment.status !== 'CANCELLED') {
      WhatsAppService.sendAppointmentCancellation(id).catch(err => {
        console.error('[WhatsApp] Error enviando cancelación:', err)
      })
    }

    // Disparo no-bloqueante de Notificaciones Push & Notificación Interna
    try {
      const { dispatchAppointmentNotification } = await import('@/lib/push-dispatcher')
      const eventType = status === 'CANCELLED' ? 'APPOINTMENT_CANCELLED' : 'APPOINTMENT_STATUS_CHANGED'
      dispatchAppointmentNotification({
        eventType,
        appointmentId: id,
        businessId: appointment.businessId,
        barberId: appointment.barberId,
      }).catch(() => {})
    } catch {
      // Ignorar fallos de notificación
    }

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Error al actualizar cita' }, { status: 500 })
  }
}
