import { NextResponse } from 'next/server'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { canUsePublicBooking } from '@/lib/commercial-permissions'
import {
  BookingEngineError,
  createCentralizedBooking,
  declareWhatsAppPayment,
  submitDepositProof,
} from '@/lib/booking/booking-engine'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const limitCheck = rateLimit(`public-appointment:${ip}`, {
      limit: 15,
      windowSeconds: 10 * 60,
    })
    if (!limitCheck.success) {
      return NextResponse.json(
        {
          error: `Has realizado demasiadas reservas en poco tiempo. Por favor espera ${Math.ceil(
            limitCheck.resetSeconds / 60
          )} minutos.`,
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const {
      businessId,
      serviceId,
      serviceIds,
      barberId,
      date,
      clientName,
      clientPhone,
      clientEmail,
      notes,
      proofUrl,
      depositChannelLabel,
      proofReference,
    } = body

    if (!businessId || (!serviceId && (!serviceIds || serviceIds.length === 0)) || !date || !clientName || !clientPhone) {
      return NextResponse.json(
        {
          error:
            'Todos los campos (barbería, servicio, fecha, nombre y teléfono) son requeridos',
        },
        { status: 400 }
      )
    }

    // Validación comercial del establecimiento (Prueba activa, Plan Básico/Pro/Premium vs Sandbox/Suspendido)
    const bookingCheck = await canUsePublicBooking(businessId)
    if (!bookingCheck.allowed) {
      return NextResponse.json(
        {
          error: bookingCheck.reason || 'Las reservas en línea no están habilitadas para este establecimiento en este momento.',
          code: 'PUBLIC_BOOKING_DISABLED'
        },
        { status: 403 }
      )
    }

    const { appointment, depositConfig, financials } = await createCentralizedBooking({
      businessId,
      serviceId,
      serviceIds: Array.isArray(serviceIds) ? serviceIds : undefined,
      barberId: barberId || null,
      date,
      clientName,
      clientPhone,
      clientEmail,
      notes,
      source: 'PUBLIC_WEB',
      proofUrl: proofUrl || null,
      depositChannelLabel: depositChannelLabel || null,
      proofReference: proofReference || null,
    })

    // Disparo asíncrono no bloqueante de confirmación de WhatsApp
    import('@/lib/whatsapp/whatsapp-service')
      .then(({ WhatsAppService }) => {
        WhatsAppService.sendAppointmentConfirmation(appointment.id).catch((err) => {
          console.error('Error enviando confirmación de WhatsApp:', err)
        })
      })
      .catch(() => {})

    // Disparo asíncrono no bloqueante de confirmación por correo si el cliente tiene email registrado
    const clientEmailToSend =
      (clientEmail ? String(clientEmail).trim() : null) || appointment.client.email
    if (clientEmailToSend) {
      import('@/lib/email')
        .then(({ sendAppointmentConfirmationEmail }) => {
          const formattedDate = appointment.date.toLocaleDateString('es-CO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
          const formattedTime = appointment.date.toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
          })
          const origin =
            process.env.NEXTAUTH_URL ||
            process.env.APP_URL ||
            new URL(request.url).origin
          const manageLink = `${origin}/b/${appointment.business.slug || 'reserva'}`

          sendAppointmentConfirmationEmail({
            to: clientEmailToSend,
            clientName: appointment.client.name,
            businessName: appointment.business.name,
            barberName: appointment.barber.name,
            serviceName: financials.serviceNamesJoined || appointment.service.name,
            price: `$${Number(financials.totalPrice).toLocaleString('es-CO')}`,
            date: formattedDate,
            time: formattedTime,
            reservationCode: appointment.reservationCode || '',
            manageLink,
          }).catch((err) => {
            console.warn(
              'Aviso: Envío de confirmación de cita por email diferido o simulado:',
              err
            )
          })
        })
        .catch(() => {})
    }

    return NextResponse.json(
      {
        success: true,
        message:
          financials.depositRequired > 0
            ? financials.depositStatus === 'PROOF_SUBMITTED'
              ? 'Reserva registrada. Tu comprobante de anticipo está en verificación por la barbería.'
              : 'Reserva temporal creada. Envía el comprobante del anticipo para confirmar tu cupo.'
            : 'Cita confirmada automáticamente con éxito. ¡Te esperamos!',
        appointment: {
          ...appointment,
          financials,
        },
        financials,
        depositConfig: {
          depositEnabled: depositConfig.depositEnabled,
          depositType: depositConfig.depositType,
          depositPercentage: depositConfig.depositPercentage,
          depositFixedAmount: depositConfig.depositFixedAmount,
          cleanInstructions: depositConfig.cleanInstructions,
          paymentMethods: depositConfig.paymentMethods,
        },
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    if (error instanceof BookingEngineError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      )
    }
    console.error('Public Appointment Creation Error:', error)
    const msg =
      error instanceof Error ? error.message : 'Error al procesar la reserva'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/**
 * PATCH /api/public/appointments
 * Permite al cliente adjuntar el comprobante de pago de su anticipo
 * usando su código de reserva (`reservationCode`) y `businessId`.
 */
export async function PATCH(request: Request) {
  try {
    const ip = getClientIp(request)
    const limitCheck = rateLimit(`public-deposit-proof:${ip}`, {
      limit: 15,
      windowSeconds: 10 * 60,
    })
    if (!limitCheck.success) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Intenta nuevamente en unos minutos.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const {
      action,
      appointmentId,
      reservationCode,
      businessId,
      slug,
      proofUrl,
      depositChannelLabel,
      proofReference,
    } = body

    // ── Declaración de pago vía WhatsApp (Opción B: sin adjunto directo en web) ──
    if (action === 'DECLARE_WHATSAPP_PAYMENT') {
      if ((!appointmentId && !reservationCode) || (!businessId && !slug)) {
        return NextResponse.json(
          { error: 'Se requiere el código de reserva y la barbería para registrar la notificación.' },
          { status: 400 }
        )
      }

      const result = await declareWhatsAppPayment({
        reservationCode: reservationCode || '',
        businessId,
        slug,
      })

      return NextResponse.json({
        success: true,
        message:
          'Notificación vía WhatsApp registrada con éxito. Tu horario permanece protegido mientras el establecimiento verifica el pago.',
        appointment: {
          ...result.appointment,
          financials: result.financials,
        },
        financials: result.financials,
      })
    }

    if ((!appointmentId && !reservationCode) || (!businessId && !slug) || !proofUrl) {
      return NextResponse.json(
        {
          error:
            'Se requiere el código de reserva, la barbería y el comprobante de pago.',
        },
        { status: 400 }
      )
    }

    const result = await submitDepositProof({
      appointmentId,
      reservationCode,
      businessId,
      slug,
      proofUrl,
      depositChannelLabel,
      proofReference,
    })

    return NextResponse.json({
      success: true,
      message:
        'Comprobante recibido correctamente. El propietario verificará el ingreso para confirmar tu cita.',
      appointment: {
        ...result.appointment,
        financials: result.financials,
      },
      financials: result.financials,
    })
  } catch (error: unknown) {
    if (error instanceof BookingEngineError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      )
    }
    console.error('Public Deposit Proof Error:', error)
    const msg =
      error instanceof Error ? error.message : 'Error al adjuntar el comprobante'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
