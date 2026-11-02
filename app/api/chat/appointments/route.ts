import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await getSession()
  if (!session || !session.businessId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.toLowerCase().trim() || ''

  try {
    const businessId = session.businessId as string

    // Query appointments of this business (recent and upcoming)
    const appointments = await prisma.appointment.findMany({
      where: {
        businessId,
        ...(session.role === 'BARBER' && session.barberId ? {
          // If barber, optionally prioritize or filter their appointments, but let them see appointments they need
          // To allow clarifying any doubt, we allow searching their appointments or all if search is provided
        } : {})
      },
      include: {
        client: { select: { name: true, phone: true, internalNotes: true } },
        barber: { select: { id: true, name: true, avatar: true } },
        service: { select: { name: true, price: true, duration: true } }
      },
      orderBy: { date: 'desc' },
      take: 50
    })

    const formatted = appointments
      .filter(app => {
        if (!query) return true
        const clientMatch = app.client?.name?.toLowerCase().includes(query)
        const phoneMatch = app.client?.phone?.toLowerCase().includes(query)
        const codeMatch = app.reservationCode?.toLowerCase().includes(query)
        const serviceMatch = app.service?.name?.toLowerCase().includes(query)
        const barberMatch = app.barber?.name?.toLowerCase().includes(query)
        return clientMatch || phoneMatch || codeMatch || serviceMatch || barberMatch
      })
      .map(app => ({
        id: app.id,
        reservationCode: app.reservationCode,
        clientName: app.client?.name || 'Cliente sin nombre',
        clientPhone: app.client?.phone || '',
        clientNotes: app.client?.internalNotes || null,
        serviceName: app.service?.name || 'Servicio',
        servicePrice: Number(app.service?.price || 0),
        barberId: app.barber?.id || '',
        barberName: app.barber?.name || 'Barbero asignado',
        date: app.date.toISOString(),
        status: app.status,
        notes: app.notes || null
      }))

    return NextResponse.json({ appointments: formatted })
  } catch (error) {
    console.error('Error fetching chat appointments:', error)
    return NextResponse.json({ error: 'Error al buscar citas' }, { status: 500 })
  }
}
