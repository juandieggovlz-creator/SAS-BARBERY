import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession('BARBER')
  if (!session || !session.barberId || !session.businessId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const barber = await prisma.barber.findUnique({
      where: { id: session.barberId }
    })

    if (!barber || barber.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Barbero no autorizado' }, { status: 403 })
    }

    // 1. Fetch Client with strictly isolated businessId
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        appointments: {
          include: {
            service: { select: { id: true, name: true, price: true, duration: true, category: true } },
            barber: { select: { id: true, name: true, specialty: true, avatar: true } },
            payment: { select: { id: true, status: true, amount: true, method: true, paidAt: true, paymentCode: true } }
          },
          orderBy: { date: 'desc' }
        }
      }
    })

    if (!client || client.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Cliente no encontrado en este negocio' }, { status: 404 })
    }

    // 2. Fetch Notes for this client
    // Security Rule: General notes are visible to everyone in the business.
    // Private notes are only visible if they belong to this barber (author tag or created by).
    const rawNotes = await prisma.note.findMany({
      where: {
        businessId: session.businessId,
        clientId: client.id
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }]
    })

    const visibleNotes = rawNotes.filter(n => {
      if (n.category === 'PRIVATE') {
        // Author check: Title contains barber name or note is private for this barber
        return n.title.includes(`[${barber.name}]`) || n.title.includes(barber.name)
      }
      return true
    }).map(n => ({
      id: n.id,
      title: n.title,
      content: n.content,
      isPinned: n.isPinned,
      category: n.category || 'GENERAL',
      color: n.color || 'yellow',
      createdAt: n.createdAt.toISOString(),
      isMyPrivateNote: n.category === 'PRIVATE' && (n.title.includes(barber.name) || n.title.includes(`[${barber.name}]`))
    }))

    // 3. Calculate Comprehensive Statistics
    const allAppointments = client.appointments
    const completedAppts = allAppointments.filter(a => a.status === 'COMPLETED')
    const myAppts = allAppointments.filter(a => a.barberId === barber.id)
    const completedWithMe = myAppts.filter(a => a.status === 'COMPLETED')

    const totalSpent = completedAppts.reduce((sum, a) => sum + Number(a.service?.price || 0), 0)
    const totalSpentWithMe = completedWithMe.reduce((sum, a) => sum + Number(a.service?.price || 0), 0)

    const now = new Date()
    const lastVisit = completedAppts[0] ? completedAppts[0].date.toISOString() : null
    const nextVisit = [...allAppointments].reverse().find(a => new Date(a.date) >= now && !['CANCELLED', 'NO_SHOW'].includes(a.status))?.date.toISOString() || null

    // Favorite Service
    const serviceCounts: Record<string, { count: number; name: string; price: number }> = {}
    completedAppts.forEach(a => {
      if (a.service?.name) {
        if (!serviceCounts[a.service.name]) {
          serviceCounts[a.service.name] = { count: 0, name: a.service.name, price: Number(a.service.price || 0) }
        }
        serviceCounts[a.service.name].count++
      }
    })
    const favoriteServices = Object.values(serviceCounts).sort((a, b) => b.count - a.count)

    // Favorite Barber in Business
    const barberCounts: Record<string, { count: number; name: string }> = {}
    completedAppts.forEach(a => {
      if (a.barber?.name) {
        barberCounts[a.barber.name] = barberCounts[a.barber.name] || { count: 0, name: a.barber.name }
        barberCounts[a.barber.name].count++
      }
    })
    const favoriteBarber = Object.values(barberCounts).sort((a, b) => b.count - a.count)[0]?.name || null

    // Average days between visits
    let avgDaysBetweenVisits: number | null = null
    if (completedAppts.length >= 2) {
      const sortedDates = [...completedAppts].map(a => new Date(a.date).getTime()).sort((a, b) => a - b)
      let totalDiffDays = 0
      for (let i = 1; i < sortedDates.length; i++) {
        totalDiffDays += (sortedDates[i] - sortedDates[i - 1]) / (1000 * 60 * 60 * 24)
      }
      avgDaysBetweenVisits = Math.round(totalDiffDays / (sortedDates.length - 1))
    }

    return NextResponse.json({
      client: {
        id: client.id,
        name: client.name,
        phone: client.phone,
        email: client.email,
        internalNotes: client.internalNotes,
        createdAt: client.createdAt.toISOString()
      },
      stats: {
        totalVisits: completedAppts.length,
        visitsWithMe: completedWithMe.length,
        totalSpent,
        totalSpentWithMe,
        lastVisit,
        nextVisit,
        avgDaysBetweenVisits,
        favoriteService: favoriteServices[0]?.name || null,
        favoriteServices,
        favoriteBarber,
        registeredSince: client.createdAt.toISOString()
      },
      allAppointments: allAppointments.map(a => ({
        id: a.id,
        reservationCode: a.reservationCode,
        date: a.date.toISOString(),
        time: new Date(a.date).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit' }),
        formattedDate: new Date(a.date).toLocaleDateString('es-CO', { timeZone: 'America/Bogota', day: 'numeric', month: 'short', year: 'numeric' }),
        serviceName: a.service?.name ?? 'Servicio',
        servicePrice: Number(a.service?.price ?? 0),
        duration: a.service?.duration ?? 30,
        barberName: a.barber?.name ?? 'Barbero',
        barberId: a.barberId,
        isMe: a.barberId === barber.id,
        status: a.status,
        paymentStatus: a.payment?.status ?? 'PENDING',
        paymentMethod: a.payment?.method ?? null,
        notes: a.notes
      })),
      notes: visibleNotes
    })
  } catch (error) {
    console.error('Get Client Detail Error:', error)
    return NextResponse.json({ error: 'Error al obtener la ficha técnica del cliente' }, { status: 500 })
  }
}

// Actualizar información básica o notas internas del cliente
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession('BARBER')
  if (!session || !session.barberId || !session.businessId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { name, phone, email, internalNotes } = body

    const existingClient = await prisma.client.findUnique({ where: { id } })
    if (!existingClient || existingClient.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    const updated = await prisma.client.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(phone ? { phone: phone.trim() } : {}),
        ...(email !== undefined ? { email: email?.trim() || null } : {}),
        ...(internalNotes !== undefined ? { internalNotes: internalNotes?.trim() || null } : {})
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update Client Error:', error)
    return NextResponse.json({ error: 'Error al actualizar el cliente' }, { status: 500 })
  }
}
