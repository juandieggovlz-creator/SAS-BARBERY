import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { ensurePaymentForAppointment } from '@/lib/payments'
import { WhatsAppService } from '@/lib/whatsapp/whatsapp-service'
import { sendAccountSecurityAlertEmail } from '@/lib/email'
import { getCanonicalAppUrl } from '@/lib/url'
import {
  BookingEngineError,
  rescheduleCentralizedBooking,
  resolveAppointmentCancellation,
  validateAppointmentStatusTransition,
  verifyAppointmentDeposit,
} from '@/lib/booking/booking-engine'
import {
  parseAppointmentNotesAndMeta,
  resolveAppointmentFinancials,
  serializeAppointmentNotesWithMeta,
} from '@/lib/booking/booking-metadata'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !session.businessId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const appt = await prisma.appointment.findFirst({
      where: { id, businessId: session.businessId as string },
      include: {
        service: true,
        barber: true,
        client: true,
        payment: true,
      },
    })

    if (!appt) {
      return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
    }

    if (session.role === 'BARBER' && session.barberId && appt.barberId !== session.barberId) {
      return NextResponse.json({ error: 'No tienes permiso para ver esta cita' }, { status: 403 })
    }

    const { cleanNotes } = parseAppointmentNotesAndMeta(appt.notes)
    const financials = resolveAppointmentFinancials(appt)

    const formatted = {
      id: appt.id,
      reservationCode: appt.reservationCode,
      date: appt.date.toISOString(),
      status: appt.status,
      notes: cleanNotes,
      client: {
        id: appt.client?.id,
        name: appt.client?.name || 'Cliente sin nombre',
        phone: appt.client?.phone || null,
        email: appt.client?.email || null,
        notes: appt.client?.internalNotes || null,
      },
      service: {
        id: appt.service?.id,
        name: appt.service?.name || 'Servicio',
        duration: appt.service?.duration || 30,
        price: Number(appt.service?.price || 0),
      },
      barber: {
        id: appt.barber?.id,
        name: appt.barber?.name || 'Barbero',
        avatar: appt.barber?.avatar || null,
        color: null,
      },
      financials,
      payment: appt.payment ? {
        id: appt.payment.id,
        amount: Number(appt.payment.amount),
        method: appt.payment.method,
        status: appt.payment.status,
        paidAt: appt.payment.paidAt ? appt.payment.paidAt.toISOString() : null,
      } : null,
    }

    return NextResponse.json({ appointment: formatted })
  } catch (error) {
    console.error('Error fetching appointment by ID:', error)
    return NextResponse.json({ error: 'Error al consultar cita' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !session.businessId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()

    // Multi-tenant Ownership Verification
    const currentAppt = await prisma.appointment.findUnique({
      where: { id },
      include: { service: true, barber: true, payment: true, client: true },
    })

    if (!currentAppt || currentAppt.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
    }

    if (session.role === 'BARBER' && currentAppt.barberId !== session.barberId) {
      return NextResponse.json(
        { error: 'No tienes permiso para editar esta cita' },
        { status: 403 }
      )
    }

    // ── 1. Flujo de Cancelación con Resolución Financiera de Anticipo ──
    if (body.action === 'CANCEL_WITH_RESOLUTION' || body.resolutionType) {
      if (
        !['OWNER', 'BRANCH_ADMIN', 'SUPER_ADMIN', 'ROOT_PLATFORM_OWNER'].includes(
          session.role
        )
      ) {
        return NextResponse.json(
          { error: 'No tienes permisos para resolver cancelaciones financieras.' },
          { status: 403 }
        )
      }

      const verifierUser = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { name: true, email: true },
      })

      const cancelResult = await resolveAppointmentCancellation({
        appointmentId: id,
        businessId: session.businessId,
        resolutionType: body.resolutionType,
        refundAmount: Number(body.refundAmount || 0),
        refundMethod: body.refundMethod || 'TRANSFER',
        reason: body.reason || null,
        verifiedByUserId: session.userId,
        verifiedByName: verifierUser?.name || verifierUser?.email || 'Propietario',
      })

      return NextResponse.json({
        ...cancelResult.appointment,
        financials: cancelResult.financials,
        compensatoryPayment: cancelResult.compensatoryPayment,
      })
    }

    // ── 2. Flujo de Verificación de Anticipo (Aprobar / Rechazar Comprobante) ──
    if (body.depositAction === 'APPROVE' || body.depositAction === 'REJECT') {
      if (
        !['OWNER', 'BRANCH_ADMIN', 'SUPER_ADMIN', 'ROOT_PLATFORM_OWNER'].includes(
          session.role
        )
      ) {
        return NextResponse.json(
          { error: 'No tienes permisos para aprobar o rechazar pagos de anticipos.' },
          { status: 403 }
        )
      }

      const verifierUser = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { name: true, email: true },
      })

      const verifiedResult = await verifyAppointmentDeposit({
        appointmentId: id,
        businessId: session.businessId,
        action: body.depositAction,
        verifiedByUserId: session.userId,
        verifiedByName:
          verifierUser?.name || verifierUser?.email || 'Propietario',
        paymentMethod: body.paymentMethod || 'TRANSFER',
        rejectionReason: body.rejectionReason || null,
        cancelAppointmentOnReject: Boolean(body.cancelAppointmentOnReject),
      })

      return NextResponse.json({
        ...verifiedResult.appointment,
        notes: verifiedResult.financials.cleanNotes || null,
        financials: verifiedResult.financials,
      })
    }

    // ── 2. Si cambia fecha o barbero, usar motor centralizado de reprogramación ──
    const requestedDate =
      body.date !== undefined ? new Date(body.date) : null
    const isDateChanging =
      requestedDate &&
      !isNaN(requestedDate.getTime()) &&
      requestedDate.getTime() !== currentAppt.date.getTime()
    const isBarberChanging =
      body.barberId !== undefined && body.barberId !== currentAppt.barberId

    if (isDateChanging || isBarberChanging) {
      await rescheduleCentralizedBooking({
        appointmentId: id,
        businessId: session.businessId,
        newDate: requestedDate || currentAppt.date,
        newBarberId: body.barberId || currentAppt.barberId,
        newServiceId: body.serviceId || currentAppt.serviceId,
      })
    }

    // ── 4. Actualizar estado, notas u otros campos permitidos con validación de ciclo de vida ──
    const targetStatus = body.status as string | undefined
    if (targetStatus !== undefined && targetStatus !== currentAppt.status) {
      const transitionCheck = validateAppointmentStatusTransition(currentAppt.status, targetStatus)
      if (!transitionCheck.valid) {
        return NextResponse.json({ error: transitionCheck.error }, { status: 400 })
      }
    }

    const data: Record<string, unknown> = {}
    if (body.status !== undefined) data.status = body.status
    if (body.clientId !== undefined) data.clientId = body.clientId
    if (body.serviceId !== undefined) data.serviceId = body.serviceId

    if (body.notes !== undefined) {
      const { meta } = parseAppointmentNotesAndMeta(currentAppt.notes)
      data.notes = serializeAppointmentNotesWithMeta(body.notes, meta)
    }

    const finalStatus = (body.status as string) ?? currentAppt.status

    const appointment = await prisma.appointment.update({
      where: { id },
      data,
      include: {
        client: true,
        barber: true,
        service: true,
        payment: true,
        business: { select: { name: true, slug: true } },
      },
    })

    if (finalStatus === 'COMPLETED') {
      await ensurePaymentForAppointment(id, { status: 'PENDING' })
      if (currentAppt.status !== 'COMPLETED') {
        WhatsAppService.sendPostServiceThankYou(id).catch((err) => {
          console.error(
            '[WhatsApp] Error enviando agradecimiento post-servicio:',
            err
          )
        })
      }
    } else if (
      finalStatus === 'CANCELLED' &&
      currentAppt.status !== 'CANCELLED'
    ) {
      WhatsAppService.sendAppointmentCancellation(id).catch((err) => {
        console.error('[WhatsApp] Error enviando cancelación:', err)
      })
      if (appointment.client.email) {
        sendAccountSecurityAlertEmail({
          to: appointment.client.email,
          userName: appointment.client.name,
          title: 'Tu cita ha sido cancelada',
          description: `Tu cita en ${
            appointment.business.name
          } programada para el ${appointment.date.toLocaleDateString('es-CO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })} a las ${appointment.date.toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
          })} ha sido cancelada.`,
          details: {
            Barbería: appointment.business.name,
            Servicio: appointment.service.name,
            Barbero: appointment.barber.name,
          },
          actionLink: `${getCanonicalAppUrl()}/b/${
            appointment.business.slug || 'reserva'
          }`,
          actionLabel: 'Reagendar una nueva cita',
        }).catch(() => {})
      }
    } else if (
      isDateChanging &&
      requestedDate &&
      ['PENDING', 'CONFIRMED'].includes(finalStatus)
    ) {
      WhatsAppService.sendAppointmentRescheduled(id, requestedDate).catch(
        (err) => {
          console.error('[WhatsApp] Error enviando reprogramación:', err)
        }
      )
      if (appointment.client.email) {
        sendAccountSecurityAlertEmail({
          to: appointment.client.email,
          userName: appointment.client.name,
          title: 'Tu cita ha sido reprogramada',
          description: `Tu cita en ${appointment.business.name} ha sido reprogramada a una nueva fecha.`,
          details: {
            Barbería: appointment.business.name,
            'Nueva fecha': requestedDate.toLocaleDateString('es-CO', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            'Nueva hora': requestedDate.toLocaleTimeString('es-CO', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            Servicio: appointment.service.name,
            Barbero: appointment.barber.name,
          },
          actionLink: `${getCanonicalAppUrl()}/b/${
            appointment.business.slug || 'reserva'
          }`,
          actionLabel: 'Ver detalles de tu reserva',
        }).catch(() => {})
      }
    }

    // Disparo no-bloqueante de Notificaciones Push & Notificación Interna
    try {
      const { dispatchAppointmentNotification } = await import('@/lib/push-dispatcher')
      if (finalStatus === 'CANCELLED' && currentAppt.status !== 'CANCELLED') {
        dispatchAppointmentNotification({
          eventType: 'APPOINTMENT_CANCELLED',
          appointmentId: id,
          businessId: appointment.businessId,
          barberId: appointment.barberId,
          clientName: appointment.client?.name,
          serviceName: appointment.service?.name,
        }).catch(() => {})
      } else if (isDateChanging && requestedDate) {
        dispatchAppointmentNotification({
          eventType: 'APPOINTMENT_RESCHEDULED',
          appointmentId: id,
          businessId: appointment.businessId,
          barberId: appointment.barberId,
          clientName: appointment.client?.name,
          serviceName: appointment.service?.name,
          rescheduledTo: requestedDate,
        }).catch(() => {})
      } else if (finalStatus !== currentAppt.status) {
        dispatchAppointmentNotification({
          eventType: 'APPOINTMENT_STATUS_CHANGED',
          appointmentId: id,
          businessId: appointment.businessId,
          barberId: appointment.barberId,
          clientName: appointment.client?.name,
          serviceName: appointment.service?.name,
        }).catch(() => {})
      }
    } catch {
      // Ignorar fallos de notificación sin romper respuesta HTTP
    }

    const refreshed = await prisma.appointment.findUnique({
      where: { id },
      include: {
        client: true,
        barber: true,
        service: true,
        payment: true,
      },
    })

    const financials = resolveAppointmentFinancials(refreshed || appointment)

    return NextResponse.json({
      ...(refreshed || appointment),
      notes: financials.cleanNotes || null,
      financials: {
        ...financials,
        proofUrl:
          session.role === 'BARBER' ? null : financials.proofUrl,
      },
    })
  } catch (error: unknown) {
    if (error instanceof BookingEngineError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      )
    }
    return NextResponse.json(
      { error: 'Error al actualizar cita' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session || !session.businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const apptToDelete = await prisma.appointment.findUnique({
      where: { id },
      include: { barber: true },
    })
    if (!apptToDelete || apptToDelete.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
    }

    if (
      session.role === 'BARBER' &&
      apptToDelete.barberId !== session.barberId
    ) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    await prisma.appointment.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE ERROR:', error)
    return NextResponse.json(
      { error: 'Error al eliminar la cita' },
      { status: 500 }
    )
  }
}
