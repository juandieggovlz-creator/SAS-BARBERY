import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function generateReservationCode() {
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
  const hex = randomBytes(4).toString('hex').toUpperCase()
  return `${dateStr}-${hex}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { businessId, serviceId, barberId, date, clientName, clientPhone, totalDuration } = body

    if (!businessId || !serviceId || !date || !clientName || !clientPhone) {
      return NextResponse.json(
        { error: 'Todos los campos (barbería, servicio, fecha, nombre y teléfono) son requeridos' },
        { status: 400 }
      )
    }

    // 1. Validate Business & Service
    const service = await prisma.service.findUnique({ where: { id: serviceId } })
    if (!service || service.businessId !== businessId || !service.isActive) {
      return NextResponse.json({ error: 'El servicio seleccionado no está disponible' }, { status: 400 })
    }

    const bookingDuration = (totalDuration && Number(totalDuration) > 0) ? Number(totalDuration) : service.duration

    const appointmentDate = new Date(date)
    if (isNaN(appointmentDate.getTime())) {
      return NextResponse.json({ error: 'Fecha seleccionada inválida' }, { status: 400 })
    }

    if (appointmentDate < new Date()) {
      return NextResponse.json({ error: 'No se pueden agendar citas en fechas pasadas' }, { status: 400 })
    }

    // 2. Select / Validate Barber
    let finalBarberId = barberId

    if (!finalBarberId) {
      // Find any active barber available at this time
      const activeBarbers = await prisma.barber.findMany({
        where: { businessId, status: 'ACTIVE' }
      })
      if (activeBarbers.length === 0) {
        return NextResponse.json({ error: 'No hay barberos disponibles en esta barbería' }, { status: 400 })
      }
      finalBarberId = activeBarbers[0].id
    }

    const barber = await prisma.barber.findUnique({ where: { id: finalBarberId } })
    if (!barber || barber.businessId !== businessId || barber.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'El barbero seleccionado no está disponible' }, { status: 400 })
    }

    // 3. Customer Deduplication by Phone & Business
    let client = await prisma.client.findFirst({
      where: {
        businessId,
        phone: clientPhone.trim()
      }
    })

    if (!client) {
      client = await prisma.client.create({
        data: {
          name: clientName.trim(),
          phone: clientPhone.trim(),
          businessId
        }
      })
    }

    // 4. Server-Side Double Booking Collision Validation
    const newStart = appointmentDate
    const newEnd = new Date(newStart.getTime() + bookingDuration * 60 * 1000)

    const dayOfWeek = newStart.getDay()
    const schedule = await prisma.barberSchedule.findFirst({
      where: { barberId: finalBarberId, dayOfWeek }
    })

    if (schedule && !schedule.isWorking) {
      return NextResponse.json({ error: 'El barbero no labora en este día' }, { status: 400 })
    }

    const startOfDay = new Date(newStart.getFullYear(), newStart.getMonth(), newStart.getDate())
    const endOfDay = new Date(newStart.getFullYear(), newStart.getMonth(), newStart.getDate(), 23, 59, 59)

    // Check overlaps with blocks
    const blocks = await prisma.barberBlock.findMany({
      where: {
        barberId: finalBarberId,
        date: { gte: startOfDay, lte: endOfDay }
      }
    })

    const pad = (n: number) => n.toString().padStart(2, '0')
    const reqTimeStr = `${pad(newStart.getHours())}:${pad(newStart.getMinutes())}`
    const reqEndTimeStr = `${pad(newEnd.getHours())}:${pad(newEnd.getMinutes())}`

    const hasOverlapBlock = blocks.some((b: { startTime: string; endTime: string }) => {
      return (reqTimeStr < b.endTime && reqEndTimeStr > b.startTime)
    })

    if (hasOverlapBlock) {
      return NextResponse.json({ error: 'El horario seleccionado coincide con una pausa del barbero' }, { status: 400 })
    }

    // Check overlaps with existing appointments
    const existingAppts = await prisma.appointment.findMany({
      where: {
        barberId: finalBarberId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        date: { gte: startOfDay, lte: endOfDay }
      },
      include: { service: true }
    })

    const hasConflict = existingAppts.some(appt => {
      const apptStart = new Date(appt.date)
      const apptEnd = new Date(apptStart.getTime() + appt.service.duration * 60 * 1000)
      return newStart < apptEnd && newEnd > apptStart
    })

    if (hasConflict) {
      return NextResponse.json(
        { error: 'El horario seleccionado ya no está disponible. Por favor elige otro horario.' },
        { status: 400 }
      )
    }

    // 5. Create Appointment with retry loop for unique reservationCode
    let attempts = 0
    while (attempts < 3) {
      try {
        const reservationCode = generateReservationCode()
        const appointment = await prisma.appointment.create({
          data: {
            businessId,
            clientId: client.id,
            barberId: finalBarberId,
            serviceId,
            date: newStart,
            status: 'PENDING',
            reservationCode
          },
          include: {
            client: true,
            barber: true,
            service: true,
            business: { select: { name: true, slug: true } }
          }
        })

        // Disparo asíncrono no bloqueante de confirmación de WhatsApp
        import('@/lib/whatsapp/whatsapp-service').then(({ WhatsAppService }) => {
          WhatsAppService.sendAppointmentConfirmation(appointment.id).catch(err => {
            console.error('Error enviando confirmación de WhatsApp:', err)
          })
        })

        return NextResponse.json({
          success: true,
          message: 'Reserva creada con éxito',
          appointment
        }, { status: 201 })
      } catch (error: unknown) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002' && attempts < 2) {
          attempts++
          continue
        }
        throw error
      }
    }

    return NextResponse.json({ error: 'Error al generar código de reserva' }, { status: 500 })
  } catch (error: unknown) {
    console.error('Public Appointment Creation Error:', error)
    const msg = error instanceof Error ? error.message : 'Error al procesar la reserva'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
