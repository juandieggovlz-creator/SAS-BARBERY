import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await getSession('BARBER')
  if (!session || !session.barberId || !session.businessId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const barber = await prisma.barber.findUnique({
      where: { id: session.barberId as string }
    })

    if (!barber || barber.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Barbero no encontrado' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim() || ''
    const filter = searchParams.get('filter') || 'ALL'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 50

    // Multi-tenant: Clients belong to the business
    const whereClause: Record<string, unknown> = {
      businessId: session.businessId
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } }
      ]
    }

    if (filter === 'MY_CLIENTS') {
      whereClause.appointments = { some: { barberId: barber.id } }
    }

    const allBusinessClients = await prisma.client.findMany({
      where: whereClause,
      include: {
        appointments: {
          include: {
            service: { select: { id: true, name: true, price: true } },
            barber: { select: { id: true, name: true } }
          },
          orderBy: { date: 'desc' }
        }
      },
      orderBy: { name: 'asc' }
    })

    const now = new Date()
    const fortyFiveDaysAgo = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    // Map and enrich client data with business & barber stats
    const mappedClients = allBusinessClients.map(c => {
      const allAppts = c.appointments
      const completedAppts = allAppts.filter(a => a.status === 'COMPLETED')
      const myAppts = allAppts.filter(a => a.barberId === barber.id)
      const completedWithMe = myAppts.filter(a => a.status === 'COMPLETED')

      const lastVisitAppt = completedAppts[0] ?? null
      const nextUpcomingAppt = [...allAppts]
        .reverse()
        .find(a => new Date(a.date) >= now && a.status !== 'CANCELLED' && a.status !== 'NO_SHOW') ?? null

      // Favorite service calculation
      const serviceCounts: Record<string, number> = {}
      completedAppts.forEach(a => {
        if (a.service?.name) {
          serviceCounts[a.service.name] = (serviceCounts[a.service.name] || 0) + 1
        }
      })
      const favoriteService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

      // Client lifecycle status
      let clientStatus: 'RECURRENT' | 'NEW' | 'ACTIVE' | 'INACTIVE' = 'ACTIVE'
      if (completedAppts.length >= 3) {
        clientStatus = 'RECURRENT'
      } else if (completedAppts.length <= 1 && new Date(c.createdAt) >= fourteenDaysAgo) {
        clientStatus = 'NEW'
      } else if (lastVisitAppt && new Date(lastVisitAppt.date) < fortyFiveDaysAgo) {
        clientStatus = 'INACTIVE'
      }

      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        internalNotes: c.internalNotes,
        createdAt: c.createdAt.toISOString(),
        totalVisits: completedAppts.length,
        visitsWithMe: completedWithMe.length,
        clientStatus,
        lastVisit: lastVisitAppt ? new Date(lastVisitAppt.date).toLocaleDateString('es-CO', {
          timeZone: 'America/Bogota', day: 'numeric', month: 'short', year: 'numeric'
        }) : null,
        lastVisitRaw: lastVisitAppt?.date ? lastVisitAppt.date.toISOString() : null,
        nextVisit: nextUpcomingAppt ? new Date(nextUpcomingAppt.date).toLocaleString('es-CO', {
          timeZone: 'America/Bogota', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        }) : null,
        nextVisitRaw: nextUpcomingAppt?.date ? nextUpcomingAppt.date.toISOString() : null,
        nextVisitBarber: nextUpcomingAppt?.barber?.name ?? null,
        favoriteService
      }
    })

    // Apply secondary in-memory filters
    let filtered = mappedClients
    if (filter === 'ACTIVE') {
      filtered = mappedClients.filter(c => c.clientStatus === 'ACTIVE' || c.clientStatus === 'RECURRENT')
    } else if (filter === 'NEW') {
      filtered = mappedClients.filter(c => c.clientStatus === 'NEW')
    } else if (filter === 'RECURRENT') {
      filtered = mappedClients.filter(c => c.totalVisits >= 3)
    } else if (filter === 'WITH_NEXT') {
      filtered = mappedClients.filter(c => c.nextVisit !== null)
    } else if (filter === 'NO_NEXT') {
      filtered = mappedClients.filter(c => c.nextVisit === null)
    }

    const totalCount = filtered.length
    const paginatedClients = filtered.slice((page - 1) * limit, page * limit)

    const totalMyClientsCount = mappedClients.filter(c => c.visitsWithMe > 0).length

    return NextResponse.json({
      clients: paginatedClients,
      total: totalCount,
      totalBusinessClients: mappedClients.length,
      totalMyClients: totalMyClientsCount,
      page,
      limit
    })
  } catch (error) {
    console.error('Barber Clients API Error:', error)
    return NextResponse.json({ error: 'Error al cargar clientes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession('BARBER')
  if (!session || !session.barberId || !session.businessId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, phone, email, initialNote } = body

    if (!name || !phone) {
      return NextResponse.json({ error: 'El nombre y el teléfono son obligatorios' }, { status: 400 })
    }

    const cleanPhone = phone.trim()
    const cleanName = name.trim()

    // 1. VALIDACIÓN DE DUPLICADOS EN EL MISMO BUSINESS
    const existingClient = await prisma.client.findFirst({
      where: {
        businessId: session.businessId,
        phone: cleanPhone
      },
      include: {
        appointments: {
          take: 3,
          orderBy: { date: 'desc' }
        }
      }
    })

    if (existingClient) {
      return NextResponse.json({
        exists: true,
        message: 'Ya existe un cliente registrado con este número de teléfono.',
        client: {
          id: existingClient.id,
          name: existingClient.name,
          phone: existingClient.phone,
          email: existingClient.email,
          createdAt: existingClient.createdAt.toISOString()
        }
      }, { status: 409 })
    }

    // 2. CREACIÓN DEL CLIENTE
    const newClient = await prisma.client.create({
      data: {
        businessId: session.businessId,
        name: cleanName,
        phone: cleanPhone,
        email: email?.trim() || null,
        internalNotes: initialNote?.trim() || null
      }
    })

    // 3. REGISTRO DE NOTA INICIAL SI EXISTE
    if (initialNote && initialNote.trim()) {
      const barber = await prisma.barber.findUnique({ where: { id: session.barberId } })
      await prisma.note.create({
        data: {
          businessId: session.businessId,
          clientId: newClient.id,
          title: `Nota Inicial (${barber?.name || 'Barbero'})`,
          content: initialNote.trim(),
          category: 'GENERAL',
          color: 'yellow'
        }
      })
    }

    return NextResponse.json({
      exists: false,
      message: 'Cliente registrado con éxito en el negocio.',
      client: newClient
    }, { status: 201 })
  } catch (error) {
    console.error('Create Client Error:', error)
    return NextResponse.json({ error: 'Error al registrar el cliente' }, { status: 500 })
  }
}
