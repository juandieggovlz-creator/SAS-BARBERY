import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import {
  BookingEngineError,
  createCentralizedBooking,
} from '@/lib/booking/booking-engine'
import { expireStaleHoldsForBusiness } from '@/lib/sync/availability-engine'
import { resolveAppointmentFinancials } from '@/lib/booking/booking-metadata'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const session = await getSession()
  if (!session || !session.businessId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  await expireStaleHoldsForBusiness(session.businessId)

  const where: { businessId: string; barberId?: string } = {
    businessId: session.businessId,
  }

  if (session.role === 'BARBER' && session.barberId) {
    where.barberId = session.barberId
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      client: true,
      barber: true,
      service: true,
      payment: true,
    },
    orderBy: { date: 'desc' },
  })

  const isBarberRole = session.role === 'BARBER'

  const enriched = appointments.map((appt) => {
    const financials = resolveAppointmentFinancials(appt)
    return {
      ...appt,
      notes: financials.cleanNotes || null,
      financials: {
        ...financials,
        // Privacidad por rol: el comprobante financiero sólo es visible para propietario / admin
        proofUrl: isBarberRole ? null : financials.proofUrl,
      },
    }
  })

  return NextResponse.json(enriched)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || !session.businessId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      clientId,
      clientName,
      clientPhone,
      clientEmail,
      barberId,
      serviceId,
      serviceIds,
      date,
      notes,
    } = body

    // Si es un barbero creando una cita, sólo puede asignarla a sí mismo
    const effectiveBarberId =
      session.role === 'BARBER' && session.barberId ? session.barberId : barberId

    const { appointment, financials } = await createCentralizedBooking({
      businessId: session.businessId,
      serviceId,
      serviceIds: Array.isArray(serviceIds) ? serviceIds : undefined,
      barberId: effectiveBarberId,
      date,
      clientId: clientId || null,
      clientName: clientName || null,
      clientPhone: clientPhone || null,
      clientEmail: clientEmail || null,
      notes: notes || null,
      source: session.role === 'BARBER' ? 'BARBER_DASHBOARD' : 'OWNER_DASHBOARD',
      skipPastDateCheck: true,
    })

    // Disparo asíncrono de confirmación de WhatsApp
    import('@/lib/whatsapp/whatsapp-service')
      .then(({ WhatsAppService }) => {
        WhatsAppService.sendAppointmentConfirmation(appointment.id).catch((err) => {
          console.error('Error enviando confirmación de WhatsApp:', err)
        })
      })
      .catch(() => {})

    return NextResponse.json(
      {
        ...appointment,
        notes: financials.cleanNotes || null,
        financials,
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
    const msg = error instanceof Error ? error.message : 'Error al crear la cita'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
