import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function generateReservationCode() {
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
  const hex = randomBytes(4).toString('hex').toUpperCase()
  return `${dateStr}-${hex}`
}

export async function GET() {
  const session = await getSession()
  if (!session || !session.businessId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const where: { businessId: string; barberId?: string } = {
    businessId: session.businessId
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
  return NextResponse.json(appointments)
}

export async function POST(request: Request) {
  const session = await getSession()
  const body = await request.json()
  const { clientId, barberId, serviceId, date } = body

  // Determine businessId from Session or from Barber/Service
  let businessId = session?.businessId || null
  
  const service = await prisma.service.findUnique({ where: { id: serviceId } })
  if (!service) return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 400 })

  if (!businessId) {
    businessId = service.businessId
  } else if (service.businessId !== businessId) {
    return NextResponse.json({ error: 'El servicio no pertenece a tu negocio' }, { status: 403 })
  }

  // Resolve client ID either directly or via clientName & clientPhone
  let finalClientId = clientId
  if (!finalClientId && body.clientName && businessId) {
    const cleanName = String(body.clientName).trim()
    const cleanPhone = String(body.clientPhone || '0000000000').trim()
    let client = await prisma.client.findFirst({
      where: {
        businessId,
        name: { equals: cleanName, mode: 'insensitive' }
      }
    })
    if (!client) {
      client = await prisma.client.create({
        data: {
          businessId,
          name: cleanName,
          phone: cleanPhone
        }
      })
    }
    finalClientId = client.id
  }

  if (!finalClientId || !barberId || !serviceId || !date) {
    return NextResponse.json({ error: 'Datos de la cita incompletos' }, { status: 400 })
  }

  const barber = await prisma.barber.findUnique({ where: { id: barberId } })
  if (!barber || barber.businessId !== businessId) {
    return NextResponse.json({ error: 'Barbero no encontrado o no pertenece a este negocio' }, { status: 400 })
  }

  const newStart = new Date(date)
  const newEnd = new Date(newStart.getTime() + service.duration * 60000)

  // 1. Barber Schedule Check
  const dayOfWeek = newStart.getDay() // 0-6
  const schedule = await prisma.barberSchedule.findFirst({
    where: { barberId, dayOfWeek }
  })

  if (!schedule) {
    return NextResponse.json({ error: 'El barbero no tiene horario configurado para este día.' }, { status: 400 })
  }

  if (!schedule.isWorking) {
    return NextResponse.json({ error: 'El barbero no trabaja este día.' }, { status: 400 })
  }

  const pad = (n: number) => n.toString().padStart(2, '0')
  const reqTimeStr = `${pad(newStart.getHours())}:${pad(newStart.getMinutes())}`
  const reqEndTimeStr = `${pad(newEnd.getHours())}:${pad(newEnd.getMinutes())}`

  if (reqTimeStr < schedule.startTime || reqEndTimeStr > schedule.endTime) {
    return NextResponse.json({ error: `El horario laboral es de ${schedule.startTime} a ${schedule.endTime}.` }, { status: 400 })
  }

  // 2. Personal Blocks Check
  const startOfDay = new Date(newStart.getFullYear(), newStart.getMonth(), newStart.getDate())
  const blocks = await prisma.barberBlock.findMany({
    where: { 
      barberId,
      date: {
        gte: startOfDay,
        lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
      }
    }
  })

  const hasOverlapBlock = blocks.some((b: { startTime: string; endTime: string }) => {
    return (reqTimeStr < b.endTime && reqEndTimeStr > b.startTime)
  })

  if (hasOverlapBlock) {
     return NextResponse.json({ error: 'El barbero no está disponible en este horario (Bloqueado temporalmente).' }, { status: 400 })
  }

  // 3. Appointments Solapamientos Check
  const existingAppts = await prisma.appointment.findMany({
    where: {
      barberId,
      status: { in: ['PENDING', 'CONFIRMED'] },
      date: {
        gte: startOfDay,
        lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
      }
    },
    include: { service: true }
  })

  const hasConflict = existingAppts.some(appt => {
    const existingStart = new Date(appt.date)
    const existingEnd = new Date(existingStart.getTime() + appt.service.duration * 60000)
    return newStart < existingEnd && newEnd > existingStart
  })

  if (hasConflict) {
    return NextResponse.json({ error: 'Este barbero ya tiene una cita en ese horario' }, { status: 400 })
  }

  let attempts = 0
  const maxAttempts = 2

  while (attempts < maxAttempts) {
    try {
      const reservationCode = generateReservationCode()
      const appointment = await prisma.appointment.create({
        data: { 
          businessId,
          clientId: finalClientId, 
          barberId, 
          serviceId, 
          date: new Date(date),
          reservationCode
        },
        include: { client: true, barber: true, service: true },
      })

      // Disparo de confirmación de WhatsApp
      import('@/lib/whatsapp/whatsapp-service').then(({ WhatsAppService }) => {
        WhatsAppService.sendAppointmentConfirmation(appointment.id).catch(err => {
          console.error('Error enviando confirmación de WhatsApp:', err)
        })
      })

      return NextResponse.json(appointment, { status: 201 })
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'P2002' && attempts < maxAttempts - 1) {
        attempts++
        continue
      }
      const msg = error instanceof Error ? error.message : 'Error al crear la cita'
      return NextResponse.json(
        { error: msg }, 
        { status: 500 }
      )
    }
  }
  
  return NextResponse.json({ error: 'Fallo al generar código único' }, { status: 500 })
}
